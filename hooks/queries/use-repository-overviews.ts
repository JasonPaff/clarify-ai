'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { repositoryOverviewKeys } from '@/lib/queries/repository-overviews';

import { useElectron, useElectronDb } from '../useElectron';

/**
 * Overview status information for a repository.
 */
export interface RepositoryOverviewStatus {
  /** When the overview was generated */
  generatedAt: null | string;
  /** Whether the repository has an AI-generated overview */
  hasOverview: boolean;
  /** Whether the overview was imported (modelId === 'imported') */
  isImported: boolean;
  /** Whether the overview has been manually edited */
  isManuallyEdited: boolean;
  /** When the overview was last edited (if manually edited) */
  lastEditedAt: null | string;
  /** The model ID used to generate the overview, or 'imported' for imported overviews */
  modelId: null | string;
}

export function useCreateRepositoryOverview() {
  const queryClient = useQueryClient();
  const { repositoryOverviews } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof repositoryOverviews.create>[0]) => repositoryOverviews.create(data),
    onSuccess: (overview) => {
      if (overview) {
        queryClient.setQueryData(repositoryOverviewKeys.byRepositoryId(overview.repositoryId).queryKey, overview);
      }
    },
  });
}

export function useDeleteRepositoryOverview() {
  const queryClient = useQueryClient();
  const { repositoryOverviews } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => repositoryOverviews.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repositoryOverviewKeys._def });
    },
  });
}

export function useDeleteRepositoryOverviewByRepositoryId() {
  const queryClient = useQueryClient();
  const { repositoryOverviews } = useElectronDb();

  return useMutation({
    mutationFn: (repositoryId: number) => repositoryOverviews.deleteByRepositoryId(repositoryId),
    onSuccess: (_result, repositoryId) => {
      queryClient.removeQueries({ queryKey: repositoryOverviewKeys.byRepositoryId(repositoryId).queryKey });
    },
  });
}

export function useImportRepositoryOverview() {
  const queryClient = useQueryClient();
  const { api } = useElectron();

  return useMutation({
    mutationFn: async ({ content, repositoryId }: { content: string; repositoryId: number }) => {
      if (!api) {
        throw new Error('Electron API not available');
      }
      const result = await api.electron.importRepositoryOverview(repositoryId, content);
      if (!result.success) {
        throw new Error(result.error ?? 'Failed to import repository overview');
      }
      return result;
    },
    onSuccess: (result, { repositoryId }) => {
      if (result.overview) {
        queryClient.setQueryData(repositoryOverviewKeys.byRepositoryId(repositoryId).queryKey, result.overview);
      }
      void queryClient.invalidateQueries({ queryKey: repositoryOverviewKeys._def });
    },
  });
}

export function useRepositoryOverview(repositoryId: number) {
  const { isElectron, repositoryOverviews } = useElectronDb();

  return useQuery({
    ...repositoryOverviewKeys.byRepositoryId(repositoryId),
    enabled: isElectron && repositoryId > 0,
    queryFn: async () => {
      const result = await repositoryOverviews.getByRepositoryId(repositoryId);
      return result ?? null;
    },
  });
}

/**
 * Hook to fetch the actual content of repository overviews for multiple repositories.
 * Returns a Map of repository ID to overview content string.
 *
 * @param repositoryIds - Array of repository IDs to fetch overview content for
 * @returns Map of repository ID to overview content (prefers manualContent over content)
 */
export function useRepositoryOverviewContents(repositoryIds: Array<number>) {
  const { isElectron, repositoryOverviews } = useElectronDb();

  const queries = useQueries({
    combine: (results) => ({
      data: new Map(
        results.map((result, index) => [
          repositoryIds[index] as number,
          result.data?.manualContent ?? result.data?.content ?? null,
        ])
      ),
      isError: results.some((r) => r.isError),
      isPending: results.some((r) => r.isPending),
    }),
    queries: repositoryIds.map((repositoryId) => ({
      ...repositoryOverviewKeys.byRepositoryId(repositoryId),
      enabled: isElectron && repositoryId > 0,
      queryFn: async () => {
        const result = await repositoryOverviews.getByRepositoryId(repositoryId);
        return result ?? null;
      },
    })),
  });

  return queries;
}

/**
 * Hook to fetch overview statuses for multiple repositories in parallel.
 * Uses TanStack Query's useQueries for efficient parallel fetching with shared cache.
 *
 * @param repositoryIds - Array of repository IDs to fetch overview statuses for
 * @returns Map of repository ID to overview status, along with loading/error states
 */
export function useRepositoryOverviewStatuses(repositoryIds: Array<number>) {
  const { isElectron, repositoryOverviews } = useElectronDb();

  // Create stable query options for each repository
  const queries = useQueries({
    combine: (results) => ({
      data: results.map((result, index) => ({
        data: result.data,
        repositoryId: repositoryIds[index],
      })),
      isError: results.some((result) => result.isError),
      isPending: results.some((result) => result.isPending),
    }),
    queries: repositoryIds.map((repositoryId) => ({
      ...repositoryOverviewKeys.byRepositoryId(repositoryId),
      enabled: isElectron && repositoryId > 0,
      queryFn: async () => {
        const result = await repositoryOverviews.getByRepositoryId(repositoryId);
        return result ?? null;
      },
    })),
  });

  // Transform results into a map of repository ID to overview status
  const overviewStatusMap = useMemo(() => {
    const map = new Map<number, RepositoryOverviewStatus>();

    for (const { data, repositoryId } of queries.data) {
      if (repositoryId !== undefined) {
        const modelId = data?.modelId ?? null;
        map.set(repositoryId, {
          generatedAt: data?.generatedAt ?? null,
          hasOverview: data !== undefined && data !== null,
          isImported: modelId === 'imported',
          isManuallyEdited: data?.manualContent !== null && data?.manualContent !== undefined,
          lastEditedAt: data?.lastEditedAt ?? null,
          modelId,
        });
      }
    }

    return map;
  }, [queries.data]);

  return {
    data: overviewStatusMap,
    isError: queries.isError,
    isPending: queries.isPending,
  };
}

/**
 * Hook to calculate estimated token count from repository overviews.
 * Uses the content length of each overview to estimate tokens.
 *
 * @param repositoryIds - Array of repository IDs to calculate tokens for
 * @returns Total estimated tokens from all repository overviews
 */
export function useRepositoryOverviewTokens(repositoryIds: Array<number>) {
  const { isElectron, repositoryOverviews } = useElectronDb();

  // Create stable query options for each repository
  const queries = useQueries({
    combine: (results) => ({
      data: results.map((result, index) => ({
        content: result.data?.content ?? result.data?.manualContent ?? null,
        repositoryId: repositoryIds[index],
      })),
      isError: results.some((result) => result.isError),
      isPending: results.some((result) => result.isPending),
    }),
    queries: repositoryIds.map((repositoryId) => ({
      ...repositoryOverviewKeys.byRepositoryId(repositoryId),
      enabled: isElectron && repositoryId > 0,
      queryFn: async () => {
        const result = await repositoryOverviews.getByRepositoryId(repositoryId);
        return result ?? null;
      },
    })),
  });

  // Calculate total tokens from all overview content
  const totalTokens = useMemo(() => {
    let tokens = 0;

    for (const { content } of queries.data) {
      if (content) {
        // Use chars/4 heuristic for token estimation
        tokens += Math.ceil(content.length / 4);
      }
    }

    return tokens;
  }, [queries.data]);

  return {
    isError: queries.isError,
    isPending: queries.isPending,
    totalTokens,
  };
}

export function useUpdateRepositoryOverview() {
  const queryClient = useQueryClient();
  const { repositoryOverviews } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof repositoryOverviews.update>[1]; id: number }) =>
      repositoryOverviews.update(id, data),
    onSuccess: (overview) => {
      if (overview) {
        queryClient.setQueryData(repositoryOverviewKeys.byRepositoryId(overview.repositoryId).queryKey, overview);
      }
    },
  });
}

export function useUpsertRepositoryOverview() {
  const queryClient = useQueryClient();
  const { repositoryOverviews } = useElectronDb();

  return useMutation({
    mutationFn: ({
      data,
      repositoryId,
    }: {
      data: Parameters<typeof repositoryOverviews.upsert>[1];
      repositoryId: number;
    }) => repositoryOverviews.upsert(repositoryId, data),
    onSuccess: (overview) => {
      if (overview) {
        queryClient.setQueryData(repositoryOverviewKeys.byRepositoryId(overview.repositoryId).queryKey, overview);
      }
    },
  });
}
