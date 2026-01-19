'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AiProvider } from '@/lib/queries/api-keys';
import type { ProviderCredentials, SetApiKeyInput } from '@/types/electron';

import { apiKeyKeys } from '@/lib/queries/api-keys';
import { openRouterModelsKeys } from '@/lib/queries/openrouter-models';

import { useElectronApiKeys, useElectronOpenRouterModels } from '../useElectron';

export function useApiKey(provider: AiProvider) {
  const { get, isElectron } = useElectronApiKeys();

  return useQuery({
    ...apiKeyKeys.detail(provider),
    enabled: isElectron,
    queryFn: () => get(provider),
  });
}

export function useApiKeys() {
  const { getAll, isElectron } = useElectronApiKeys();

  return useQuery({
    ...apiKeyKeys.list,
    enabled: isElectron,
    queryFn: () => getAll(),
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const { deleteKey } = useElectronApiKeys();
  const { clear: clearOpenRouterModels } = useElectronOpenRouterModels();

  return useMutation({
    mutationFn: (provider: AiProvider) => deleteKey(provider),
    onSuccess: async (_result, provider) => {
      // Remove the detail query for the deleted provider
      queryClient.removeQueries({ queryKey: apiKeyKeys.detail(provider).queryKey });
      // Invalidate the list query to refresh the API keys list
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.list.queryKey });

      // Clear cached OpenRouter models when OpenRouter key is deleted
      if (provider === 'openrouter') {
        await clearOpenRouterModels();
        void queryClient.invalidateQueries({ queryKey: openRouterModelsKeys.list.queryKey });
      }
    },
  });
}

export function useEncryptionAvailable() {
  const { isElectron, isEncryptionAvailable } = useElectronApiKeys();

  return useQuery({
    ...apiKeyKeys.encryptionAvailable,
    enabled: isElectron,
    queryFn: () => isEncryptionAvailable(),
  });
}

export function useSetApiKey() {
  const queryClient = useQueryClient();
  const { set } = useElectronApiKeys();
  const { fetch: fetchOpenRouterModels } = useElectronOpenRouterModels();

  return useMutation({
    mutationFn: (input: SetApiKeyInput) => set(input),
    onSuccess: async (_result, input) => {
      // Invalidate the specific provider's detail query
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(input.provider).queryKey });
      // Invalidate the list query to refresh all API keys
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.list.queryKey });

      // Auto-fetch OpenRouter models when OpenRouter key is added/updated
      if (input.provider === 'openrouter') {
        await fetchOpenRouterModels();
        void queryClient.invalidateQueries({ queryKey: openRouterModelsKeys.list.queryKey });
      }
    },
  });
}

export function useTestApiKey() {
  const { test } = useElectronApiKeys();

  return useMutation({
    mutationFn: ({ credentials, provider }: { credentials?: ProviderCredentials; provider: AiProvider }) =>
      test(provider, credentials),
  });
}

export function useToggleApiKeyDisabled() {
  const queryClient = useQueryClient();
  const { toggleDisabled } = useElectronApiKeys();

  return useMutation({
    mutationFn: (provider: AiProvider) => toggleDisabled(provider),
    onSuccess: (_result, provider) => {
      void queryClient.invalidateQueries({
        queryKey: apiKeyKeys.detail(provider).queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list.queryKey,
      });
    },
  });
}
