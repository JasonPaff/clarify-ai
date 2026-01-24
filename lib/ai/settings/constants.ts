import type { AISettingsValues } from './types';

/**
 * Default temperature value for AI model calls.
 * Lower values (closer to 0) produce more focused, deterministic responses.
 * Higher values (closer to 2) produce more creative, varied responses.
 */
export const DEFAULT_TEMPERATURE = 0.2;

/**
 * Default maximum tokens for AI model responses.
 */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Default thinking budget for extended thinking mode.
 * This is the token budget allocated for the model's reasoning process.
 */
export const DEFAULT_THINKING_BUDGET = 8192;

/**
 * Default value for extended thinking enabled.
 */
export const DEFAULT_THINKING_ENABLED = false;

/**
 * Temperature slider configuration.
 */
export const TEMPERATURE_CONFIG = {
  max: 2,
  min: 0,
  step: 0.1,
} as const;

/**
 * Max tokens slider configuration.
 */
export const MAX_TOKENS_CONFIG = {
  max: 16000,
  min: 100,
  step: 100,
} as const;

/**
 * Thinking budget slider configuration.
 */
export const THINKING_BUDGET_CONFIG = {
  max: 128000,
  min: 1024,
  step: 1024,
} as const;

/**
 * Storage key for global model defaults in electron-store.
 */
export const GLOBAL_MODEL_DEFAULTS_STORAGE_KEY = 'app:global-model-defaults';

/**
 * Default AI settings values.
 * Used when no configuration exists.
 */
export const DEFAULT_AI_SETTINGS: AISettingsValues = {
  customSystemPrompt: undefined,
  maxTokens: DEFAULT_MAX_TOKENS,
  modelId: null,
  temperature: DEFAULT_TEMPERATURE,
  thinkingBudget: DEFAULT_THINKING_BUDGET,
  thinkingEnabled: DEFAULT_THINKING_ENABLED,
};

/**
 * Get the default value for a specific settings key.
 */
export function getDefaultValue<K extends keyof AISettingsValues>(key: K): AISettingsValues[K] {
  return DEFAULT_AI_SETTINGS[key];
}
