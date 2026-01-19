import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain } from 'electron';

import { IpcChannels } from './channels';
import { createProvider, getProviderCredentials, parseModelId } from './lib/provider-factory';

/** Request payload for generating clarifying questions */
export interface ClarificationGenerateRequest {
  customPrompt?: string;
  featureRequest: string;
  featureRequestId: number;
  modelId: string; // Format: "provider:modelId"
}

/** Stream chunk sent to renderer during clarification generation */
export interface ClarificationStreamChunk {
  content?: string;
  toolArgs?: unknown;
  toolCallId?: string;
  toolName?: string;
  toolResult?: unknown;
  type: 'error' | 'finish' | 'text' | 'tool_call' | 'tool_result';
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

      const { customPrompt, featureRequest, modelId } = request;

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

            case 'finish':
              chunk = {
                type: 'finish',
              };
              break;

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
