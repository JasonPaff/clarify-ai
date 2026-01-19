/**
 * Centralized provider type definitions - single source of truth for all AI provider-related types and constants.
 *
 * This module eliminates duplication of provider types across the codebase and provides
 * a consistent interface for provider configuration, authentication, and UI display.
 */

// ============================================================================
// Provider Type Definitions
// ============================================================================

/**
 * All supported AI provider identifiers.
 * - Major: anthropic, google, openai (primary providers with full feature support)
 * - Emerging: mistral, cohere, xai, groq, deepseek, togetherai (cloud-based alternatives)
 * - Enterprise: bedrock, azure (cloud platform integrations)
 * - Local: ollama (self-hosted)
 */
export type ApiKeyProvider =
  | 'anthropic'
  | 'azure'
  | 'bedrock'
  | 'cohere'
  | 'deepseek'
  | 'google'
  | 'groq'
  | 'mistral'
  | 'ollama'
  | 'openai'
  | 'openrouter'
  | 'togetherai'
  | 'xai';

/**
 * Authentication type required by each provider.
 * - api_key: Standard API key authentication
 * - aws: AWS credentials (access key, secret, region)
 * - azure: Azure-specific authentication (endpoint, key, deployment)
 * - none: No authentication required (e.g., local Ollama)
 */
export type ProviderAuthType = 'api_key' | 'aws' | 'azure' | 'none';

/**
 * Provider categories for UI grouping and feature differentiation.
 * - major: Primary providers with full feature support and wide model selection
 * - emerging: Cloud-based alternatives with growing capabilities
 * - enterprise: Cloud platform integrations (AWS Bedrock, Azure OpenAI)
 * - local: Self-hosted providers (Ollama)
 */
export type ProviderCategory = 'emerging' | 'enterprise' | 'local' | 'major';

// ============================================================================
// Provider Configuration Interface
// ============================================================================

/**
 * Configuration interface for each provider's authentication and setup requirements.
 */
export interface ProviderConfig {
  /** Type of authentication required */
  authType: ProviderAuthType;
  /** Provider category for UI grouping */
  category: ProviderCategory;
  /** Human-readable display name */
  displayName: string;
  /** Primary environment variable for authentication (if applicable) */
  envVar?: string;
  /** Whether the provider requires additional configuration beyond API key */
  requiresAdditionalConfig?: boolean;
  /** Secondary environment variables (for complex auth like AWS/Azure) */
  secondaryEnvVars?: Array<string>;
}

// ============================================================================
// Provider Constants
// ============================================================================

/**
 * List of all supported providers for iteration.
 * Maintains alphabetical order for consistency.
 */
export const ALL_PROVIDERS: ReadonlyArray<ApiKeyProvider> = [
  'anthropic',
  'azure',
  'bedrock',
  'cohere',
  'deepseek',
  'google',
  'groq',
  'mistral',
  'ollama',
  'openai',
  'openrouter',
  'togetherai',
  'xai',
] as const;

/**
 * Environment variable names for each provider.
 * Maps provider identifiers to their corresponding environment variable names.
 */
export const PROVIDER_ENV_VARS: Record<ApiKeyProvider, string | undefined> = {
  anthropic: 'ANTHROPIC_API_KEY',
  azure: 'AZURE_OPENAI_API_KEY',
  bedrock: 'AWS_ACCESS_KEY_ID',
  cohere: 'COHERE_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_KEY',
  groq: 'GROQ_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  ollama: undefined, // No API key required for local Ollama
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  togetherai: 'TOGETHER_API_KEY',
  xai: 'XAI_API_KEY',
};

/**
 * Human-readable display names for each provider.
 */
export const PROVIDER_DISPLAY_NAMES: Record<ApiKeyProvider, string> = {
  anthropic: 'Anthropic',
  azure: 'Azure OpenAI',
  bedrock: 'AWS Bedrock',
  cohere: 'Cohere',
  deepseek: 'DeepSeek',
  google: 'Google AI',
  groq: 'Groq',
  mistral: 'Mistral AI',
  ollama: 'Ollama (Local)',
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
  togetherai: 'Together AI',
  xai: 'xAI (Grok)',
};

/**
 * Category mapping for each provider.
 */
export const PROVIDER_CATEGORIES: Record<ApiKeyProvider, ProviderCategory> = {
  anthropic: 'major',
  azure: 'enterprise',
  bedrock: 'enterprise',
  cohere: 'emerging',
  deepseek: 'emerging',
  google: 'major',
  groq: 'emerging',
  mistral: 'emerging',
  ollama: 'local',
  openai: 'major',
  openrouter: 'major',
  togetherai: 'emerging',
  xai: 'emerging',
};

/**
 * Full provider configuration for all supported providers.
 */
export const PROVIDER_CONFIGS: Record<ApiKeyProvider, ProviderConfig> = {
  anthropic: {
    authType: 'api_key',
    category: 'major',
    displayName: 'Anthropic',
    envVar: 'ANTHROPIC_API_KEY',
  },
  azure: {
    authType: 'azure',
    category: 'enterprise',
    displayName: 'Azure OpenAI',
    envVar: 'AZURE_OPENAI_API_KEY',
    requiresAdditionalConfig: true,
    secondaryEnvVars: ['AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_DEPLOYMENT'],
  },
  bedrock: {
    authType: 'aws',
    category: 'enterprise',
    displayName: 'AWS Bedrock',
    envVar: 'AWS_ACCESS_KEY_ID',
    requiresAdditionalConfig: true,
    secondaryEnvVars: ['AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
  },
  cohere: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'Cohere',
    envVar: 'COHERE_API_KEY',
  },
  deepseek: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'DeepSeek',
    envVar: 'DEEPSEEK_API_KEY',
  },
  google: {
    authType: 'api_key',
    category: 'major',
    displayName: 'Google AI',
    envVar: 'GOOGLE_GENERATIVE_AI_KEY',
  },
  groq: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'Groq',
    envVar: 'GROQ_API_KEY',
  },
  mistral: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'Mistral AI',
    envVar: 'MISTRAL_API_KEY',
  },
  ollama: {
    authType: 'none',
    category: 'local',
    displayName: 'Ollama (Local)',
  },
  openai: {
    authType: 'api_key',
    category: 'major',
    displayName: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
  },
  openrouter: {
    authType: 'api_key',
    category: 'major',
    displayName: 'OpenRouter',
    envVar: 'OPENROUTER_API_KEY',
  },
  togetherai: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'Together AI',
    envVar: 'TOGETHER_API_KEY',
  },
  xai: {
    authType: 'api_key',
    category: 'emerging',
    displayName: 'xAI (Grok)',
    envVar: 'XAI_API_KEY',
  },
};

// ============================================================================
// Provider Credentials Interface
// ============================================================================

/**
 * Extended credential fields for provider-specific authentication requirements.
 * This interface supports all authentication patterns across different providers:
 * - Standard API key authentication (most providers)
 * - Azure OpenAI (endpoint + deployment name)
 * - AWS Bedrock (access key + secret key + region)
 * - Ollama (endpoint only, no API key required)
 */
export interface ProviderCredentials {
  /** AWS access key ID (for Bedrock) */
  accessKeyId?: string;
  /** API key for authentication (optional for Ollama) */
  apiKey?: string;
  /** Deployment name (for Azure OpenAI) */
  deploymentName?: string;
  /** Custom endpoint URL (for Azure, Ollama) */
  endpoint?: string;
  /** AWS region (for Bedrock) */
  region?: string;
  /** AWS secret access key (for Bedrock) */
  secretAccessKey?: string;
}

/**
 * Get the major providers (Anthropic, Google, OpenAI).
 */
export function getMajorProviders(): Array<ApiKeyProvider> {
  return getProvidersByCategory('major');
}

/**
 * Get optional credential fields for a provider.
 */
export function getOptionalCredentialFields(
  provider: ApiKeyProvider
): Array<'accessKeyId' | 'apiKey' | 'deploymentName' | 'endpoint' | 'region' | 'secretAccessKey'> {
  const config = PROVIDER_CONFIGS[provider];

  switch (config.authType) {
    case 'azure':
      return ['deploymentName'];
    case 'none':
      return ['endpoint']; // Ollama can use custom endpoint
    default:
      return [];
  }
}

/**
 * Get the display name for a provider.
 */
export function getProviderDisplayName(provider: ApiKeyProvider): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the environment variable name for a provider.
 */
export function getProviderEnvVar(provider: ApiKeyProvider): string | undefined {
  return PROVIDER_ENV_VARS[provider];
}

/**
 * Get providers filtered by category.
 */
export function getProvidersByCategory(category: ProviderCategory): Array<ApiKeyProvider> {
  return ALL_PROVIDERS.filter((provider) => PROVIDER_CATEGORIES[provider] === category);
}

/**
 * Get the authentication fields required for a provider.
 */
export function getRequiredCredentialFields(
  provider: ApiKeyProvider
): Array<'accessKeyId' | 'apiKey' | 'deploymentName' | 'endpoint' | 'region' | 'secretAccessKey'> {
  const config = PROVIDER_CONFIGS[provider];

  switch (config.authType) {
    case 'api_key':
      return ['apiKey'];
    case 'aws':
      return ['accessKeyId', 'secretAccessKey', 'region'];
    case 'azure':
      return ['apiKey', 'endpoint'];
    case 'none':
      return [];
    default:
      return [];
  }
}

/**
 * Type guard to check if a string is a valid provider.
 */
export function isValidProvider(value: string): value is ApiKeyProvider {
  return ALL_PROVIDERS.includes(value as ApiKeyProvider);
}

/**
 * Check if a provider requires additional configuration beyond API key.
 */
export function providerRequiresAdditionalConfig(provider: ApiKeyProvider): boolean {
  return PROVIDER_CONFIGS[provider].requiresAdditionalConfig ?? false;
}

/**
 * Check if a provider requires an API key for authentication.
 */
export function providerRequiresApiKey(provider: ApiKeyProvider): boolean {
  return PROVIDER_CONFIGS[provider].authType === 'api_key';
}

/**
 * Validates that required credentials are present for a given provider.
 * Returns an array of missing field names, or empty array if valid.
 */
export function validateProviderCredentials(provider: ApiKeyProvider, credentials: ProviderCredentials): Array<string> {
  const config = PROVIDER_CONFIGS[provider];
  const missing: Array<string> = [];

  switch (config.authType) {
    case 'api_key':
      if (!credentials.apiKey?.trim()) {
        missing.push('apiKey');
      }
      break;
    case 'aws':
      if (!credentials.accessKeyId?.trim()) {
        missing.push('accessKeyId');
      }
      if (!credentials.secretAccessKey?.trim()) {
        missing.push('secretAccessKey');
      }
      if (!credentials.region?.trim()) {
        missing.push('region');
      }
      break;
    case 'azure':
      if (!credentials.apiKey?.trim()) {
        missing.push('apiKey');
      }
      if (!credentials.endpoint?.trim()) {
        missing.push('endpoint');
      }
      // deploymentName is optional but recommended
      break;
    case 'none':
      // No credentials required, but endpoint is optional for custom Ollama URLs
      break;
  }

  return missing;
}
