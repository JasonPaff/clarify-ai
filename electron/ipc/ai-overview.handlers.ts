import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { AiUsageLogsRepository } from '@/db/repositories/ai-usage-logs.repository';

import { estimateCostWithTokenlens } from '../lib/tokenlens';
import { IpcChannels } from './channels';
import { collectRepositoryData } from './fs.handlers';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

/** Default thinking budget in tokens for models that support extended thinking */
const DEFAULT_THINKING_BUDGET = 10000;

/** Usage data returned after overview generation completes */
export interface OverviewUsageData {
  durationMs: number;
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
}

/** Request payload for generating repository overview */
export interface RepositoryOverviewGenerateRequest {
  customPrompt?: string;
  modelId: string; // Format: "provider:modelId"
  projectId?: number; // Optional project ID for usage tracking
  repositoryId: number;
  repositoryPath: string;
}

/** Stream chunk sent to renderer during overview generation */
export interface RepositoryOverviewStreamChunk {
  content?: string;
  type: 'error' | 'finish' | 'reasoning' | 'reasoning_end' | 'reasoning_start' | 'text';
  usage?: OverviewUsageData;
}

/** Provider type for API key providers */
type ApiKeyProvider = 'anthropic' | 'google' | 'openai';

/**
 * Build provider options to enable thinking/reasoning for supported models
 */
function buildThinkingProviderOptions(
  provider: ApiKeyProvider,
  supportsThinking: boolean
): Record<string, unknown> | undefined {
  if (!supportsThinking) {
    return undefined;
  }

  switch (provider) {
    case 'anthropic':
      return {
        anthropic: {
          thinking: { budgetTokens: DEFAULT_THINKING_BUDGET, type: 'enabled' },
        },
      };
    case 'google':
      return {
        google: {
          thinkingConfig: { includeThoughts: true, thinkingBudget: DEFAULT_THINKING_BUDGET },
        },
      };
    case 'openai':
      return {
        openai: { reasoningEffort: 'medium' },
      };
    default:
      return undefined;
  }
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiOverviewHandlers(
  getMainWindow: () => BrowserWindow | null,
  aiUsageLogsRepository: AiUsageLogsRepository
): void {
  // Generate repository overview with streaming
  ipcMain.handle(
    IpcChannels.ai.repositoryOverview.generate,
    async (
      _event: IpcMainInvokeEvent,
      request: RepositoryOverviewGenerateRequest
    ): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const { customPrompt, modelId, projectId, repositoryPath } = request;

      // Parse the model ID to get provider and model
      const { modelId: model, provider } = parseModelId(modelId);

      // Get the credentials for the provider
      const credentials = getProviderCredentials(provider);
      if (!credentials) {
        return { error: `No credentials configured for ${provider}`, success: false };
      }

      // Capture start time for duration tracking
      const startTime = Date.now();

      try {
        // Collect repository data
        const repoData = await collectRepositoryData(repositoryPath);
        if (!repoData) {
          return { error: 'Failed to collect repository data', success: false };
        }

        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Dynamic imports for AI SDK
        const { streamText } = await import('ai');
        const { buildRepositoryOverviewPrompt } = await import('../../lib/ai/prompts/repository-overview');
        const { getModelInfo } = await import('../../lib/ai/models');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Build the prompt
        const prompt = buildRepositoryOverviewPrompt(repoData, customPrompt);

        // Check if the model supports thinking and build provider options
        const modelInfo = getModelInfo(modelId as `${ApiKeyProvider}:${string}`);
        const supportsThinking = modelInfo?.supportsThinking ?? false;
        const providerOptions = buildThinkingProviderOptions(provider as ApiKeyProvider, supportsThinking);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          ...(providerOptions && { providerOptions }),
        } as Parameters<typeof streamText>[0]);

        // Process the stream and send chunks to renderer
        for await (const part of result.fullStream) {
          if (activeAbortController?.signal.aborted) {
            break;
          }

          let chunk: RepositoryOverviewStreamChunk;

          switch (part.type) {
            case 'error':
              chunk = {
                content: String(part.error),
                type: 'error',
              };
              break;

            case 'finish': {
              // Calculate duration
              const durationMs = Date.now() - startTime;

              // Get usage from the finish event
              const usage = part.totalUsage;
              const inputTokens = usage?.inputTokens ?? 0;
              const outputTokens = usage?.outputTokens ?? 0;
              const totalTokens = usage?.totalTokens ?? 0;
              const reasoningTokens = usage?.outputTokenDetails?.reasoningTokens ?? undefined;

              // Calculate estimated cost using tokenlens with provider for accurate lookup
              const estimatedCostUsd = await estimateCostWithTokenlens(model, inputTokens, outputTokens, provider);

              // Log successful usage to database
              try {
                aiUsageLogsRepository.create({
                  durationMs,
                  errorMessage: null,
                  estimatedCostUsd,
                  inputTokens,
                  modelId: model,
                  modelProvider: provider,
                  operationType: 'repository_overview',
                  outputTokens,
                  projectId: projectId ?? null,
                  success: true,
                  totalTokens,
                });
              } catch (logError) {
                // Don't fail the operation if logging fails
                console.error('Failed to log AI usage:', logError);
              }

              chunk = {
                type: 'finish',
                usage: {
                  durationMs,
                  estimatedCostUsd,
                  inputTokens,
                  outputTokens,
                  reasoningTokens,
                  totalTokens,
                },
              };
              break;
            }

            case 'reasoning-delta':
              chunk = {
                content: part.text,
                type: 'reasoning',
              };
              break;

            case 'reasoning-end':
              chunk = { type: 'reasoning_end' };
              break;

            case 'reasoning-start':
              chunk = { type: 'reasoning_start' };
              break;

            case 'text-delta':
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.repositoryOverview.stream, chunk);
        }

        // Clean up
        activeAbortController = null;

        return { success: true };
      } catch (error) {
        activeAbortController = null;

        // Calculate duration for failed operation
        const durationMs = Date.now() - startTime;

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          // Log cancelled operation
          try {
            aiUsageLogsRepository.create({
              durationMs,
              errorMessage: 'Generation cancelled',
              estimatedCostUsd: 0,
              inputTokens: 0,
              modelId: model,
              modelProvider: provider,
              operationType: 'repository_overview',
              outputTokens: 0,
              projectId: projectId ?? null,
              success: false,
              totalTokens: 0,
            });
          } catch (logError) {
            console.error('Failed to log AI usage:', logError);
          }

          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during overview generation';

        // Log failed operation
        try {
          aiUsageLogsRepository.create({
            durationMs,
            errorMessage,
            estimatedCostUsd: 0,
            inputTokens: 0,
            modelId: model,
            modelProvider: provider,
            operationType: 'repository_overview',
            outputTokens: 0,
            projectId: projectId ?? null,
            success: false,
            totalTokens: 0,
          });
        } catch (logError) {
          console.error('Failed to log AI usage:', logError);
        }

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.repositoryOverview.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies RepositoryOverviewStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing overview generation
  ipcMain.handle(IpcChannels.ai.repositoryOverview.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}
