import { z } from 'zod';

// API provider enum - supported AI providers (lowercase to match IPC handlers)
const apiProviderSchema = z.enum(['anthropic', 'google', 'openai'], {
  message: 'Provider is required',
});

// API key source enum - how the key was provided
const apiKeySourceSchema = z.enum(['environment', 'user']);

// Shared field validations for DRY compliance
const apiKeySchema = z.string().min(1, 'API key is required');

const notesSchema = z.string();

// Schema for creating a new API key
export const createApiKeySchema = z.object({
  apiKey: apiKeySchema,
  notes: notesSchema,
  provider: apiProviderSchema,
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

// Schema for updating an existing API key
// apiKey is an empty string by default - empty means keep existing key
export const updateApiKeySchema = z.object({
  apiKey: z.string(),
  notes: notesSchema,
});

// Type for stored/displayed API key entries
export interface ApiKeyEntry {
  createdAt: string;
  maskedKey: string;
  notes: string;
  provider: ApiProvider;
  source: ApiKeySource;
  updatedAt: string;
}

export type UpdateApiKeyFormValues = z.infer<typeof updateApiKeySchema>;

// Export enum types for reuse
export const apiProviders = apiProviderSchema.options;
export type ApiProvider = z.infer<typeof apiProviderSchema>;

export const apiKeySources = apiKeySourceSchema.options;
export type ApiKeySource = z.infer<typeof apiKeySourceSchema>;
