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

export function useClearStepsStale() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: async ({ featureRequestId, steps }: { featureRequestId: number; steps: Array<string> }) => {
      // Get the current feature request to filter stale steps
      const current = await featureRequests.getById(featureRequestId);
      if (!current) {
        throw new Error(`Feature request ${featureRequestId} not found`);
      }

      // Parse existing stale steps (stored as JSON array in text field)
      let existingStaleSteps: Array<{ staleAt: string; step: string }> = [];
      if (current.staleSteps) {
        try {
          existingStaleSteps = JSON.parse(current.staleSteps) as Array<{ staleAt: string; step: string }>;
        } catch {
          // If parsing fails, nothing to clear
          return current;
        }
      }

      // Filter out the steps to be cleared
      const stepsToRemove = new Set(steps);
      const remainingStaleSteps = existingStaleSteps.filter((s) => !stepsToRemove.has(s.step));

      // Update the feature request with filtered stale steps
      return featureRequests.update(featureRequestId, {
        staleSteps: remainingStaleSteps.length > 0 ? JSON.stringify(remainingStaleSteps) : null,
      });
    },
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

export function useMarkStepsStale() {
  const queryClient = useQueryClient();
  const { featureRequests } = useElectronDb();

  return useMutation({
    mutationFn: async ({ featureRequestId, steps }: { featureRequestId: number; steps: Array<string> }) => {
      // Get the current feature request to merge stale steps
      const current = await featureRequests.getById(featureRequestId);
      if (!current) {
        throw new Error(`Feature request ${featureRequestId} not found`);
      }

      // Parse existing stale steps (stored as JSON array in text field)
      let existingStaleSteps: Array<{ staleAt: string; step: string }> = [];
      if (current.staleSteps) {
        try {
          existingStaleSteps = JSON.parse(current.staleSteps) as Array<{ staleAt: string; step: string }>;
        } catch {
          // If parsing fails, start fresh
          existingStaleSteps = [];
        }
      }

      // Add new stale steps (avoid duplicates by step name)
      const existingStepNames = new Set(existingStaleSteps.map((s) => s.step));
      const timestamp = new Date().toISOString();

      const newStaleSteps = [
        ...existingStaleSteps,
        ...steps.filter((step) => !existingStepNames.has(step)).map((step) => ({ staleAt: timestamp, step })),
      ];

      // Update the feature request with merged stale steps
      return featureRequests.update(featureRequestId, {
        staleSteps: JSON.stringify(newStaleSteps),
      });
    },
    onSuccess: (featureRequest) => {
      if (featureRequest) {
        queryClient.setQueryData(featureRequestKeys.detail(featureRequest.id).queryKey, featureRequest);
        void queryClient.invalidateQueries({ queryKey: featureRequestKeys.byProject._def });
      }
    },
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
