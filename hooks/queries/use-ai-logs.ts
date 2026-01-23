'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AiLogFilterParams } from '@/db/repositories/ai-logs.repository';
import type { AiLogConfig } from '@/types/ai-log';

import { aiLogKeys } from '@/lib/queries/ai-logs';

import { useElectronAiDebugLogging, useElectronDb } from '../useElectron';

/**
 * Hook for fetching the AI debug logging configuration.
 * Uses electron-store via IPC for persistent storage.
 */
export function useAiDebugLoggingConfig() {
  const { getConfig, isElectron } = useElectronAiDebugLogging();

  return useQuery({
    ...aiLogKeys.config,
    enabled: isElectron,
    queryFn: async () => {
      const config = await getConfig();
      return config ?? null;
    },
  });
}

/**
 * Hook for fetching a single AI log entry by ID.
 */
export function useAiLog(id: number) {
  const { aiLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiLogKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: async () => {
      const result = await aiLogs.getById(id);
      return result ?? null;
    },
  });
}

/**
 * Hook for fetching a single AI log entry by request ID.
 */
export function useAiLogByRequestId(requestId: string) {
  const { aiLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiLogKeys.byRequestId(requestId),
    enabled: isElectron && Boolean(requestId),
    queryFn: async () => {
      const result = await aiLogs.getByRequestId(requestId);
      return result ?? null;
    },
  });
}

/**
 * Hook for fetching filtered AI logs with pagination.
 * Returns both entries and total count for pagination support.
 */
export function useAiLogs(filters?: AiLogFilterParams) {
  const { aiLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiLogKeys.list(filters),
    enabled: isElectron,
    queryFn: () => aiLogs.query(filters ?? {}),
  });
}

/**
 * Hook for fetching the count of AI logs matching optional filters.
 */
export function useAiLogsCount(filters?: AiLogFilterParams) {
  const { aiLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiLogKeys.count(filters),
    enabled: isElectron,
    queryFn: () => aiLogs.getCount(filters),
  });
}

/**
 * Hook for deleting a single AI log entry.
 * Invalidates all AI log queries on success.
 */
export function useDeleteAiLog() {
  const queryClient = useQueryClient();
  const { aiLogs } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => aiLogs.delete(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: aiLogKeys.detail(id).queryKey });
      void queryClient.invalidateQueries({ queryKey: aiLogKeys._def });
    },
  });
}

/**
 * Hook for fetching the latest AI log entries.
 */
export function useLatestAiLogs(limit?: number) {
  const { aiLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiLogKeys.latest(limit),
    enabled: isElectron,
    queryFn: () => aiLogs.getLatest(limit),
  });
}

/**
 * Hook for purging AI logs older than a specified date.
 * Invalidates all AI log queries on success.
 */
export function usePurgeAiLogs() {
  const queryClient = useQueryClient();
  const { aiLogs } = useElectronDb();

  return useMutation({
    mutationFn: (date: string) => aiLogs.purge(date),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiLogKeys._def });
    },
  });
}

/**
 * Hook for updating the AI debug logging configuration.
 * Uses electron-store via IPC for persistent storage.
 */
export function useUpdateAiDebugLoggingConfig() {
  const queryClient = useQueryClient();
  const { setConfig } = useElectronAiDebugLogging();

  return useMutation({
    mutationFn: (config: AiLogConfig) => setConfig(config),
    onSuccess: (success, config) => {
      if (success) {
        queryClient.setQueryData(aiLogKeys.config.queryKey, config);
      }
    },
  });
}
