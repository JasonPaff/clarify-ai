'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { openRouterModelsKeys } from '@/lib/queries/openrouter-models';

import { useElectronOpenRouterModels } from '../useElectron';

export function useClearOpenRouterModels() {
  const queryClient = useQueryClient();
  const { clear } = useElectronOpenRouterModels();

  return useMutation({
    mutationFn: () => clear(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: openRouterModelsKeys.list.queryKey });
    },
  });
}

export function useFetchOpenRouterModels() {
  const queryClient = useQueryClient();
  const { fetch } = useElectronOpenRouterModels();

  return useMutation({
    mutationFn: () => fetch(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: openRouterModelsKeys.list.queryKey });
    },
  });
}

export function useOpenRouterModels() {
  const { get, isElectron } = useElectronOpenRouterModels();

  return useQuery({
    ...openRouterModelsKeys.list,
    enabled: isElectron,
    queryFn: () => get(),
  });
}
