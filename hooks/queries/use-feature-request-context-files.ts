'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ContextFileType } from '@/db/schema/feature-request-context-files.schema';

import { featureRequestContextFileKeys } from '@/lib/queries/feature-request-context-files';

import { useElectronDb } from '../useElectron';

export function useAddContextFile() {
  const queryClient = useQueryClient();
  const { featureRequestContextFiles } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof featureRequestContextFiles.create>[0]) =>
      featureRequestContextFiles.create(data),
    onSuccess: (contextFile) => {
      if (contextFile) {
        queryClient.setQueryData(featureRequestContextFileKeys.detail(contextFile.id).queryKey, contextFile);
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequestAndType._def });
      }
    },
  });
}

export function useBulkAddContextFiles() {
  const queryClient = useQueryClient();
  const { featureRequestContextFiles } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof featureRequestContextFiles.bulkCreate>[0]) =>
      featureRequestContextFiles.bulkCreate(data),
    onSuccess: (contextFiles) => {
      if (contextFiles && contextFiles.length > 0) {
        // Set detail cache for each created file
        for (const contextFile of contextFiles) {
          queryClient.setQueryData(featureRequestContextFileKeys.detail(contextFile.id).queryKey, contextFile);
        }
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequestAndType._def });
      }
    },
  });
}

export function useContextFile(id: number) {
  const { featureRequestContextFiles, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestContextFileKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => featureRequestContextFiles.getById(id),
  });
}

export function useContextFiles(featureRequestId: number) {
  const { featureRequestContextFiles, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestContextFileKeys.byFeatureRequest(featureRequestId),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => featureRequestContextFiles.getByFeatureRequestId(featureRequestId),
  });
}

export function useContextFilesByType(featureRequestId: number, fileType: ContextFileType) {
  const { featureRequestContextFiles, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestContextFileKeys.byFeatureRequestAndType(featureRequestId, fileType),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => featureRequestContextFiles.getByFeatureRequestIdAndType(featureRequestId, fileType),
  });
}

export function useRemoveContextFile() {
  const queryClient = useQueryClient();
  const { featureRequestContextFiles } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => featureRequestContextFiles.delete(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: featureRequestContextFileKeys.detail(id).queryKey });
      void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys._def });
    },
  });
}

export function useSetContextFileIncluded() {
  const queryClient = useQueryClient();
  const { featureRequestContextFiles } = useElectronDb();

  return useMutation({
    mutationFn: ({ id, includedInContext }: { id: number; includedInContext: boolean }) =>
      featureRequestContextFiles.setIncludedInContext(id, includedInContext),
    onSuccess: (contextFile) => {
      if (contextFile) {
        queryClient.setQueryData(featureRequestContextFileKeys.detail(contextFile.id).queryKey, contextFile);
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequestAndType._def });
      }
    },
  });
}

export function useUpdateContextFile() {
  const queryClient = useQueryClient();
  const { featureRequestContextFiles } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof featureRequestContextFiles.update>[1]; id: number }) =>
      featureRequestContextFiles.update(id, data),
    onSuccess: (contextFile) => {
      if (contextFile) {
        queryClient.setQueryData(featureRequestContextFileKeys.detail(contextFile.id).queryKey, contextFile);
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestContextFileKeys.byFeatureRequestAndType._def });
      }
    },
  });
}
