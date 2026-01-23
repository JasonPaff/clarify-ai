import type { AiLogConfig, AiLogWorkflowStep } from '@/types/ai-log';

/**
 * Storage key for AI debug logging configuration in electron-store.
 */
export const AI_DEBUG_LOGGING_STORAGE_KEY = 'app:ai-debug-logging-config';

/**
 * Check if we're in development mode.
 * In Electron, process.env.NODE_ENV is available in the main process,
 * but we check for common development indicators.
 */
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

/**
 * Default configuration for AI debug logging.
 * Enabled in development, disabled in production.
 */
export const DEFAULT_AI_DEBUG_LOGGING_CONFIG: AiLogConfig = {
  enabled: isDevelopment,
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  maxEntries: 1000,
  redactSensitiveData: true,
  truncationThreshold: 10000, // 10,000 characters
};

/**
 * Retention policy constants for log cleanup.
 */
export const RETENTION_POLICY = {
  /** Maximum age of log entries in milliseconds (7 days) */
  MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  /** Maximum number of log entries to retain */
  MAX_ENTRIES: 1000,
} as const;

/**
 * Truncation thresholds for displaying large content.
 */
export const TRUNCATION_THRESHOLDS = {
  /** Maximum characters for detailed view */
  DETAILED: 5000,
  /** Maximum characters for preview display */
  PREVIEW: 500,
  /** Maximum characters for full storage */
  STORAGE: 50000,
} as const;

/**
 * Sensitive data patterns for redaction.
 * These regex patterns identify API keys, tokens, and other sensitive data.
 */
export const SENSITIVE_DATA_PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-[a-zA-Z0-9-_]{32,}/g,
    replacement: '[REDACTED_ANTHROPIC_KEY]',
  },
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{32,}/g,
    replacement: '[REDACTED_OPENAI_KEY]',
  },
  {
    name: 'Google API Key',
    pattern: /AIza[a-zA-Z0-9_-]{35}/g,
    replacement: '[REDACTED_GOOGLE_KEY]',
  },
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+[a-zA-Z0-9._-]+/gi,
    replacement: 'Bearer [REDACTED_TOKEN]',
  },
  {
    name: 'Authorization Header',
    pattern: /"authorization"\s*:\s*"[^"]+"/gi,
    replacement: '"authorization": "[REDACTED]"',
  },
  {
    name: 'API Key Header',
    pattern: /"x-api-key"\s*:\s*"[^"]+"/gi,
    replacement: '"x-api-key": "[REDACTED]"',
  },
  {
    name: 'Generic Secret',
    pattern: /"(secret|password|token|apikey|api_key)":\s*"[^"]+"/gi,
    replacement: '"$1": "[REDACTED]"',
  },
];

/**
 * Display names for workflow steps.
 * Maps internal workflow step identifiers to human-readable names.
 */
export const WORKFLOW_STEP_DISPLAY_NAMES: Record<AiLogWorkflowStep, string> = {
  clarification: 'Clarification',
  discovery: 'File Discovery',
  overview: 'Repository Overview',
  planning: 'Implementation Planning',
};

/**
 * Status display configuration for log entries.
 */
export const STATUS_DISPLAY_CONFIG = {
  completed: {
    color: 'success',
    label: 'Completed',
  },
  failed: {
    color: 'error',
    label: 'Failed',
  },
  pending: {
    color: 'muted',
    label: 'Pending',
  },
  streaming: {
    color: 'info',
    label: 'Streaming',
  },
} as const;

/**
 * Time range filter options with labels and duration calculations.
 */
export const TIME_RANGE_OPTIONS = {
  all: {
    getStartTime: () => undefined,
    label: 'All Time',
  },
  custom: {
    getStartTime: () => undefined,
    label: 'Custom Range',
  },
  'last-7d': {
    getStartTime: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    label: 'Last 7 Days',
  },
  'last-24h': {
    getStartTime: () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    label: 'Last 24 Hours',
  },
  'last-hour': {
    getStartTime: () => new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    label: 'Last Hour',
  },
} as const;
