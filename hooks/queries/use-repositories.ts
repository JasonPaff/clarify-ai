'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { repositoryKeys } from '@/lib/queries/repositories';

import { useElectronDb } from '../useElectron';

export function useCreateRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof repositories.create>[0]) => repositories.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.byProject._def });
    },
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => repositories.delete(id),
    onSuccess: (_result, id) => {
      // Remove the detail query for the deleted repository to prevent refetch errors
      queryClient.removeQueries({ queryKey: repositoryKeys.detail(id).queryKey });
      // Invalidate all repository queries
      void queryClient.invalidateQueries({ queryKey: repositoryKeys._def });
    },
  });
}

export function useRepositories(projectId: number) {
  const { isElectron, repositories } = useElectronDb();

  return useQuery({
    ...repositoryKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => repositories.getByProjectId(projectId),
  });
}

export function useRepository(id: number) {
  const { isElectron, repositories } = useElectronDb();

  return useQuery({
    ...repositoryKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => repositories.getById(id),
  });
}

export function useUpdateRepository() {
  const queryClient = useQueryClient();
  const { repositories } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof repositories.update>[1]; id: number }) =>
      repositories.update(id, data),
    onSuccess: (repository) => {
      if (repository) {
        queryClient.setQueryData(repositoryKeys.detail(repository.id).queryKey, repository);
        void queryClient.invalidateQueries({ queryKey: repositoryKeys.byProject._def });
      }
    },
  });
}
