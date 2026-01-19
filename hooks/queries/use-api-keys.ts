'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AiProvider } from '@/lib/queries/api-keys';
import type { ProviderCredentials, SetApiKeyInput } from '@/types/electron';

import { apiKeyKeys } from '@/lib/queries/api-keys';

import { useElectronApiKeys } from '../useElectron';

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

  return useMutation({
    mutationFn: (provider: AiProvider) => deleteKey(provider),
    onSuccess: (_result, provider) => {
      // Remove the detail query for the deleted provider
      queryClient.removeQueries({ queryKey: apiKeyKeys.detail(provider).queryKey });
      // Invalidate the list query to refresh the API keys list
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.list.queryKey });
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

  return useMutation({
    mutationFn: (input: SetApiKeyInput) => set(input),
    onSuccess: (_result, input) => {
      // Invalidate the specific provider's detail query
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.detail(input.provider).queryKey });
      // Invalidate the list query to refresh all API keys
      void queryClient.invalidateQueries({ queryKey: apiKeyKeys.list.queryKey });
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
