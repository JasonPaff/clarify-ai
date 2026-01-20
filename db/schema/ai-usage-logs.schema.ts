import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { projects } from './projects.schema';

export const aiUsageLogs = sqliteTable(
  'ai_usage_logs',
  {
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    durationMs: integer('duration_ms').notNull(),
    errorMessage: text('error_message'),
    estimatedCostUsd: real('estimated_cost_usd').notNull(),
    id: integer('id').primaryKey({ autoIncrement: true }),
    inputTokens: integer('input_tokens').notNull(),
    modelId: text('model_id').notNull(),
    modelProvider: text('model_provider').notNull(),
    operationType: text('operation_type').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
    success: integer('success', { mode: 'boolean' }).notNull(),
    totalTokens: integer('total_tokens').notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('ai_usage_logs_created_at_idx').on(table.createdAt),
    index('ai_usage_logs_operation_type_idx').on(table.operationType),
    index('ai_usage_logs_project_id_idx').on(table.projectId),
  ]
);

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert;
