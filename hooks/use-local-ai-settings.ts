'use client';

import { useMemo } from 'react';

import type { AISettingsValues } from '@/lib/ai/settings';

import { DEFAULT_AI_SETTINGS, mergeWithDefaults } from '@/lib/ai/settings';

import type { UseAISettingsReturn } from './use-ai-settings';

import { useAISettings } from './use-ai-settings';

/**
 * Hook for dialog contexts that need local overrides with project defaults as base.
 *
 * Combines useProjectAISettings defaults with local-only state management.
 * Changes do not persist to the database.
 *
 * @param projectDefaults - The project default settings to use as base
 * @returns UseAISettingsReturn - Settings state and update functions with reset capability
 */
export function useDialogAISettings(projectDefaults: AISettingsValues): UseAISettingsReturn {
  return useLocalAISettings(projectDefaults);
}

/**
 * Adapter hook for managing local/temporary AI settings.
 *
 * Used for dialogs and other contexts where changes should not persist
 * to the database. Changes are tracked locally and can be reset to defaults.
 *
 * @param defaultValues - The default values to use (typically from project settings)
 * @param initialOverrides - Optional initial override values
 * @returns UseAISettingsReturn - Settings state and update functions
 */
export function useLocalAISettings(
  defaultValues: AISettingsValues = DEFAULT_AI_SETTINGS,
  initialOverrides?: Partial<AISettingsValues>
): UseAISettingsReturn {
  // Merge default values with hardcoded defaults to ensure all fields exist
  const mergedDefaults = useMemo(() => mergeWithDefaults(defaultValues, DEFAULT_AI_SETTINGS), [defaultValues]);

  // Initial values include any provided overrides
  const initialValues = useMemo(() => {
    if (!initialOverrides) {
      return mergedDefaults;
    }
    return mergeWithDefaults(initialOverrides, mergedDefaults);
  }, [initialOverrides, mergedDefaults]);

  return useAISettings({
    defaultValues: mergedDefaults,
    initialValues,
    isPersisting: false,
    persistenceMode: 'local',
  });
}
