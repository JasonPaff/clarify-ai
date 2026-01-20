import { z } from 'zod';

// Schema for a complete AI usage log record (matching database schema)
export const aiUsageLogSchema = z.object({
  createdAt: z.string(),
  durationMs: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
  estimatedCostUsd: z.number().nonnegative(),
  id: z.number(),
  inputTokens: z.number().int().nonnegative(),
  modelId: z.string(),
  modelProvider: z.string(),
  operationType: z.string(),
  outputTokens: z.number().int().nonnegative(),
  projectId: z.number().nullable(),
  success: z.boolean(),
  totalTokens: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export type AiUsageLogData = z.infer<typeof aiUsageLogSchema>;

// Schema for filtering AI usage logs (query parameters)
export const aiUsageLogFilterSchema = z.object({
  endDate: z.string().optional(),
  operationType: z.string().optional(),
  projectId: z.number().optional(),
  startDate: z.string().optional(),
});

export type AiUsageLogFilter = z.infer<typeof aiUsageLogFilterSchema>;
