/**
 * Centralized provider factory - single source of truth for AI provider instantiation and API key retrieval.
 *
 * This module consolidates the duplicated createProvider() and getApiKey() functions
 * from individual handler files into a shared factory.
 */

import { safeStorage } from 'electron';
import Store from 'electron-store';

import { type ApiKeyProvider, getProviderEnvVar, PROVIDER_CONFIGS, type ProviderCredentials } from './provider-types';

// ============================================================================
// Types
// ============================================================================

/** Parsed model identifier */
export interface ParsedModelId {
  modelId: string;
  provider: ApiKeyProvider;
}

/** Provider instance with model factory */
export interface ProviderInstance {
  model: (modelId: string) => unknown;
}

/** Stored API key data structure */
interface StoredApiKeyData {
  encrypted: string;
}

/** Store interface for type safety */
interface StoreType {
  get(key: string): unknown;
}

// ============================================================================
// Constants
// ============================================================================

/** Store namespace for API keys */
const API_KEYS_NAMESPACE = 'apiKeys';

/** Singleton store instance */
const store = new Store() as unknown as StoreType;

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Default Ollama endpoint for local installations.
 */
const DEFAULT_OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';

/**
 * Creates an AI provider instance based on the provider type.
 * Uses dynamic imports to load only the required provider SDK.
 *
 * Supports all 12 providers:
 * - Major: anthropic, google, openai
 * - Emerging: mistral, cohere, xai, groq, deepseek, togetherai
 * - Enterprise: bedrock, azure
 * - Local: ollama
 *
 * @param provider - The provider type
 * @param credentials - The provider credentials (varies by provider)
 * @returns A provider instance with a model factory function
 * @throws Error if the provider is unknown or required credentials are missing
 */
export async function createProvider(
  provider: ApiKeyProvider,
  credentials: ProviderCredentials
): Promise<ProviderInstance> {
  const config = PROVIDER_CONFIGS[provider];

  // Validate required credentials based on auth type
  switch (config.authType) {
    case 'api_key':
      if (!credentials.apiKey) {
        throw new Error(`API key required for provider: ${provider}`);
      }
      break;
    case 'aws':
      if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.region) {
        throw new Error(`AWS credentials (accessKeyId, secretAccessKey, region) required for provider: ${provider}`);
      }
      break;
    case 'azure':
      if (!credentials.apiKey || !credentials.endpoint) {
        throw new Error(`API key and endpoint required for provider: ${provider}`);
      }
      break;
    case 'none':
      // No validation needed (e.g., Ollama)
      break;
  }

  switch (provider) {
    // ========================================================================
    // Major Providers
    // ========================================================================
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      const anthropic = createAnthropic({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => anthropic(modelId) };
    }
    case 'azure': {
      const { createAzure } = await import('@ai-sdk/azure');
      const azure = createAzure({
        apiKey: credentials.apiKey!,
        resourceName: credentials.endpoint!, // Azure resource name extracted from endpoint
      });
      // For Azure, we need to handle deployment name in the model ID
      return {
        model: (modelId: string) => {
          // If deploymentName is provided, use it; otherwise use the modelId as deployment name
          const deploymentName = credentials.deploymentName ?? modelId;
          return azure(deploymentName);
        },
      };
    }
    // ========================================================================
    // Enterprise Providers
    // ========================================================================
    case 'bedrock': {
      const { createAmazonBedrock } = await import('@ai-sdk/amazon-bedrock');
      const bedrock = createAmazonBedrock({
        accessKeyId: credentials.accessKeyId!,
        region: credentials.region!,
        secretAccessKey: credentials.secretAccessKey!,
      });
      return { model: (modelId: string) => bedrock(modelId) };
    }

    case 'cohere': {
      const { createCohere } = await import('@ai-sdk/cohere');
      const cohere = createCohere({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => cohere(modelId) };
    }
    case 'deepseek': {
      const { createDeepSeek } = await import('@ai-sdk/deepseek');
      const deepseek = createDeepSeek({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => deepseek(modelId) };
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      const google = createGoogleGenerativeAI({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => google(modelId) };
    }
    case 'groq': {
      const { createGroq } = await import('@ai-sdk/groq');
      const groq = createGroq({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => groq(modelId) };
    }
    // ========================================================================
    // Emerging Providers
    // ========================================================================
    case 'mistral': {
      const { createMistral } = await import('@ai-sdk/mistral');
      const mistral = createMistral({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => mistral(modelId) };
    }
    // ========================================================================
    // Local Providers
    // ========================================================================
    case 'ollama': {
      const { createOllama } = await import('ollama-ai-provider');
      const ollama = createOllama({
        baseURL: credentials.endpoint ?? DEFAULT_OLLAMA_ENDPOINT,
      });
      return { model: (modelId: string) => ollama(modelId) };
    }

    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const openai = createOpenAI({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => openai(modelId) };
    }
    case 'openrouter': {
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');
      const openrouter = createOpenRouter({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => openrouter(modelId) };
    }
    case 'togetherai': {
      const { createTogetherAI } = await import('@ai-sdk/togetherai');
      const togetherai = createTogetherAI({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => togetherai(modelId) };
    }

    case 'xai': {
      const { createXai } = await import('@ai-sdk/xai');
      const xai = createXai({ apiKey: credentials.apiKey! });
      return { model: (modelId: string) => xai(modelId) };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// ============================================================================
// API Key Retrieval
// ============================================================================

/**
 * Gets the API key for a provider.
 * First checks for user-stored encrypted key, then falls back to environment variable.
 *
 * @param provider - The provider to get the API key for
 * @returns The API key or null if not available
 */
export function getApiKey(provider: ApiKeyProvider): null | string {
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
 * Gets the complete credentials for a provider.
 * Builds a ProviderCredentials object with all required fields based on provider type.
 *
 * For most providers, this just returns the API key.
 * For enterprise providers (Azure, Bedrock), this retrieves additional credentials
 * from environment variables.
 * For local providers (Ollama), this returns an empty object (no auth required).
 *
 * @param provider - The provider to get credentials for
 * @returns ProviderCredentials object or null if required credentials are not available
 */
export function getProviderCredentials(provider: ApiKeyProvider): null | ProviderCredentials {
  const config = PROVIDER_CONFIGS[provider];

  switch (config.authType) {
    case 'api_key': {
      const apiKey = getApiKey(provider);
      if (!apiKey) return null;
      return { apiKey };
    }

    case 'aws': {
      // AWS Bedrock requires access key, secret key, and region
      const accessKeyId = getApiKey(provider); // Primary key is stored/env as accessKeyId
      const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
      const region = process.env['AWS_REGION'];

      if (!accessKeyId || !secretAccessKey || !region) {
        return null;
      }

      return { accessKeyId, region, secretAccessKey };
    }

    case 'azure': {
      // Azure OpenAI requires API key, endpoint, and optionally deployment name
      const apiKey = getApiKey(provider);
      const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
      const deploymentName = process.env['AZURE_OPENAI_DEPLOYMENT'];

      if (!apiKey || !endpoint) {
        return null;
      }

      return { apiKey, deploymentName, endpoint };
    }

    case 'none': {
      // Local providers like Ollama don't require credentials
      // But may use a custom endpoint
      const endpoint = process.env['OLLAMA_ENDPOINT'];
      return { endpoint };
    }

    default:
      return null;
  }
}

/**
 * Parses a full model ID into provider and model components.
 *
 * @param fullModelId - The full model ID in format "provider:modelId"
 * @returns Object containing the parsed provider and modelId
 *
 * @example
 * parseModelId('anthropic:claude-3-opus-20240229')
 * // => { provider: 'anthropic', modelId: 'claude-3-opus-20240229' }
 */
export function parseModelId(fullModelId: string): ParsedModelId {
  const [provider, ...rest] = fullModelId.split(':');
  return {
    modelId: rest.join(':'),
    provider: provider as ApiKeyProvider,
  };
}

/**
 * Decrypts a stored API key using Electron's safeStorage.
 *
 * @param encrypted - The base64-encoded encrypted key
 * @returns The decrypted key or null if decryption fails
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
 * Gets the environment variable value for a provider.
 *
 * @param provider - The provider to get the environment variable for
 * @returns The environment variable value or undefined
 */
function getEnvApiKey(provider: ApiKeyProvider): string | undefined {
  const envVar = getProviderEnvVar(provider);
  return envVar ? process.env[envVar] : undefined;
}

/**
 * Retrieves stored API key data for a provider.
 *
 * @param provider - The provider to get stored key data for
 * @returns The stored key data or undefined
 */
function getStoredKeyData(provider: ApiKeyProvider): StoredApiKeyData | undefined {
  const storeKey = getStoreKey(provider);
  return store.get(storeKey) as StoredApiKeyData | undefined;
}

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Gets the store key for a provider's API key.
 *
 * @param provider - The provider
 * @returns The fully-qualified store key
 */
function getStoreKey(provider: ApiKeyProvider): string {
  return `${API_KEYS_NAMESPACE}.${provider}`;
}
