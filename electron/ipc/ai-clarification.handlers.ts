import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';

import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

import { IpcChannels } from './channels';

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

/** API key provider identifiers */
type ApiKeyProvider = 'anthropic' | 'google' | 'openai';

/** Environment variable names for each provider */
const PROVIDER_ENV_VARS: Record<ApiKeyProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_KEY',
  openai: 'OPENAI_API_KEY',
};

/** Store namespace for API keys */
const API_KEYS_NAMESPACE = 'apiKeys';

interface StoredApiKeyData {
  encrypted: string;
}

interface StoreType {
  get(key: string): unknown;
}

const store = new Store() as unknown as StoreType;

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

      // Get the API key for the provider
      const apiKey = getApiKey(provider);
      if (!apiKey) {
        return { error: `No API key configured for ${provider}`, success: false };
      }

      try {
        // Create abort controller for cancellation
        activeAbortController = new AbortController();

        // Dynamic imports for AI SDK
        const { stepCountIs, streamText } = await import('ai');
        const { clarificationTool } = await import('../../lib/ai/tools/clarification-tool');
        const { buildClarificationPrompt } = await import('../../lib/ai/prompts/clarification');

        // Create the provider instance
        const providerInstance = await createProvider(provider, apiKey);

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

/**
 * Creates an AI provider instance based on the provider type
 */
async function createProvider(
  provider: ApiKeyProvider,
  apiKey: string
): Promise<{
  model: (modelId: string) => unknown;
}> {
  switch (provider) {
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({ apiKey });
      return { model: (modelId: string) => anthropic(modelId) };
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({ apiKey });
      return { model: (modelId: string) => google(modelId) };
    }
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey });
      return { model: (modelId: string) => openai(modelId) };
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Decrypts a stored API key
 */
function decryptStoredKey(encrypted: string): null | string {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }
  try {
    const buffer = Buffer.from(encrypted, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    return null;
  }
}

/**
 * Gets the API key for a provider (user-stored or environment)
 */
function getApiKey(provider: ApiKeyProvider): null | string {
  // Check for user-stored key first
  const storedData = getStoredKeyData(provider);
  if (storedData) {
    const decryptedKey = decryptStoredKey(storedData.encrypted);
    if (decryptedKey) {
      return decryptedKey;
    }
  }

  // Fall back to environment variable
  return getEnvApiKey(provider) ?? null;
}

/**
 * Gets the environment variable value for a provider
 */
function getEnvApiKey(provider: ApiKeyProvider): string | undefined {
  const envVar = PROVIDER_ENV_VARS[provider];
  return process.env[envVar];
}

/**
 * Retrieves stored API key data for a provider
 */
function getStoredKeyData(provider: ApiKeyProvider): StoredApiKeyData | undefined {
  const storeKey = getStoreKey(provider);
  return store.get(storeKey) as StoredApiKeyData | undefined;
}

/**
 * Gets the store key for a provider's API key
 */
function getStoreKey(provider: ApiKeyProvider): string {
  return `${API_KEYS_NAMESPACE}.${provider}`;
}

/**
 * Parses a full model ID into provider and model
 */
function parseModelId(fullModelId: string): { modelId: string; provider: ApiKeyProvider } {
  const [provider, ...rest] = fullModelId.split(':');
  return {
    modelId: rest.join(':'),
    provider: provider as ApiKeyProvider,
  };
}
