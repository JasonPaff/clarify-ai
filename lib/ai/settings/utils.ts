import type { StepConfiguration } from '@/db/schema/step-configurations.schema';
import type { GlobalStepModelDefaults } from '@/lib/ai/global-model-defaults';
import type { FullModelId } from '@/lib/ai/models';

import type { AISettingsKey, AISettingsModifications, AISettingsValues } from './types';

import { DEFAULT_AI_SETTINGS } from './constants';

/**
 * Compare current values against default values and return modification flags.
 */
export function compareWithDefaults(
  currentValues: AISettingsValues,
  defaultValues: AISettingsValues
): AISettingsModifications {
  return {
    customSystemPrompt: isModified(currentValues.customSystemPrompt, defaultValues.customSystemPrompt),
    maxTokens: isModified(currentValues.maxTokens, defaultValues.maxTokens),
    modelId: isModified(currentValues.modelId, defaultValues.modelId),
    temperature: isModified(currentValues.temperature, defaultValues.temperature),
    thinkingBudget: isModified(currentValues.thinkingBudget, defaultValues.thinkingBudget),
    thinkingEnabled: isModified(currentValues.thinkingEnabled, defaultValues.thinkingEnabled),
  };
}

/**
 * Format max tokens value for display.
 */
export function formatMaxTokens(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
}

/**
 * Format temperature value for display.
 */
export function formatTemperature(value: number): string {
  return value.toFixed(1);
}

/**
 * Format thinking budget value for display.
 */
export function formatThinkingBudget(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k tokens`;
  }
  return `${value} tokens`;
}

/**
 * Get the effective value for a settings field, falling back to defaults.
 */
export function getEffectiveValue<K extends AISettingsKey>(
  key: K,
  currentValues: AISettingsValues,
  defaultValues: AISettingsValues
): AISettingsValues[K] {
  const current = currentValues[key];
  if (current !== undefined && current !== null) {
    return current;
  }
  return defaultValues[key];
}

/**
 * Check if any value in the modifications object is true.
 */
export function hasAnyModification(modifications: AISettingsModifications): boolean {
  return Object.values(modifications).some(Boolean);
}

/**
 * Convert a database StepConfiguration to AISettingsValues.
 */
export function mapConfigToValues(config: null | StepConfiguration | undefined): AISettingsValues {
  if (!config) {
    return { ...DEFAULT_AI_SETTINGS };
  }

  const modelId =
    config.modelProvider && config.modelId ? (`${config.modelProvider}:${config.modelId}` as FullModelId) : null;

  return {
    customSystemPrompt: config.customSystemPrompt ?? undefined,
    maxTokens: config.maxTokens ?? undefined,
    modelId,
    temperature: config.temperature ?? undefined,
    thinkingBudget: config.thinkingBudget ?? undefined,
    thinkingEnabled: config.thinkingEnabled ?? undefined,
  };
}

/**
 * Convert GlobalStepModelDefaults to AISettingsValues.
 */
export function mapGlobalDefaultsToValues(defaults: GlobalStepModelDefaults | undefined): AISettingsValues {
  if (!defaults) {
    return { ...DEFAULT_AI_SETTINGS };
  }

  const modelId =
    defaults.modelProvider && defaults.modelId ? (`${defaults.modelProvider}:${defaults.modelId}` as FullModelId) : null;

  return {
    customSystemPrompt: defaults.customSystemPrompt,
    maxTokens: defaults.maxTokens,
    modelId,
    temperature: defaults.temperature,
    thinkingBudget: defaults.thinkingBudget,
    thinkingEnabled: defaults.thinkingEnabled,
  };
}

/**
 * Convert AISettingsValues to format suitable for database upsert.
 */
export function mapValuesToConfig(values: Partial<AISettingsValues>): {
  customSystemPrompt?: null | string;
  maxTokens?: null | number;
  modelId?: null | string;
  modelProvider?: null | string;
  temperature?: null | number;
  thinkingBudget?: null | number;
  thinkingEnabled?: boolean;
} {
  const result: ReturnType<typeof mapValuesToConfig> = {};

  if ('modelId' in values) {
    if (values.modelId) {
      const [provider, ...modelParts] = values.modelId.split(':');
      result.modelProvider = provider ?? null;
      result.modelId = modelParts.join(':') || null;
    } else {
      result.modelProvider = null;
      result.modelId = null;
    }
  }

  if ('temperature' in values) {
    result.temperature = values.temperature ?? null;
  }

  if ('maxTokens' in values) {
    result.maxTokens = values.maxTokens ?? null;
  }

  if ('thinkingEnabled' in values) {
    result.thinkingEnabled = values.thinkingEnabled ?? false;
  }

  if ('thinkingBudget' in values) {
    result.thinkingBudget = values.thinkingBudget ?? null;
  }

  if ('customSystemPrompt' in values) {
    result.customSystemPrompt = values.customSystemPrompt || null;
  }

  return result;
}

/**
 * Convert AISettingsValues to GlobalStepModelDefaults format.
 */
export function mapValuesToGlobalDefaults(values: Partial<AISettingsValues>): GlobalStepModelDefaults {
  const result: GlobalStepModelDefaults = {};

  if (values.modelId) {
    const [provider, ...modelParts] = values.modelId.split(':');
    result.modelProvider = provider;
    result.modelId = modelParts.join(':');
  }

  if (values.temperature !== undefined) {
    result.temperature = values.temperature;
  }

  if (values.maxTokens !== undefined) {
    result.maxTokens = values.maxTokens;
  }

  if (values.thinkingEnabled !== undefined) {
    result.thinkingEnabled = values.thinkingEnabled;
  }

  if (values.thinkingBudget !== undefined) {
    result.thinkingBudget = values.thinkingBudget;
  }

  if (values.customSystemPrompt !== undefined) {
    result.customSystemPrompt = values.customSystemPrompt;
  }

  return result;
}

/**
 * Merge partial values with defaults, filling in missing fields.
 */
export function mergeWithDefaults(
  values: Partial<AISettingsValues>,
  defaults: AISettingsValues = DEFAULT_AI_SETTINGS
): AISettingsValues {
  return {
    customSystemPrompt: values.customSystemPrompt ?? defaults.customSystemPrompt,
    maxTokens: values.maxTokens ?? defaults.maxTokens,
    modelId: values.modelId ?? defaults.modelId,
    temperature: values.temperature ?? defaults.temperature,
    thinkingBudget: values.thinkingBudget ?? defaults.thinkingBudget,
    thinkingEnabled: values.thinkingEnabled ?? defaults.thinkingEnabled,
  };
}

/**
 * Check if a value has been modified from its default.
 */
function isModified<T>(current: T, defaultValue: T): boolean {
  // Treat empty string same as undefined for customSystemPrompt
  if (current === '' && (defaultValue === undefined || defaultValue === null)) {
    return false;
  }
  if (defaultValue === '' && (current === undefined || current === null)) {
    return false;
  }
  return current !== defaultValue;
}
