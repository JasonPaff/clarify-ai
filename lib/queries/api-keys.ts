import { createQueryKeys } from '@lukemorales/query-key-factory';

/**
 * AI provider types supported by the application.
 * This type is defined here to avoid circular dependencies with the schema.
 * When the schema is created, it should use this same union type.
 */
export type AiProvider = 'anthropic' | 'google' | 'openai';

export const apiKeyKeys = createQueryKeys('apiKeys', {
  detail: (provider: AiProvider) => [provider],
  encryptionAvailable: null,
  list: null,
});
