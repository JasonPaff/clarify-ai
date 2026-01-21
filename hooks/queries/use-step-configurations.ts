'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

import { stepConfigurationKeys } from '@/lib/queries/step-configurations';

import { useElectronDb } from '../useElectron';

export function useCreateStepConfiguration() {
  const queryClient = useQueryClient();
  const { stepConfigurations } = useElectronDb();

  return useMutation({
    mutationFn: (data: Parameters<typeof stepConfigurations.create>[0]) => stepConfigurations.create(data),
    onSuccess: (config) => {
      if (config) {
        queryClient.setQueryData(stepConfigurationKeys.detail(config.id).queryKey, config);
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProject._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProjectAndStep._def });
      }
    },
  });
}

export function useDeleteStepConfiguration() {
  const queryClient = useQueryClient();
  const { stepConfigurations } = useElectronDb();

  return useMutation({
    mutationFn: (id: number) => stepConfigurations.delete(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: stepConfigurationKeys.detail(id).queryKey });
      void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys._def });
    },
  });
}

export function useStepConfig(projectId: number, step: StepConfigurationStep) {
  const { isElectron, stepConfigurations } = useElectronDb();

  return useQuery({
    ...stepConfigurationKeys.byProjectAndStep(projectId, step),
    enabled: isElectron && projectId > 0,
    queryFn: async () => {
      const result = await stepConfigurations.getByProjectIdAndStep(projectId, step);
      return result ?? null;
    },
  });
}

export function useStepConfiguration(id: number) {
  const { isElectron, stepConfigurations } = useElectronDb();

  return useQuery({
    ...stepConfigurationKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => stepConfigurations.getById(id),
  });
}

export function useStepConfigurations(projectId: number) {
  const { isElectron, stepConfigurations } = useElectronDb();

  return useQuery({
    ...stepConfigurationKeys.byProject(projectId),
    enabled: isElectron && projectId > 0,
    queryFn: () => stepConfigurations.getByProjectId(projectId),
  });
}

export function useUpdateStepConfig() {
  const queryClient = useQueryClient();
  const { stepConfigurations } = useElectronDb();

  return useMutation({
    mutationFn: ({ data, id }: { data: Parameters<typeof stepConfigurations.update>[1]; id: number }) =>
      stepConfigurations.update(id, data),
    onSuccess: (config) => {
      if (config) {
        queryClient.setQueryData(stepConfigurationKeys.detail(config.id).queryKey, config);
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProject._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProjectAndStep._def });
      }
    },
  });
}

export function useUpsertStepConfig() {
  const queryClient = useQueryClient();
  const { stepConfigurations } = useElectronDb();

  return useMutation({
    mutationFn: ({
      data,
      projectId,
      step,
    }: {
      data: Parameters<typeof stepConfigurations.upsert>[2];
      projectId: number;
      step: StepConfigurationStep;
    }) => stepConfigurations.upsert(projectId, step, data),
    onSuccess: (config) => {
      if (config) {
        queryClient.setQueryData(stepConfigurationKeys.detail(config.id).queryKey, config);
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProject._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byProjectAndStep._def });
      }
    },
  });
}
