'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { aiUsageLogKeys } from '@/lib/queries/ai-usage-logs';

import { useElectronDb } from '../useElectron';

export function useAiUsageLogs(projectId: number) {
  const { aiUsageLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiUsageLogKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => aiUsageLogs.getByProjectId(projectId),
  });
}

export function useAiUsageLogsTotals(projectId: number) {
  const { aiUsageLogs, isElectron } = useElectronDb();

  return useQuery({
    ...aiUsageLogKeys.totalsByProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => aiUsageLogs.getTotalsByProjectId(projectId),
  });
}

export function useDeleteAiUsageLogs() {
  const queryClient = useQueryClient();
  const { aiUsageLogs } = useElectronDb();

  return useMutation({
    mutationFn: (projectId: number) => aiUsageLogs.delete(projectId),
    onSuccess: (_result, projectId) => {
      // Invalidate both byProject and totalsByProject queries for this project
      void queryClient.invalidateQueries({ queryKey: aiUsageLogKeys.byProject(projectId).queryKey });
      void queryClient.invalidateQueries({ queryKey: aiUsageLogKeys.totalsByProject(projectId).queryKey });
    },
  });
}
