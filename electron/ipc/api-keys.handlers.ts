import type { IpcMainInvokeEvent } from 'electron';

import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

import { IpcChannels } from './channels';
import {
  ALL_PROVIDERS,
  type ApiKeyProvider,
  getProviderEnvVar,
  PROVIDER_CONFIGS,
  PROVIDER_DISPLAY_NAMES,
  type ProviderCredentials,
  validateProviderCredentials,
} from './lib/provider-types';

// Re-export types for use by other modules
export type { ApiKeyProvider, ProviderCredentials } from './lib/provider-types';

/** API key info returned to the renderer (with masked value) */
export interface ApiKeyInfo {
  createdAt?: string;
  /** Deployment name for Azure OpenAI (not masked, shown for identification) */
  deploymentName?: string;
  /** Endpoint URL for Azure/Ollama (not masked, shown for identification) */
  endpoint?: string;
  /** Whether AWS credentials are configured (for Bedrock) */
  hasAwsCredentials?: boolean;
  isConfigured: boolean;
  maskedKey: string;
  notes?: string;
  provider: ApiKeyProvider;
  /** AWS region for Bedrock (not masked, shown for identification) */
  region?: string;
  source: ApiKeySource;
  updatedAt?: string;
}

/** Source of an API key */
export type ApiKeySource = 'environment' | 'user';

/** Input for setting an API key */
export interface SetApiKeyInput {
  /** AWS access key ID (for Bedrock) */
  accessKeyId?: string;
  /** Deployment name (for Azure OpenAI) */
  deploymentName?: string;
  /** Custom endpoint URL (for Azure, Ollama) */
  endpoint?: string;
  /** API key (optional for Ollama) - backward compatible, now optional */
  key?: string;
  notes?: string;
  provider: ApiKeyProvider;
  /** AWS region (for Bedrock) */
  region?: string;
  /** AWS secret access key (for Bedrock) */
  secretAccessKey?: string;
}

/** Stored API key data structure in electron-store */
interface StoredApiKeyData {
  createdAt: string;
  /** Deployment name for Azure OpenAI (stored as plaintext for display) */
  deploymentName?: string;
  /** Encrypted API key (base64 encoded) */
  encrypted?: string;
  /** Encrypted AWS access key ID for Bedrock (base64 encoded) */
  encryptedAccessKeyId?: string;
  /** Encrypted AWS secret access key for Bedrock (base64 encoded) */
  encryptedSecretAccessKey?: string;
  /** Endpoint URL for Azure/Ollama (stored as plaintext for display) */
  endpoint?: string;
  notes?: string;
  /** AWS region for Bedrock (stored as plaintext for display) */
  region?: string;
  updatedAt: string;
}

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
    // Return all providers, not just major ones
    const providers = ALL_PROVIDERS;
    const result: Array<ApiKeyInfo> = [];

    for (const provider of providers) {
      const config = PROVIDER_CONFIGS[provider];
      const storedData = getStoredKeyData(provider);

      // Check for user-stored credentials first
      if (storedData) {
        const apiKeyInfo = buildApiKeyInfoFromStored(provider, storedData, config.authType);
        if (apiKeyInfo) {
          result.push(apiKeyInfo);
          continue;
        }
      }

      // Check for environment variables (backward compatible)
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

      // Check for environment-based credentials for enterprise providers
      const envCredentials = getEnvCredentials(provider);
      if (envCredentials) {
        result.push({
          ...envCredentials,
          isConfigured: true,
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
    (
      _event: IpcMainInvokeEvent,
      provider: ApiKeyProvider
    ): {
      credentials?: ProviderCredentials;
      error?: string;
      key?: string;
      source?: ApiKeySource;
    } => {
      const config = PROVIDER_CONFIGS[provider];

      // Check for user-stored credentials first
      const storedData = getStoredKeyData(provider);
      if (storedData) {
        const credentials = decryptStoredCredentials(storedData, config.authType);
        if (credentials) {
          return {
            credentials,
            // Backward compatible: also return key for simple providers
            key: credentials.apiKey,
            source: 'user',
          };
        }
        return { error: 'Failed to decrypt stored credentials' };
      }

      // Check for environment variable (backward compatible)
      const envKey = getEnvApiKey(provider);
      if (envKey) {
        return {
          credentials: { apiKey: envKey },
          key: envKey,
          source: 'environment',
        };
      }

      // Check for environment-based credentials for enterprise providers
      const envCredentials = getEnvCredentialsDecrypted(provider);
      if (envCredentials) {
        return {
          credentials: envCredentials,
          key: envCredentials.apiKey,
          source: 'environment',
        };
      }

      return { error: `No API key configured for ${provider}` };
    }
  );

  // Set an API key (encrypts and stores)
  ipcMain.handle(
    IpcChannels.apiKeys.set,
    (_event: IpcMainInvokeEvent, input: SetApiKeyInput): { error?: string; success: boolean } => {
      const { accessKeyId, deploymentName, endpoint, key, notes, provider, region, secretAccessKey } = input;
      const config = PROVIDER_CONFIGS[provider];

      // Build credentials object from input
      const credentials: ProviderCredentials = {
        accessKeyId,
        apiKey: key,
        deploymentName,
        endpoint,
        region,
        secretAccessKey,
      };

      // Validate required credentials for the provider
      const missingFields = validateProviderCredentials(provider, credentials);
      if (missingFields.length > 0) {
        return {
          error: `Missing required fields for ${provider}: ${missingFields.join(', ')}`,
          success: false,
        };
      }

      // Encryption required for providers that have sensitive credentials
      if (config.authType !== 'none' && !safeStorage.isEncryptionAvailable()) {
        return { error: 'Encryption is not available on this system', success: false };
      }

      const now = new Date().toISOString();
      const existingData = getStoredKeyData(provider);

      // Build stored data with encrypted sensitive fields
      const data: StoredApiKeyData = {
        createdAt: existingData?.createdAt ?? now,
        // Store non-sensitive fields as plaintext for display
        deploymentName,
        endpoint,
        notes,
        region,
        updatedAt: now,
      };

      // Encrypt sensitive credentials based on auth type
      if (key?.trim()) {
        const encrypted = encryptKey(key);
        if (!encrypted) {
          return { error: 'Failed to encrypt API key', success: false };
        }
        data.encrypted = encrypted;
      }

      if (accessKeyId?.trim()) {
        const encrypted = encryptKey(accessKeyId);
        if (!encrypted) {
          return { error: 'Failed to encrypt AWS access key ID', success: false };
        }
        data.encryptedAccessKeyId = encrypted;
      }

      if (secretAccessKey?.trim()) {
        const encrypted = encryptKey(secretAccessKey);
        if (!encrypted) {
          return { error: 'Failed to encrypt AWS secret access key', success: false };
        }
        data.encryptedSecretAccessKey = encrypted;
      }

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
      provider: ApiKeyProvider,
      credentialsToTest?: ProviderCredentials
    ): Promise<{ error?: string; provider: string; success: boolean }> => {
      const config = PROVIDER_CONFIGS[provider];

      // Build credentials from provided test credentials, stored credentials, or environment
      let credentials: null | ProviderCredentials = credentialsToTest ?? null;

      if (!credentials) {
        const storedData = getStoredKeyData(provider);
        if (storedData) {
          credentials = decryptStoredCredentials(storedData, config.authType);
        }
      }

      if (!credentials) {
        // Try environment-based credentials
        const envCredentials = getEnvCredentialsDecrypted(provider);
        if (envCredentials) {
          credentials = envCredentials;
        } else {
          // Fall back to simple API key from environment
          const envKey = getEnvApiKey(provider);
          if (envKey) {
            credentials = { apiKey: envKey };
          }
        }
      }

      // Validate that we have required credentials for this provider
      if (!credentials) {
        // Special case: Ollama doesn't require credentials
        if (config.authType === 'none') {
          credentials = { endpoint: 'http://localhost:11434' };
        } else {
          return {
            error: `No credentials configured for ${PROVIDER_DISPLAY_NAMES[provider]}`,
            provider,
            success: false,
          };
        }
      }

      try {
        switch (provider) {
          case 'anthropic':
            return await testAnthropicKey(credentials);
          case 'azure':
            return await testAzureKey(credentials);
          case 'bedrock':
            return await testBedrockCredentials(credentials);
          case 'cohere':
            return await testCohereKey(credentials);
          case 'deepseek':
            return await testDeepSeekKey(credentials);
          case 'google':
            return await testGoogleKey(credentials);
          case 'groq':
            return await testGroqKey(credentials);
          case 'mistral':
            return await testMistralKey(credentials);
          case 'ollama':
            return await testOllamaConnection(credentials);
          case 'openai':
            return await testOpenAIKey(credentials);
          case 'togetherai':
            return await testTogetherAiKey(credentials);
          case 'xai':
            return await testXaiKey(credentials);
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
 * Builds ApiKeyInfo from stored data based on auth type.
 */
function buildApiKeyInfoFromStored(
  provider: ApiKeyProvider,
  storedData: StoredApiKeyData,
  authType: import('./lib/provider-types').ProviderAuthType
): ApiKeyInfo | null {
  switch (authType) {
    case 'api_key': {
      if (!storedData.encrypted) return null;
      const decryptedKey = decryptStoredKey(storedData.encrypted);
      if (!decryptedKey) return null;

      return {
        createdAt: storedData.createdAt,
        isConfigured: true,
        maskedKey: maskApiKey(decryptedKey),
        notes: storedData.notes,
        provider,
        source: 'user',
        updatedAt: storedData.updatedAt,
      };
    }

    case 'aws': {
      if (!storedData.encryptedAccessKeyId || !storedData.encryptedSecretAccessKey) return null;
      const decryptedAccessKeyId = decryptStoredKey(storedData.encryptedAccessKeyId);
      if (!decryptedAccessKeyId) return null;

      return {
        createdAt: storedData.createdAt,
        hasAwsCredentials: true,
        isConfigured: true,
        maskedKey: maskApiKey(decryptedAccessKeyId),
        notes: storedData.notes,
        provider,
        region: storedData.region,
        source: 'user',
        updatedAt: storedData.updatedAt,
      };
    }

    case 'azure': {
      if (!storedData.encrypted) return null;
      const decryptedKey = decryptStoredKey(storedData.encrypted);
      if (!decryptedKey) return null;

      return {
        createdAt: storedData.createdAt,
        deploymentName: storedData.deploymentName,
        endpoint: storedData.endpoint,
        isConfigured: true,
        maskedKey: maskApiKey(decryptedKey),
        notes: storedData.notes,
        provider,
        source: 'user',
        updatedAt: storedData.updatedAt,
      };
    }

    case 'none': {
      // Ollama - always configured (local)
      return {
        createdAt: storedData.createdAt,
        endpoint: storedData.endpoint ?? 'http://localhost:11434',
        isConfigured: true,
        maskedKey: '', // No API key for Ollama
        notes: storedData.notes,
        provider,
        source: 'user',
        updatedAt: storedData.updatedAt,
      };
    }

    default:
      return null;
  }
}

/**
 * Decrypts stored credentials based on auth type.
 */
function decryptStoredCredentials(
  storedData: StoredApiKeyData,
  authType: import('./lib/provider-types').ProviderAuthType
): null | ProviderCredentials {
  switch (authType) {
    case 'api_key': {
      if (!storedData.encrypted) return null;
      const apiKey = decryptStoredKey(storedData.encrypted);
      if (!apiKey) return null;
      return { apiKey };
    }

    case 'aws': {
      if (!storedData.encryptedAccessKeyId || !storedData.encryptedSecretAccessKey) return null;
      const accessKeyId = decryptStoredKey(storedData.encryptedAccessKeyId);
      const secretAccessKey = decryptStoredKey(storedData.encryptedSecretAccessKey);
      if (!accessKeyId || !secretAccessKey) return null;

      return {
        accessKeyId,
        region: storedData.region,
        secretAccessKey,
      };
    }

    case 'azure': {
      if (!storedData.encrypted) return null;
      const apiKey = decryptStoredKey(storedData.encrypted);
      if (!apiKey) return null;

      return {
        apiKey,
        deploymentName: storedData.deploymentName,
        endpoint: storedData.endpoint,
      };
    }

    case 'none': {
      // Ollama - return endpoint
      return {
        endpoint: storedData.endpoint ?? 'http://localhost:11434',
      };
    }

    default:
      return null;
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
 * Extracts the resource name from an Azure OpenAI endpoint URL
 */
function extractAzureResourceName(endpoint: string): string {
  try {
    const url = new URL(endpoint);
    // Endpoint format: https://{resource-name}.openai.azure.com
    const parts = url.hostname.split('.');
    return parts[0] ?? '';
  } catch {
    return '';
  }
}

/**
 * Gets the environment variable value for a provider
 */
function getEnvApiKey(provider: ApiKeyProvider): string | undefined {
  const envVar = getProviderEnvVar(provider);
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Gets environment-based credentials for enterprise providers (Azure, Bedrock).
 * Returns partial ApiKeyInfo for display (masked values).
 */
function getEnvCredentials(provider: ApiKeyProvider): null | Omit<ApiKeyInfo, 'isConfigured' | 'provider' | 'source'> {
  const config = PROVIDER_CONFIGS[provider];

  switch (config.authType) {
    case 'aws': {
      const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
      const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
      const region = process.env['AWS_REGION'] ?? process.env['AWS_DEFAULT_REGION'];

      if (accessKeyId && secretAccessKey && region) {
        return {
          hasAwsCredentials: true,
          maskedKey: maskApiKey(accessKeyId),
          region,
        };
      }
      return null;
    }

    case 'azure': {
      const apiKey = process.env['AZURE_OPENAI_API_KEY'];
      const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
      const deploymentName = process.env['AZURE_OPENAI_DEPLOYMENT'];

      if (apiKey && endpoint) {
        return {
          deploymentName,
          endpoint,
          maskedKey: maskApiKey(apiKey),
        };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Gets decrypted environment credentials for API calls.
 */
function getEnvCredentialsDecrypted(provider: ApiKeyProvider): null | ProviderCredentials {
  const config = PROVIDER_CONFIGS[provider];

  switch (config.authType) {
    case 'aws': {
      const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
      const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
      const region = process.env['AWS_REGION'] ?? process.env['AWS_DEFAULT_REGION'];

      if (accessKeyId && secretAccessKey && region) {
        return {
          accessKeyId,
          region,
          secretAccessKey,
        };
      }
      return null;
    }

    case 'azure': {
      const apiKey = process.env['AZURE_OPENAI_API_KEY'];
      const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
      const deploymentName = process.env['AZURE_OPENAI_DEPLOYMENT'];

      if (apiKey && endpoint) {
        return {
          apiKey,
          deploymentName,
          endpoint,
        };
      }
      return null;
    }

    case 'none': {
      // Ollama - check for custom endpoint
      const endpoint = process.env['OLLAMA_BASE_URL'] ?? process.env['OLLAMA_ENDPOINT'];
      return { endpoint: endpoint ?? 'http://localhost:11434' };
    }

    default:
      return null;
  }
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
 * Masks an API key for display, showing only the last 4 characters
 */
function maskApiKey(key: string): string {
  if (key.length <= 4) {
    return '****';
  }
  return `${'*'.repeat(Math.min(key.length - 4, 20))}${key.slice(-4)}`;
}

// ============================================================================
// Provider Test Functions
// ============================================================================

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
async function testAnthropicKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'anthropic';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    // Dynamic import to avoid bundling issues
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const { generateText } = await import('ai');

    const anthropic = createAnthropic({ apiKey: credentials.apiKey });

    // Make a minimal API call with the smallest model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: anthropic('claude-3-haiku-20240307'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests Azure OpenAI credentials by making a minimal API call
 * Requires API key, endpoint, and optionally deployment name
 */
async function testAzureKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'azure';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  if (!credentials.endpoint) {
    return {
      error: `Endpoint URL is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  // Validate endpoint URL format
  try {
    const url = new URL(credentials.endpoint);
    if (!url.hostname.includes('openai.azure.com') && !url.hostname.includes('azure.com')) {
      return {
        error: `Invalid Azure endpoint: URL should be an Azure OpenAI endpoint (e.g., https://your-resource.openai.azure.com)`,
        provider,
        success: false,
      };
    }
  } catch {
    return {
      error: `Invalid endpoint URL format for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createAzure } = await import('@ai-sdk/azure');
    const { generateText } = await import('ai');

    const azure = createAzure({
      apiKey: credentials.apiKey,
      resourceName: extractAzureResourceName(credentials.endpoint),
    });

    // Use provided deployment or fall back to a common default
    const deploymentName = credentials.deploymentName ?? 'gpt-4o-mini';

    await generateText({
      maxOutputTokens: 1,
      model: azure(deploymentName),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests AWS Bedrock credentials by making a minimal API call
 * Requires access key ID, secret access key, and region
 */
async function testBedrockCredentials(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'bedrock';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.accessKeyId) {
    return {
      error: `AWS Access Key ID is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  if (!credentials.secretAccessKey) {
    return {
      error: `AWS Secret Access Key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  if (!credentials.region) {
    return {
      error: `AWS Region is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createAmazonBedrock } = await import('@ai-sdk/amazon-bedrock');
    const { generateText } = await import('ai');

    const bedrock = createAmazonBedrock({
      accessKeyId: credentials.accessKeyId,
      region: credentials.region,
      secretAccessKey: credentials.secretAccessKey,
    });

    // Use Claude Haiku on Bedrock as a lightweight test model
    await generateText({
      maxOutputTokens: 1,
      model: bedrock('anthropic.claude-3-haiku-20240307-v1:0'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Cohere API key using a minimal chat API call
 * Note: Cohere uses /v2/chat endpoint with response format message.content[0].text
 */
async function testCohereKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'cohere';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createCohere } = await import('@ai-sdk/cohere');
    const { generateText } = await import('ai');

    const cohere = createCohere({ apiKey: credentials.apiKey });

    // Use command-light for a minimal test
    await generateText({
      maxOutputTokens: 1,
      model: cohere('command-r'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a DeepSeek API key using the official AI SDK provider
 */
async function testDeepSeekKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'deepseek';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createDeepSeek } = await import('@ai-sdk/deepseek');
    const { generateText } = await import('ai');

    const deepseek = createDeepSeek({ apiKey: credentials.apiKey });

    await generateText({
      maxOutputTokens: 1,
      model: deepseek('deepseek-chat'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Google AI API key using a minimal generateContent call
 * Uses the Vercel AI SDK's Google provider
 */
async function testGoogleKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'google';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    // Dynamic import to avoid bundling issues
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    const { generateText } = await import('ai');

    const google = createGoogleGenerativeAI({ apiKey: credentials.apiKey });

    // Make a minimal API call with a small model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: google('gemini-1.5-flash'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Groq API key using a minimal API call
 */
async function testGroqKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'groq';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createGroq } = await import('@ai-sdk/groq');
    const { generateText } = await import('ai');

    const groq = createGroq({ apiKey: credentials.apiKey });

    // Use llama for a fast test
    await generateText({
      maxOutputTokens: 1,
      model: groq('llama-3.1-8b-instant'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Mistral API key using a minimal API call
 */
async function testMistralKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'mistral';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createMistral } = await import('@ai-sdk/mistral');
    const { generateText } = await import('ai');

    const mistral = createMistral({ apiKey: credentials.apiKey });

    // Use mistral-small for a fast test
    await generateText({
      maxOutputTokens: 1,
      model: mistral('mistral-small-latest'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests Ollama endpoint connectivity
 * No API key required - just verifies the endpoint is accessible via /api/tags
 */
async function testOllamaConnection(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'ollama';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];
  const endpoint = credentials.endpoint ?? 'http://localhost:11434';

  try {
    // Validate endpoint URL format
    const url = new URL(endpoint);
    const tagsUrl = `${url.origin}/api/tags`;

    // Make a simple GET request to list available models
    const response = await fetch(tagsUrl, {
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: `${displayName} endpoint not found. Make sure Ollama is running at ${endpoint}`,
          provider,
          success: false,
        };
      }
      return {
        error: `${displayName} returned status ${response.status}: ${response.statusText}`,
        provider,
        success: false,
      };
    }

    // Try to parse the response to verify it's a valid Ollama endpoint
    const data = (await response.json()) as { models?: Array<unknown> };
    if (!data || typeof data !== 'object') {
      return {
        error: `Invalid response from ${displayName} endpoint`,
        provider,
        success: false,
      };
    }

    return { provider, success: true };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        error: `Cannot connect to ${displayName} at ${endpoint}. Make sure Ollama is running.`,
        provider,
        success: false,
      };
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        error: `Connection to ${displayName} timed out. Make sure Ollama is running and accessible.`,
        provider,
        success: false,
      };
    }
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests an OpenAI API key using a minimal completion API call
 * Uses the Vercel AI SDK's OpenAI provider
 */
async function testOpenAIKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'openai';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    // Dynamic import to avoid bundling issues
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');

    const openai = createOpenAI({ apiKey: credentials.apiKey });

    // Make a minimal API call with a small model and minimal tokens
    await generateText({
      maxOutputTokens: 1,
      model: openai('gpt-4o-mini'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests a Together AI API key using the official AI SDK provider
 */
async function testTogetherAiKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'togetherai';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createTogetherAI } = await import('@ai-sdk/togetherai');
    const { generateText } = await import('ai');

    const together = createTogetherAI({ apiKey: credentials.apiKey });

    // Use a small, fast model for testing
    await generateText({
      maxOutputTokens: 1,
      model: together('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}

/**
 * Tests an xAI (Grok) API key using a minimal API call
 */
async function testXaiKey(credentials: ProviderCredentials): Promise<TestResult> {
  const provider = 'xai';
  const displayName = PROVIDER_DISPLAY_NAMES[provider];

  if (!credentials.apiKey) {
    return {
      error: `API key is required for ${displayName}`,
      provider,
      success: false,
    };
  }

  try {
    const { createXai } = await import('@ai-sdk/xai');
    const { generateText } = await import('ai');

    const xai = createXai({ apiKey: credentials.apiKey });

    await generateText({
      maxOutputTokens: 1,
      model: xai('grok-2'),
      prompt: 'Hi',
    });

    return { provider, success: true };
  } catch (error) {
    return {
      error: parseApiError(error, displayName),
      provider,
      success: false,
    };
  }
}
