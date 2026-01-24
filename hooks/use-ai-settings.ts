'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  AISettingsKey,
  AISettingsModifications,
  AISettingsPersistenceMode,
  AISettingsValues,
} from '@/lib/ai/settings';

import { compareWithDefaults, hasAnyModification, mergeWithDefaults } from '@/lib/ai/settings';

/**
 * Options for the useAISettings hook.
 */
export interface UseAISettingsOptions {
  /**
   * The default values to compare against for modification tracking.
   * For project settings, this would be global defaults.
   * For workflow steps, this would be project defaults.
   */
  defaultValues: AISettingsValues;

  /**
   * Initial values (current saved state).
   * If not provided, defaults will be used.
   */
  initialValues?: AISettingsValues;

  /**
   * Whether persistence is currently happening.
   */
  isPersisting?: boolean;

  /**
   * Callback when values change.
   * For 'immediate' mode, called on every change.
   * For 'local' mode, only called on explicit save.
   */
  onPersist?: (values: Partial<AISettingsValues>) => Promise<void> | void;

  /**
   * How changes should be persisted.
   * - 'immediate': Changes trigger onPersist immediately
   * - 'local': Changes stay local until save() is called
   */
  persistenceMode: AISettingsPersistenceMode;
}

/**
 * Return type for the useAISettings hook.
 */
export interface UseAISettingsReturn {
  /** Default values for comparison and reset */
  defaultValues: AISettingsValues;

  /** Whether any field is modified from defaults */
  hasAnyModification: boolean;

  /** For 'local' mode: whether there are unsaved changes */
  isDirty: boolean;

  /** Whether currently persisting */
  isPersisting: boolean;

  /** Which individual fields are modified from defaults */
  modifications: AISettingsModifications;

  /** Reset all values to defaults */
  resetToDefaults: () => void;

  /** Reset a single value to its default */
  resetValue: (key: AISettingsKey) => void;

  /** For 'local' mode: trigger explicit save of all changes */
  save: () => Promise<void>;

  /** Update a single value */
  updateValue: <K extends AISettingsKey>(key: K, value: AISettingsValues[K]) => void;

  /** Update multiple values at once */
  updateValues: (updates: Partial<AISettingsValues>) => void;

  /** Current values (local state) */
  values: AISettingsValues;
}

/**
 * Core hook for managing AI settings state.
 *
 * This hook provides:
 * - Local state management for settings values
 * - Modification tracking against defaults
 * - Two persistence modes: immediate and local
 * - Reset functionality
 *
 * Use the adapter hooks (useGlobalAISettings, useProjectAISettings, useLocalAISettings)
 * for specific contexts.
 */
export function useAISettings({
  defaultValues,
  initialValues,
  isPersisting = false,
  onPersist,
  persistenceMode,
}: UseAISettingsOptions): UseAISettingsReturn {
  // Merge initial values with defaults to ensure all fields have values
  const mergedInitial = useMemo(
    () => mergeWithDefaults(initialValues ?? {}, defaultValues),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only compute on mount, not on every render
  );

  // Local state for current values
  const [values, setValues] = useState<AISettingsValues>(mergedInitial);

  // Track which values have been changed locally (for 'local' mode dirty tracking)
  const [localChanges, setLocalChanges] = useState<Partial<AISettingsValues>>({});

  // Track the previous initial values to detect external changes
  const prevInitialRef = useRef(initialValues);

  // Sync local state when initial values change externally (e.g., data refetch)
  useEffect(() => {
    if (initialValues !== prevInitialRef.current) {
      prevInitialRef.current = initialValues;
      const newMerged = mergeWithDefaults(initialValues ?? {}, defaultValues);
      setValues(newMerged);
      // Clear local changes since we're syncing with new external data
      if (persistenceMode === 'immediate') {
        setLocalChanges({});
      }
    }
  }, [initialValues, defaultValues, persistenceMode]);

  // Compute modifications by comparing current values against defaults
  const modifications = useMemo(() => compareWithDefaults(values, defaultValues), [values, defaultValues]);

  // Check if any modification exists
  const hasModification = useMemo(() => hasAnyModification(modifications), [modifications]);

  // For 'local' mode: check if there are unsaved changes
  const isDirty = useMemo(() => Object.keys(localChanges).length > 0, [localChanges]);

  // Update a single value
  const updateValue = useCallback(
    <K extends AISettingsKey>(key: K, value: AISettingsValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));

      if (persistenceMode === 'immediate') {
        // Persist immediately
        onPersist?.({ [key]: value });
      } else {
        // Track local change for later save
        setLocalChanges((prev) => ({ ...prev, [key]: value }));
      }
    },
    [onPersist, persistenceMode]
  );

  // Update multiple values at once
  const updateValues = useCallback(
    (updates: Partial<AISettingsValues>) => {
      setValues((prev) => ({ ...prev, ...updates }));

      if (persistenceMode === 'immediate') {
        // Persist immediately
        onPersist?.(updates);
      } else {
        // Track local changes for later save
        setLocalChanges((prev) => ({ ...prev, ...updates }));
      }
    },
    [onPersist, persistenceMode]
  );

  // Reset a single value to its default
  const resetValue = useCallback(
    (key: AISettingsKey) => {
      const defaultValue = defaultValues[key];
      setValues((prev) => ({ ...prev, [key]: defaultValue }));

      if (persistenceMode === 'immediate') {
        onPersist?.({ [key]: defaultValue });
      } else {
        setLocalChanges((prev) => ({ ...prev, [key]: defaultValue }));
      }
    },
    [defaultValues, onPersist, persistenceMode]
  );

  // Reset all values to defaults
  const resetToDefaults = useCallback(() => {
    setValues({ ...defaultValues });

    if (persistenceMode === 'immediate') {
      onPersist?.(defaultValues);
    } else {
      setLocalChanges(defaultValues);
    }
  }, [defaultValues, onPersist, persistenceMode]);

  // For 'local' mode: save all accumulated changes
  const save = useCallback(async () => {
    if (persistenceMode === 'local' && Object.keys(localChanges).length > 0) {
      await onPersist?.(localChanges);
      setLocalChanges({});
    }
  }, [localChanges, onPersist, persistenceMode]);

  return {
    defaultValues,
    hasAnyModification: hasModification,
    isDirty,
    isPersisting,
    modifications,
    resetToDefaults,
    resetValue,
    save,
    updateValue,
    updateValues,
    values,
  };
}
