import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { AiUsageLogsRepository } from '../../db/repositories/ai-usage-logs.repository';

import { estimateCost } from '../../lib/ai/pricing';
import { IpcChannels } from './channels';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

/** Request payload for generating clarifying questions */
export interface ClarificationGenerateRequest {
  customPrompt?: string;
  featureRequest: string;
  featureRequestId: number;
  modelId: string; // Format: "provider:modelId"
  projectId?: number; // Optional project ID for usage tracking
}

/** Stream chunk sent to renderer during clarification generation */
export interface ClarificationStreamChunk {
  content?: string;
  toolArgs?: unknown;
  toolCallId?: string;
  toolName?: string;
  toolResult?: unknown;
  type: 'error' | 'finish' | 'text' | 'tool_call' | 'tool_result';
  usage?: ClarificationUsageData;
}

/** Usage data returned after clarification generation completes */
export interface ClarificationUsageData {
  durationMs: number;
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiClarificationHandlers(
  getMainWindow: () => BrowserWindow | null,
  aiUsageLogsRepository: AiUsageLogsRepository
): void {
  // Generate clarifying questions with streaming
  ipcMain.handle(
    IpcChannels.ai.clarification.generate,
    async (
      _event: IpcMainInvokeEvent,
      request: ClarificationGenerateRequest
    ): Promise<{ error?: string; success: boolean }> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { error: 'Main window not available', success: false };
      }

      const { customPrompt, featureRequest, modelId, projectId } = request;

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
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { clarificationTool } = await import('../../lib/ai/tools/clarification-tool');
        const { buildClarificationPrompt } = await import('../../lib/ai/prompts/clarification');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Build the prompt
        const prompt = buildClarificationPrompt(featureRequest, customPrompt);

        // Stream the response
        const result = streamText({
          abortSignal: activeAbortController.signal,
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          stopWhen: stepCountIs(2), // Allow tool call and response
          tools: {
            generateClarifyingQuestions: clarificationTool,
          },
        });

        // Process the stream and send chunks to renderer
        for await (const part of result.fullStream) {
          if (activeAbortController?.signal.aborted) {
            break;
          }

          let chunk: ClarificationStreamChunk;

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

              // Calculate estimated cost
              const estimatedCostUsd = estimateCost(model, inputTokens, outputTokens);

              // Log successful usage to database
              try {
                aiUsageLogsRepository.create({
                  durationMs,
                  errorMessage: null,
                  estimatedCostUsd,
                  inputTokens,
                  modelId: model,
                  modelProvider: provider,
                  operationType: 'clarification',
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
                  totalTokens,
                },
              };
              break;
            }

            case 'text-delta':
              chunk = {
                content: part.text,
                type: 'text',
              };
              break;

            case 'tool-call':
              chunk = {
                toolArgs: part.input,
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                type: 'tool_call',
              };
              break;

            case 'tool-result':
              chunk = {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                toolResult: part.output,
                type: 'tool_result',
              };
              break;

            default:
              // Skip other event types (step-start, step-finish, etc.)
              continue;
          }

          mainWindow.webContents.send(IpcChannels.ai.clarification.stream, chunk);
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
              operationType: 'clarification',
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

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during clarification generation';

        // Log failed operation
        try {
          aiUsageLogsRepository.create({
            durationMs,
            errorMessage,
            estimatedCostUsd: 0,
            inputTokens: 0,
            modelId: model,
            modelProvider: provider,
            operationType: 'clarification',
            outputTokens: 0,
            projectId: projectId ?? null,
            success: false,
            totalTokens: 0,
          });
        } catch (logError) {
          console.error('Failed to log AI usage:', logError);
        }

        // Send error chunk to renderer
        mainWindow.webContents.send(IpcChannels.ai.clarification.stream, {
          content: errorMessage,
          type: 'error',
        } satisfies ClarificationStreamChunk);

        return { error: errorMessage, success: false };
      }
    }
  );

  // Cancel ongoing clarification generation
  ipcMain.handle(IpcChannels.ai.clarification.cancel, async (): Promise<void> => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
  });
}
