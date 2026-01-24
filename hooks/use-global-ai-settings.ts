'use client';

import { useCallback, useMemo } from 'react';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';
import type { AISettingsValues } from '@/lib/ai/settings';

import { useGlobalModelDefaults } from '@/components/providers/global-model-defaults-provider';
import { DEFAULT_AI_SETTINGS, mapGlobalDefaultsToValues, mapValuesToGlobalDefaults } from '@/lib/ai/settings';

import type { UseAISettingsReturn } from './use-ai-settings';

import { useAISettings } from './use-ai-settings';

/**
 * Adapter hook for managing global AI settings (app-level defaults).
 *
 * Uses the GlobalModelDefaults context provider for persistence to electron-store.
 * Changes are persisted immediately.
 *
 * @param step - The workflow step to manage settings for
 * @returns UseAISettingsReturn - Settings state and update functions
 */
export function useGlobalAISettings(step: StepConfigurationStep): UseAISettingsReturn {
  const { defaults, isLoaded, setStepDefaults } = useGlobalModelDefaults();

  // Convert global defaults to AISettingsValues format
  const initialValues = useMemo(() => mapGlobalDefaultsToValues(defaults[step]), [defaults, step]);

  // Persist callback that converts to GlobalStepModelDefaults format
  const handlePersist = useCallback(
    (values: Partial<AISettingsValues>) => {
      const globalDefaults = mapValuesToGlobalDefaults(values);
      void setStepDefaults(step, globalDefaults);
    },
    [setStepDefaults, step]
  );

  return useAISettings({
    defaultValues: DEFAULT_AI_SETTINGS,
    initialValues,
    isPersisting: !isLoaded,
    onPersist: handlePersist,
    persistenceMode: 'immediate',
  });
}
