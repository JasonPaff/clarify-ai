import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import type { ClarificationContextFile, ClarificationRepositoryOverview } from '@/lib/ai/prompts/clarification';

import type { ApiKeyProvider } from './lib/provider-types';

export type { ClarificationContextFile, ClarificationRepositoryOverview } from '../../lib/ai/prompts/clarification';

import { IpcChannels } from './channels';
import { buildThinkingStreamOptions } from './lib/ai-utils';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

/** Request payload for generating clarifying questions */
export interface ClarificationGenerateRequest {
  contextFiles?: Array<ClarificationContextFile>;
  customPrompt?: string;
  enableThinking?: boolean;
  featureRequest: string;
  featureRequestId: number;
  maxTokens?: number;
  modelId: string; // Format: "provider:modelId"
  repositoryOverviews?: Array<ClarificationRepositoryOverview>;
  temperature?: number;
  thinkingBudget?: number;
}

/** Stream chunk sent to renderer during clarification generation */
export interface ClarificationStreamChunk {
  content?: string;
  toolArgs?: unknown;
  toolCallId?: string;
  toolName?: string;
  toolResult?: unknown;
  type: 'error' | 'finish' | 'reasoning' | 'reasoning_end' | 'reasoning_start' | 'text' | 'tool_call' | 'tool_result';
  usage?: {
    inputTokens: number;
    outputTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
}

// Active abort controller for cancellation
let activeAbortController: AbortController | null = null;

export function registerAiClarificationHandlers(getMainWindow: () => BrowserWindow | null): void {
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

      const {
        contextFiles,
        customPrompt,
        enableThinking = true,
        featureRequest,
        maxTokens,
        modelId,
        repositoryOverviews,
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

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { clarificationTool } = await import('../../lib/ai/tools/clarification-tool');
        const { buildClarificationPrompt } = await import('../../lib/ai/prompts/clarification');
        const { getModelInfo } = await import('../../lib/ai/models');

        // Create the provider instance
        const providerInstance = await createProvider(provider, credentials);

        // Build the prompt
        const prompt = buildClarificationPrompt(featureRequest, repositoryOverviews, contextFiles, customPrompt);

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
          ...(maxTokens && { maxTokens }),
          model: providerInstance.model(model) as Parameters<typeof streamText>[0]['model'],
          prompt,
          stopWhen: stepCountIs(2), // Allow tool call and response
          tools: {
            generateClarifyingQuestions: clarificationTool,
          },
          ...thinkingOptions,
        } as Parameters<typeof streamText>[0]);

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

            case 'tool-call':
              console.log('[DEBUG] Tool call received:');
              console.log('  toolName:', part.toolName);
              console.log('  toolCallId:', part.toolCallId);
              console.log('  input type:', typeof part.input);
              console.log('  input constructor:', part.input?.constructor?.name);
              console.log('  input value:', JSON.stringify(part.input, null, 2)?.slice(0, 500));
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

        // Check if it was an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          return { error: 'Generation cancelled', success: false };
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error during clarification generation';

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
