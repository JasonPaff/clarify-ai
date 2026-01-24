import { z } from 'zod';

/**
 * Workflow step enum validation for AI operations.
 * Matches the database schema values from ai-logs.schema.ts.
 *
 * Values:
 * - 'clarify': The clarification/refinement step
 * - 'describe': The feature description step
 * - 'discover': The file discovery/research step
 * - 'other': Any other AI operation outside the main workflow
 * - 'plan': The implementation planning step
 */
export const aiLogWorkflowStepSchema = z.enum(['clarify', 'describe', 'discover', 'other', 'plan']);

export type AiLogWorkflowStepValue = z.infer<typeof aiLogWorkflowStepSchema>;

/**
 * Status enum validation for AI log entries.
 * Matches the database schema values from ai-logs.schema.ts.
 *
 * Values:
 * - 'cancelled': Request was cancelled by user
 * - 'completed': Request finished successfully
 * - 'failed': Request encountered an error
 * - 'pending': Request not yet started
 * - 'streaming': Currently streaming response
 */
export const aiLogStatusSchema = z.enum(['cancelled', 'completed', 'failed', 'pending', 'streaming']);

export type AiLogStatusValue = z.infer<typeof aiLogStatusSchema>;

/**
 * Time range options for filtering AI logs.
 */
export const aiLogTimeRangeSchema = z.enum(['all', 'custom', 'last-7d', 'last-24h', 'last-hour']);

export type AiLogTimeRangeValue = z.infer<typeof aiLogTimeRangeSchema>;

/**
 * Filter schema for querying AI log entries.
 * All fields are optional to allow flexible filtering.
 */
export const aiLogFilterSchema = z.object({
  endDate: z.string().optional(),
  featureRequestId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  modelId: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
  projectId: z.number().int().positive().optional(),
  requestId: z.string().optional(),
  searchQuery: z.string().optional(),
  startDate: z.string().optional(),
  status: aiLogStatusSchema.optional(),
  timeRange: aiLogTimeRangeSchema.optional(),
  workflowStep: aiLogWorkflowStepSchema.optional(),
});

export type AiLogFilterFormValues = z.infer<typeof aiLogFilterSchema>;

/**
 * Configuration schema for AI debug logging settings.
 * Validates settings used to control logging behavior.
 *
 * Defaults (from lib/ai/debug-logging/constants.ts):
 * - enabled: true in development, false in production
 * - maxEntries: 1000
 * - maxAgeMs: 604800000 (7 days)
 * - redactSensitiveData: true
 * - truncationThreshold: 10000 (characters)
 */
export const aiLogConfigSchema = z.object({
  /** Whether AI debug logging is enabled */
  enabled: z.boolean(),
  /** Maximum age of log entries to retain (in milliseconds) */
  maxAgeMs: z.number().int().positive().min(60000, 'Minimum retention is 1 minute'),
  /** Maximum number of log entries to retain */
  maxEntries: z.number().int().positive().min(1, 'Must retain at least 1 entry').max(10000, 'Maximum 10,000 entries'),
  /** Whether to redact sensitive data (API keys, tokens) in logs */
  redactSensitiveData: z.boolean(),
  /** Maximum size of content fields before truncation (in characters) */
  truncationThreshold: z
    .number()
    .int()
    .positive()
    .min(100, 'Minimum 100 characters')
    .max(100000, 'Maximum 100,000 characters'),
});

export type AiLogConfigFormValues = z.infer<typeof aiLogConfigSchema>;

// Export enum options for use in form components
export const aiLogWorkflowStepOptions = aiLogWorkflowStepSchema.options;
export const aiLogStatusOptions = aiLogStatusSchema.options;
export const aiLogTimeRangeOptions = aiLogTimeRangeSchema.options;
