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
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequestAndStep._def });
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

export function useStepConfig(featureRequestId: number, step: StepConfigurationStep) {
  const { isElectron, stepConfigurations } = useElectronDb();

  return useQuery({
    ...stepConfigurationKeys.byFeatureRequestAndStep(featureRequestId, step),
    enabled: isElectron && featureRequestId > 0,
    queryFn: async () => {
      const result = await stepConfigurations.getByFeatureRequestIdAndStep(featureRequestId, step);
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

export function useStepConfigurations(featureRequestId: number) {
  const { isElectron, stepConfigurations } = useElectronDb();

  return useQuery({
    ...stepConfigurationKeys.byFeatureRequest(featureRequestId),
    enabled: isElectron && featureRequestId > 0,
    queryFn: () => stepConfigurations.getByFeatureRequestId(featureRequestId),
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
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequestAndStep._def });
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
      featureRequestId,
      step,
    }: {
      data: Parameters<typeof stepConfigurations.upsert>[2];
      featureRequestId: number;
      step: StepConfigurationStep;
    }) => stepConfigurations.upsert(featureRequestId, step, data),
    onSuccess: (config) => {
      if (config) {
        queryClient.setQueryData(stepConfigurationKeys.detail(config.id).queryKey, config);
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequest._def });
        void queryClient.invalidateQueries({ queryKey: stepConfigurationKeys.byFeatureRequestAndStep._def });
      }
    },
  });
}
