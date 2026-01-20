'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { featureRequestKeys } from '@/lib/queries/feature-requests';
import { projectKeys } from '@/lib/queries/projects';

import { useElectronDb } from '../useElectron';

export function useArchiveFeatureRequest() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => featureRequests.update(id, { archivedAt: new Date().toISOString() }),
    onSuccess: (featureRequest) => {
      if (featureRequest) {
        queryClient.setQueryData(featureRequestKeys.detail(featureRequest.id).queryKey, featureRequest);
        void queryClient.invalidateQueries({ queryKey: featureRequestKeys.byProject._def });
      }
    },
  });
}

export function useCreateFeatureRequest() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof featureRequests.create>[0]) => featureRequests.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: featureRequestKeys.byProject._def });
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}

export function useDeleteFeatureRequest() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => featureRequests.delete(id),
    onSuccess: (_result, id) => {
      // Remove the detail query for the deleted feature request to prevent refetch errors
      queryClient.removeQueries({ queryKey: featureRequestKeys.detail(id).queryKey });
      // Invalidate all feature request queries
      void queryClient.invalidateQueries({ queryKey: featureRequestKeys._def });
      // Invalidate project list to update feature counts
      void queryClient.invalidateQueries({ queryKey: projectKeys.list._def });
    },
  });
}

export function useFeatureRequest(id: number) {
  const { featureRequests, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => featureRequests.getById(id),
  });
}

export function useFeatureRequests(projectId: number) {
  const { featureRequests, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => featureRequests.getByProjectId(projectId),
  });
}

export function useUnarchiveFeatureRequest() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => featureRequests.update(id, { archivedAt: null }),
    onSuccess: (featureRequest) => {
      if (featureRequest) {
        queryClient.setQueryData(featureRequestKeys.detail(featureRequest.id).queryKey, featureRequest);
        void queryClient.invalidateQueries({ queryKey: featureRequestKeys.byProject._def });
      }
    },
  });
}

export function useUpdateFeatureRequest() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof featureRequests.update>[1]; id: number }) =>
      featureRequests.update(id, data),
    onSuccess: (featureRequest) => {
      if (featureRequest) {
        queryClient.setQueryData(featureRequestKeys.detail(featureRequest.id).queryKey, featureRequest);
        void queryClient.invalidateQueries({ queryKey: featureRequestKeys.byProject._def });
      }
    },
  });
}
