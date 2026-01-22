import type { GlobalModelDefaults } from './types';

/**
 * Storage key for global model defaults in electron-store.
 */
export const GLOBAL_MODEL_DEFAULTS_STORAGE_KEY = 'app:global-model-defaults';

/**
 * Default values when no global defaults have been configured.
 * These provide sensible starting values for temperature and max tokens.
 */
export const DEFAULT_GLOBAL_MODEL_DEFAULTS: GlobalModelDefaults = {};

/**
 * Default temperature value for AI model calls.
 */
export const DEFAULT_TEMPERATURE = 0.2;

/**
 * Default max tokens value for AI model calls.
 */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Default thinking budget for extended thinking.
 */
export const DEFAULT_THINKING_BUDGET = 8192;
