import { z } from 'zod';

import {
  ALL_PROVIDERS,
  type ApiKeyProvider,
  PROVIDER_CONFIGS,
} from '@/electron/ipc/lib/provider-types';

// Re-export the canonical ApiKeyProvider type
export type { ApiKeyProvider } from '@/electron/ipc/lib/provider-types';

// Major providers tuple type for Zod enum (must be const tuple for type inference)
const MAJOR_PROVIDERS = ['anthropic', 'google', 'openai'] as const;

// Type for major providers (subset of ApiKeyProvider used in forms)
export type MajorProvider = (typeof MAJOR_PROVIDERS)[number];

// All providers tuple for Zod enum (must be const tuple for type inference)
// This matches the ApiKeyProvider union type from provider-types.ts
const ALL_PROVIDERS_TUPLE = [
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
  'togetherai',
  'xai',
] as const;

// Provider enum schemas - for different form use cases
const majorProviderSchema = z.enum(MAJOR_PROVIDERS, {
  message: 'Provider is required',
});

const allProviderSchema = z.enum(ALL_PROVIDERS_TUPLE, {
  message: 'Provider is required',
});

// API key source enum - how the key was provided
const apiKeySourceSchema = z.enum(['environment', 'user']);

// Shared field validations for DRY compliance
const notesSchema = z.string();

// ============================================================================
// Legacy Schema (for backward compatibility during migration)
// Used by existing form components until they are updated
// ============================================================================

// Schema for creating a new API key (legacy - major providers only)
export const createApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  notes: notesSchema,
  provider: majorProviderSchema,
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

// Schema for updating an existing API key (legacy)
// apiKey is an empty string by default - empty means keep existing key
export const updateApiKeySchema = z.object({
  apiKey: z.string(),
  notes: notesSchema,
});

export type UpdateApiKeyFormValues = z.infer<typeof updateApiKeySchema>;

// ============================================================================
// Extended Schema (all 12 providers with provider-specific validation)
// For use with the new multi-provider form components
// ============================================================================

// Base schema with all fields as required strings (form always provides them)
// Validation of which fields are actually required is handled by superRefine based on provider
const baseExtendedCreateApiKeySchema = z.object({
  accessKeyId: z.string(),
  apiKey: z.string(),
  deploymentName: z.string(),
  endpoint: z.string(),
  notes: notesSchema,
  provider: allProviderSchema,
  region: z.string(),
  secretAccessKey: z.string(),
});

// Extended schema for creating a new API key with provider-specific validation
export const createExtendedApiKeySchema = baseExtendedCreateApiKeySchema.superRefine((data, ctx) => {
  const config = PROVIDER_CONFIGS[data.provider];

  switch (config.authType) {
    case 'api_key':
      // Standard API key providers require apiKey
      if (!data.apiKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API key is required',
          path: ['apiKey'],
        });
      }
      break;

    case 'aws':
      // AWS Bedrock requires accessKeyId, secretAccessKey, and region
      if (!data.accessKeyId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Access Key ID is required for AWS Bedrock',
          path: ['accessKeyId'],
        });
      }
      if (!data.secretAccessKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Secret Access Key is required for AWS Bedrock',
          path: ['secretAccessKey'],
        });
      }
      if (!data.region?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Region is required for AWS Bedrock',
          path: ['region'],
        });
      }
      break;

    case 'azure':
      // Azure OpenAI requires apiKey and endpoint
      if (!data.apiKey?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'API key is required for Azure OpenAI',
          path: ['apiKey'],
        });
      }
      if (!data.endpoint?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Endpoint is required for Azure OpenAI',
          path: ['endpoint'],
        });
      }
      break;

    case 'none':
      // Ollama: no API key required, endpoint is optional
      // No validation needed - all fields are optional
      break;
  }
});

export type CreateExtendedApiKeyFormValues = z.infer<typeof baseExtendedCreateApiKeySchema>;

// Extended schema for updating an existing API key
// All fields are strings - empty means keep existing value
export const updateExtendedApiKeySchema = z.object({
  accessKeyId: z.string(),
  apiKey: z.string(),
  deploymentName: z.string(),
  endpoint: z.string(),
  notes: notesSchema,
  region: z.string(),
  secretAccessKey: z.string(),
});

export interface ApiKeyEntry {
  createdAt: string;
  maskedKey: string;
  notes: string;
  provider: ApiKeyProvider;
  source: ApiKeySource;
  updatedAt: string;
}

// ============================================================================
// Type for stored/displayed API key entries
// ============================================================================

export type UpdateExtendedApiKeyFormValues = z.infer<typeof updateExtendedApiKeySchema>;

// ============================================================================
// Exports for form usage
// ============================================================================

// Export enum values for use in forms (as readonly array)
export const apiProviders: ReadonlyArray<MajorProvider> = MAJOR_PROVIDERS;

// Export all providers for extended use cases
export const allApiProviders = ALL_PROVIDERS;

// Export all providers tuple for form select options
export const allApiProvidersTuple = ALL_PROVIDERS_TUPLE;

export const apiKeySources = apiKeySourceSchema.options;
export type ApiKeySource = z.infer<typeof apiKeySourceSchema>;
