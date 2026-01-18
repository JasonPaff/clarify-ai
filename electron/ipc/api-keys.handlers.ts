import { ipcMain, type IpcMainInvokeEvent, safeStorage } from 'electron';
import Store from 'electron-store';

import { IpcChannels } from './channels';

/** API key info returned to the renderer (with masked value) */
export interface ApiKeyInfo {
  createdAt?: string;
  isConfigured: boolean;
  maskedKey: string;
  notes?: string;
  provider: ApiKeyProvider;
  source: ApiKeySource;
  updatedAt?: string;
}

/** Supported AI provider identifiers */
export type ApiKeyProvider = 'anthropic' | 'google' | 'openai';

/** Source of an API key */
export type ApiKeySource = 'environment' | 'user';

/** Input for setting an API key */
export interface SetApiKeyInput {
  key: string;
  notes?: string;
  provider: ApiKeyProvider;
}

/** Stored API key data structure in electron-store */
interface StoredApiKeyData {
  createdAt: string;
  encrypted: string;
  notes?: string;
  updatedAt: string;
}

/** Environment variable names for each provider */
const PROVIDER_ENV_VARS: Record<ApiKeyProvider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_KEY',
  openai: 'OPENAI_API_KEY',
};

/** Store namespace for API keys */
const API_KEYS_NAMESPACE = 'apiKeys';

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

/** Test result type */
interface TestResult {
  error?: string;
  provider: string;
  success: boolean;
}

export function registerApiKeysHandlers(): void {
  // Check if encryption is available
  ipcMain.handle(IpcChannels.apiKeys.isEncryptionAvailable, (): boolean => {
    return safeStorage.isEncryptionAvailable();
  });

  // Get all configured API keys (returns masked values)
  ipcMain.handle(IpcChannels.apiKeys.getAll, (): Array<ApiKeyInfo> => {
    const providers: Array<ApiKeyProvider> = ['anthropic', 'google', 'openai'];
    const result: Array<ApiKeyInfo> = [];

    for (const provider of providers) {
      // Check for user-stored key first
      const storedData = getStoredKeyData(provider);
      if (storedData) {
        const decryptedKey = decryptStoredKey(storedData.encrypted);
        if (decryptedKey) {
          result.push({
            createdAt: storedData.createdAt,
            isConfigured: true,
            maskedKey: maskApiKey(decryptedKey),
            notes: storedData.notes,
            provider,
            source: 'user',
            updatedAt: storedData.updatedAt,
          });
          continue;
        }
      }

      // Check for environment variable
      const envKey = getEnvApiKey(provider);
      if (envKey) {
        result.push({
          isConfigured: true,
          maskedKey: maskApiKey(envKey),
          provider,
          source: 'environment',
        });
        continue;
      }

      // Not configured
      result.push({
        isConfigured: false,
        maskedKey: '',
        provider,
        source: 'user',
      });
    }

    return result;
  });

  // Get a specific API key (returns decrypted value for API calls)
  ipcMain.handle(
    IpcChannels.apiKeys.get,
    (_event: IpcMainInvokeEvent, provider: ApiKeyProvider): { error?: string; key?: string; source?: ApiKeySource } => {
      // Check for user-stored key first
      const storedData = getStoredKeyData(provider);
      if (storedData) {
        const decryptedKey = decryptStoredKey(storedData.encrypted);
        if (decryptedKey) {
          return { key: decryptedKey, source: 'user' };
        }
        return { error: 'Failed to decrypt stored key' };
      }

      // Check for environment variable
      const envKey = getEnvApiKey(provider);
      if (envKey) {
        return { key: envKey, source: 'environment' };
      }

      return { error: `No API key configured for ${provider}` };
    }
  );

  // Set an API key (encrypts and stores)
  ipcMain.handle(
    IpcChannels.apiKeys.set,
    (_event: IpcMainInvokeEvent, input: SetApiKeyInput): { error?: string; success: boolean } => {
      const { key, notes, provider } = input;

      if (!key || key.trim().length === 0) {
        return { error: 'API key cannot be empty', success: false };
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { error: 'Encryption is not available on this system', success: false };
      }

      const encrypted = encryptKey(key);
      if (!encrypted) {
        return { error: 'Failed to encrypt API key', success: false };
      }

      const now = new Date().toISOString();
      const existingData = getStoredKeyData(provider);

      const data: StoredApiKeyData = {
        createdAt: existingData?.createdAt ?? now,
        encrypted,
        notes,
        updatedAt: now,
      };

      try {
        const storeKey = getStoreKey(provider);
        store.set(storeKey, data);
        return { success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to store API key',
          success: false,
        };
      }
    }
  );

  // Delete an API key
  ipcMain.handle(
    IpcChannels.apiKeys.delete,
    (_event: IpcMainInvokeEvent, provider: ApiKeyProvider): { error?: string; success: boolean } => {
      try {
        const storeKey = getStoreKey(provider);
        store.delete(storeKey);
        return { success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to delete API key',
          success: false,
        };
      }
    }
  );

  // Test an API key by making a minimal API call
  ipcMain.handle(
    IpcChannels.apiKeys.test,
    async (
      _event: IpcMainInvokeEvent,
      provider: ApiKeyProvider
    ): Promise<{ error?: string; provider: string; success: boolean }> => {
      // Get the API key for this provider
      const storedData = getStoredKeyData(provider);
      let apiKey: null | string = null;

      if (storedData) {
        apiKey = decryptStoredKey(storedData.encrypted);
      }

      if (!apiKey) {
        apiKey = getEnvApiKey(provider) ?? null;
      }

      if (!apiKey) {
        return {
          error: `No API key configured for ${provider}`,
          provider,
          success: false,
        };
      }

      try {
        switch (provider) {
          case 'anthropic':
            return await testAnthropicKey(apiKey);
          case 'google':
            return await testGoogleKey(apiKey);
          case 'openai':
            return await testOpenAIKey(apiKey);
          default:
            return {
              error: `Unknown provider: ${provider}`,
              provider,
              success: false,
            };
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error during API key test',
          provider,
          success: false,
        };
      }
    }
  );
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
 * Encrypts an API key for storage
 */
function encryptKey(key: string): null | string {
  if (!safeStorage.isEncryptionAvailable()) {
    return null;
  }
  try {
    const buffer = safeStorage.encryptString(key);
    return buffer.toString('base64');
  } catch {
    return null;
  }
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
  const data = store.get(storeKey) as StoredApiKeyData | undefined;
  return data;
}

/**
 * Gets the store key for a provider's API key
 */
function getStoreKey(provider: ApiKeyProvider): string {
  return `${API_KEYS_NAMESPACE}.${provider}`;
}

/**
 * Masks an API key for display, showing only the last 4 characters
 */
function maskApiKey(key: string): string {
  if (key.length <= 4) {
    return '****';
  }
  return `${'*'.repeat(Math.min(key.length - 4, 20))}${key.slice(-4)}`;
}

/**
 * Parses error messages from API responses
 */
function parseApiError(error: unknown, provider: string): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Common authentication errors
    if (message.includes('invalid') && message.includes('key')) {
      return `Invalid API key for ${provider}`;
    }
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return `Authentication failed for ${provider}. Please check your API key.`;
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return `Rate limit reached for ${provider}. Key is valid but temporarily limited.`;
    }
    if (message.includes('quota') || message.includes('exceeded')) {
      return `API quota exceeded for ${provider}. Key is valid but has no remaining usage.`;
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('enotfound')) {
      return `Network error connecting to ${provider}. Please check your internet connection.`;
    }
    if (message.includes('timeout')) {
      return `Connection timeout for ${provider}. Please try again.`;
    }

    return error.message;
  }
  return `Unknown error testing ${provider} API key`;
}

/**
 * Tests an Anthropic API key using a minimal messages API call
 * Uses the Vercel AI SDK's Anthropic provider
 */
async function testAnthropicKey(apiKey: string): Promise<TestResult> {
  const provider = 'anthropic';
  try {
    // Dynamic import to avoid bundling issues
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const { generateText } = await import('ai');

    const anthropic = createAnthropic({ apiKey });

    // Make a minimal API call with the smallest model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: anthropic('claude-3-haiku-20240307'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, provider),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Google AI API key using a minimal generateContent call
 * Uses the Vercel AI SDK's Google provider
 */
async function testGoogleKey(apiKey: string): Promise<TestResult> {
  const provider = 'google';
  try {
    // Dynamic import to avoid bundling issues
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    const { generateText } = await import('ai');

    const google = createGoogleGenerativeAI({ apiKey });

    // Make a minimal API call with a small model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: google('gemini-1.5-flash'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, provider),
      provider,
      success: false,
    };
  }
}

/**
 * Tests an OpenAI API key using a minimal completion API call
 * Uses the Vercel AI SDK's OpenAI provider
 */
async function testOpenAIKey(apiKey: string): Promise<TestResult> {
  const provider = 'openai';
  try {
    // Dynamic import to avoid bundling issues
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const openai = createOpenAI({ apiKey });

    // Make a minimal API call with a small model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: openai('gpt-4o-mini'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, provider),
      provider,
      success: false,
    };
  }
}
