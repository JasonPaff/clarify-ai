'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { featureRequestRepositoryKeys } from '@/lib/queries/feature-request-repositories';

import { useElectronDb } from '../useElectron';

export function useAddFeatureRequestRepository() {
  const queryClient = useQueryClient();
  const { featureRequestRepositories } = useElectronDb();

  return useMutation({
    mutationFn: ({ featureRequestId, repositoryId }: { featureRequestId: number; repositoryId: number }) =>
      featureRequestRepositories.addToFeatureRequest(featureRequestId, repositoryId),
    onSuccess: (_result, { featureRequestId }) => {
      void queryClient.invalidateQueries({
        queryKey: featureRequestRepositoryKeys.byFeatureRequest(featureRequestId).queryKey,
      });
    },
  });
}

export function useFeatureRequestRepositories(featureRequestId: number) {
  const { featureRequestRepositories, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRepositoryKeys.byFeatureRequest(featureRequestId),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => featureRequestRepositories.getByFeatureRequestId(featureRequestId),
  });
}

export function useRemoveFeatureRequestRepository() {
  const queryClient = useQueryClient();
  const { featureRequestRepositories } = useElectronDb();

  return useMutation({
    mutationFn: ({ featureRequestId, repositoryId }: { featureRequestId: number; repositoryId: number }) =>
      featureRequestRepositories.removeFromFeatureRequest(featureRequestId, repositoryId),
    onSuccess: (_result, { featureRequestId }) => {
      void queryClient.invalidateQueries({
        queryKey: featureRequestRepositoryKeys.byFeatureRequest(featureRequestId).queryKey,
      });
    },
  });
}

export function useSetFeatureRequestRepositories() {
  const queryClient = useQueryClient();
  const { featureRequestRepositories } = useElectronDb();

  return useMutation({
    mutationFn: ({ featureRequestId, repositoryIds }: { featureRequestId: number; repositoryIds: Array<number> }) =>
      featureRequestRepositories.setForFeatureRequest(featureRequestId, repositoryIds),
    onSuccess: (_result, { featureRequestId }) => {
      void queryClient.invalidateQueries({
        queryKey: featureRequestRepositoryKeys.byFeatureRequest(featureRequestId).queryKey,
      });
    },
  });
}
