'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Repository } from '@/db/schema/repositories.schema';

import { repositoryKeys } from '@/lib/queries/repositories';

import type { RepositoryOverviewStatus } from './use-repository-overviews';

import { useElectronDb } from '../useElectron';
import { useRepositoryOverviewStatuses } from './use-repository-overviews';

/**
 * A repository enriched with its overview status information.
 */
export interface RepositoryWithOverviewStatus extends Repository {
  /** Overview status information for this repository */
  overviewStatus: RepositoryOverviewStatus;
}

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

/**
 * Hook to fetch repositories for a project with their overview status.
 * Combines repository data with overview status in a single hook for easy UI consumption.
 *
 * This hook efficiently fetches:
 * 1. All repositories for the project (single query)
 * 2. Overview statuses for all repositories (parallel queries with shared cache)
 *
 * @param projectId - The project ID to fetch repositories for
 * @returns Repositories enriched with overview status, along with loading/error states
 */
export function useRepositoriesWithOverviewStatus(projectId: number) {
  const repositoriesQuery = useRepositories(projectId);
  const repositoryIds = useMemo(() => repositoriesQuery.data?.map((repo) => repo.id) ?? [], [repositoriesQuery.data]);
  const overviewStatusesQuery = useRepositoryOverviewStatuses(repositoryIds);

  // Combine repositories with their overview statuses
  const repositoriesWithStatus = useMemo((): Array<RepositoryWithOverviewStatus> => {
    if (!repositoriesQuery.data) return [];

    return repositoriesQuery.data.map((repository) => ({
      ...repository,
      overviewStatus: overviewStatusesQuery.data.get(repository.id) ?? {
        generatedAt: null,
        hasOverview: false,
        isImported: false,
        isManuallyEdited: false,
        lastEditedAt: null,
        modelId: null,
      },
    }));
  }, [repositoriesQuery.data, overviewStatusesQuery.data]);

  return {
    data: repositoriesWithStatus,
    isError: repositoriesQuery.isError || overviewStatusesQuery.isError,
    isPending: repositoriesQuery.isPending || overviewStatusesQuery.isPending,
    // Expose underlying queries for more granular control if needed
    overviewStatusesQuery,
    repositoriesQuery,
  };
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
