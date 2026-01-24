import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { AiLoggingService } from './lib/ai-logging-service';
import type { ApiKeyProvider } from './lib/provider-types';

import { IpcChannels } from './channels';
import { collectRepositoryData } from './fs.handlers';
import { buildThinkingStreamOptions } from './lib/ai-utils';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

/** Request payload for generating repository overview */
export interface RepositoryOverviewGenerateRequest {
  customPrompt?: string;
  enableThinking?: boolean;
  maxTokens?: number;
  modelId: string; // Format: "provider:modelId"
  projectId?: number;
  repositoryId: number;
  repositoryPath: string;
  temperature?: number;
  thinkingBudget?: number;
}

/** Stream chunk sent to renderer during overview generation */
export interface RepositoryOverviewStreamChunk {
  content?: string;
  type: 'error' | 'finish' | 'reasoning' | 'reasoning_end' | 'reasoning_start' | 'text';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiOverviewHandlers(
  getMainWindow: () => BrowserWindow | null,
  loggingService: AiLoggingService
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

      const {
        customPrompt,
        enableThinking = true,
        maxTokens,
        modelId,
        repositoryPath,
        temperature,
        thinkingBudget,
      } = request;

      // Parse the model ID to get provider and model
      const { modelId: model, provider } = parseModelId(modelId);

      // Get the credentials for the provider
      const credentials = getProviderCredentials(provider);
      if (!credentials) {
        return { error: `No credentials configured for ${provider}`, success: false };
      }

      // Start logging operation (outside try block so it's accessible in catch)
      // Note: overview does not have featureRequestId, use 'describe' workflow step
      const logResult = loggingService.startOperation({
        modelId,
        projectId: request.projectId,
        requestBody: request,
        workflowStep: 'describe',
      });
      const requestId = logResult?.requestId;

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

        // Check if the model supports thinking and build stream options
        // Only enable thinking when both the model supports it AND the user has enabled it
        const modelInfo = getModelInfo(modelId as `${ApiKeyProvider}:${string}`);
        const supportsThinking = modelInfo?.supportsThinking ?? false;
        const shouldEnableThinking = supportsThinking && enableThinking;
        const thinkingOptions = buildThinkingStreamOptions(
          provider as ApiKeyProvider,
          shouldEnableThinking,
          temperature,
          thinkingBudget
        );

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          ...(maxTokens !== undefined && { maxTokens }),
          ...thinkingOptions,
        } as Parameters<typeof streamText>[0]);

        // Accumulate response text and reasoning for logging
        let accumulatedText = '';
        let accumulatedReasoning = '';

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
              const usage = part.totalUsage;
              chunk = {
                type: 'finish',
                usage: usage
                  ? {
                      inputTokens: usage.inputTokens ?? 0,
                      outputTokens: usage.outputTokens ?? 0,
                      reasoningTokens: usage.outputTokenDetails?.reasoningTokens ?? undefined,
                      totalTokens: usage.totalTokens ?? 0,
                    }
                  : undefined,
              };

              // Complete logging operation
              if (requestId) {
                loggingService.completeOperation({
                  inputTokens: usage?.inputTokens,
                  outputTokens: usage?.outputTokens,
                  reasoningBody: accumulatedReasoning || undefined,
                  reasoningTokens: usage?.outputTokenDetails?.reasoningTokens,
                  requestId,
                  responseBody: accumulatedText || undefined,
                });
              }
              break;
            }

            case 'reasoning-delta':
              chunk = {
                content: part.text,
                type: 'reasoning',
              };

              // Accumulate reasoning for reasoningBody logging
              accumulatedReasoning += part.text;

              // Log reasoning chunk
              if (requestId) {
                loggingService.recordStreamChunk({
                  content: part.text,
                  requestId,
                  type: 'reasoning',
                });
              }
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

              // Accumulate text for responseBody logging
              accumulatedText += part.text;

              // Log text chunk
              if (requestId) {
                loggingService.recordStreamChunk({
                  content: part.text,
                  requestId,
                  type: 'text',
                });
              }
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.repositoryOverview.stream, chunk);
        }

        // Check if we broke due to cancellation
        if (activeAbortController?.signal.aborted) {
          if (requestId) {
            loggingService.cancelOperation({ requestId });
          }
          activeAbortController = null;
          return { error: 'Generation cancelled', success: false };
        }

        // Clean up
        activeAbortController = null;

        return { success: true };
      } catch (error) {
        activeAbortController = null;

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          // Log cancellation
          if (requestId) {
            loggingService.cancelOperation({ requestId });
          }
          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during overview generation';

        // Log the failure
        if (requestId) {
          loggingService.failOperation({
            error: errorMessage,
            requestId,
          });
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
