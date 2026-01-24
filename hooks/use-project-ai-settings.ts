'use client';

import { useCallback, useMemo } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { AISettingsValues } from '@/lib/ai/settings';

import { useGlobalModelDefaults } from '@/components/providers/global-model-defaults-provider';
import { useStepConfig, useUpsertStepConfig } from '@/hooks/queries/use-step-configurations';
import {
  DEFAULT_AI_SETTINGS,
  mapConfigToValues,
  mapGlobalDefaultsToValues,
  mapValuesToConfig,
  mergeWithDefaults,
} from '@/lib/ai/settings';

import type { UseAISettingsReturn } from './use-ai-settings';

import { useAISettings } from './use-ai-settings';

/**
 * Adapter hook for managing project-level AI settings.
 *
 * Uses TanStack Query for data fetching and mutations.
 * Falls back to global defaults when no project config exists.
 * Changes are persisted immediately to the database.
 *
 * @param projectId - The project ID to manage settings for
 * @param step - The workflow step to manage settings for
 * @returns UseAISettingsReturn - Settings state and update functions
 */
export function useProjectAISettings(projectId: number, step: StepConfigurationStep): UseAISettingsReturn {
  const { data: config, isLoading: isConfigLoading } = useStepConfig(projectId, step);
  const upsertMutation = useUpsertStepConfig();
  const { defaults: globalDefaults } = useGlobalModelDefaults();

  // Default values come from global settings (or hardcoded defaults if no global config)
  const defaultValues = useMemo(() => {
    const globalStepDefaults = mapGlobalDefaultsToValues(globalDefaults[step]);
    return mergeWithDefaults(globalStepDefaults, DEFAULT_AI_SETTINGS);
  }, [globalDefaults, step]);

  // Initial values come from project config (or default values if no config)
  const initialValues = useMemo(() => {
    if (!config) {
      return defaultValues;
    }
    return mapConfigToValues(config);
  }, [config, defaultValues]);

  // Persist callback that upserts to the database
  const handlePersist = useCallback(
    (values: Partial<AISettingsValues>) => {
      const configData = mapValuesToConfig(values);
      upsertMutation.mutate({
        data: configData,
        projectId,
        step,
      });
    },
    [projectId, step, upsertMutation]
  );

  return useAISettings({
    defaultValues,
    initialValues,
    isPersisting: isConfigLoading || upsertMutation.isPending,
    onPersist: handlePersist,
    persistenceMode: 'immediate',
  });
}

/**
 * Hook that returns project AI settings as a model config object.
 * Useful for passing to AI operation components that expect the legacy config format.
 *
 * @param projectId - The project ID
 * @param step - The workflow step
 * @returns Model config object compatible with existing components
 */
export function useProjectModelConfig(projectId: number, step: StepConfigurationStep) {
  const settings = useProjectAISettings(projectId, step);

  return useMemo(
    () => ({
      customPrompt: settings.values.customSystemPrompt,
      isLoading: settings.isPersisting,
      maxTokens: settings.values.maxTokens,
      modelId: settings.values.modelId,
      temperature: settings.values.temperature,
      thinkingBudget: settings.values.thinkingBudget,
      thinkingEnabled: settings.values.thinkingEnabled ?? false,
    }),
    [settings.values, settings.isPersisting]
  );
}
