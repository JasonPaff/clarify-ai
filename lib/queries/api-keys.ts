import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { ApiKeyProvider } from '@/electron/ipc/lib/provider-types';

// Re-export for backwards compatibility and convenience
export type { ApiKeyProvider } from '@/electron/ipc/lib/provider-types';

// Legacy alias - use ApiKeyProvider directly
export type AiProvider = ApiKeyProvider;

export const apiKeyKeys = createQueryKeys('apiKeys', {
  detail: (provider: ApiKeyProvider) => [provider],
  encryptionAvailable: null,
  list: null,
});
