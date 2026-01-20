'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FeatureRequestRunStep } from '@/db/schema/feature-request-runs.schema';

import { featureRequestRunKeys } from '@/lib/queries/feature-request-runs';

import { useElectronDb } from '../useElectron';

export function useCreateRun() {
  const queryClient = useQueryClient();
  const { featureRequestRuns } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof featureRequestRuns.create>[0]) => featureRequestRuns.create(data),
    onSuccess: (run) => {
      if (run) {
        queryClient.setQueryData(featureRequestRunKeys.detail(run.id).queryKey, run);
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.byFeatureRequestAndStep._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.latest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.latestByStep._def });
      }
    },
  });
}

export function useCurrentRun(featureRequestId: number, step: FeatureRequestRunStep) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.currentRun(featureRequestId, step),
    enabled: isElectron && featureRequestId > 0,
    queryFn: async () => {
      const result = await featureRequestRuns.getCurrentRun(featureRequestId, step);
      return result ?? null;
    },
  });
}

export function useDeleteRun() {
  const queryClient = useQueryClient();
  const { featureRequestRuns } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => featureRequestRuns.delete(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: featureRequestRunKeys.detail(id).queryKey });
      void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys._def });
    },
  });
}

export function useLatestRun(featureRequestId: number) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.latest(featureRequestId),
    enabled: isElectron && featureRequestId > 0,
    queryFn: async () => {
      const result = await featureRequestRuns.getLatestByFeatureRequestId(featureRequestId);
      return result ?? null;
    },
  });
}

export function useLatestRunByStep(featureRequestId: number, step: FeatureRequestRunStep) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.latestByStep(featureRequestId, step),
    enabled: isElectron && featureRequestId > 0,
    queryFn: async () => {
      const result = await featureRequestRuns.getLatestByFeatureRequestIdAndStep(featureRequestId, step);
      return result ?? null;
    },
  });
}

export function useRun(id: number) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => featureRequestRuns.getById(id),
  });
}

export function useRunHistory(featureRequestId: number) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.byFeatureRequest(featureRequestId),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => featureRequestRuns.getByFeatureRequestId(featureRequestId),
  });
}

export function useRunsByStep(featureRequestId: number, step: FeatureRequestRunStep) {
  const { featureRequestRuns, isElectron } = useElectronDb();

  return useQuery({
    ...featureRequestRunKeys.byFeatureRequestAndStep(featureRequestId, step),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => featureRequestRuns.getByFeatureRequestIdAndStep(featureRequestId, step),
  });
}

export function useSetCurrentRun() {
  const queryClient = useQueryClient();
  const { featureRequestRuns } = useElectronDb();

  return useMutation({
    mutationFn: ({
      featureRequestId,
      runId,
      step,
    }: {
      featureRequestId: number;
      runId: number;
      step: FeatureRequestRunStep;
    }) => featureRequestRuns.setCurrentRun(featureRequestId, step, runId),
    onSuccess: (run, { featureRequestId, step }) => {
      if (run) {
        queryClient.setQueryData(featureRequestRunKeys.detail(run.id).queryKey, run);
        queryClient.setQueryData(featureRequestRunKeys.currentRun(featureRequestId, step).queryKey, run);
        void queryClient.invalidateQueries({
          queryKey: featureRequestRunKeys.byFeatureRequest(featureRequestId).queryKey,
        });
        void queryClient.invalidateQueries({
          queryKey: featureRequestRunKeys.byFeatureRequestAndStep(featureRequestId, step).queryKey,
        });
      }
    },
  });
}

export function useUpdateRun() {
  const queryClient = useQueryClient();
  const { featureRequestRuns } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof featureRequestRuns.update>[1]; id: number }) =>
      featureRequestRuns.update(id, data),
    onSuccess: (run) => {
      if (run) {
        queryClient.setQueryData(featureRequestRunKeys.detail(run.id).queryKey, run);
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.byFeatureRequestAndStep._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.currentRun._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.latest._def });
        void queryClient.invalidateQueries({ queryKey: featureRequestRunKeys.latestByStep._def });
      }
    },
  });
}
