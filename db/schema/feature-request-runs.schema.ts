import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { featureRequests } from './feature-requests.schema';

/**
 * Feature request run status values:
 * - 'pending': Run not yet started
 * - 'running': Run currently executing
 * - 'completed': Run finished successfully
 * - 'failed': Run encountered an error
 */
export type FeatureRequestRunStatus = 'completed' | 'failed' | 'pending' | 'running';

/**
 * Feature request run step values:
 * - 'refine': The refinement/clarification step
 * - 'research': The file discovery/research step
 * - 'plan': The implementation planning step
 */
export type FeatureRequestRunStep = 'plan' | 'refine' | 'research';

export const featureRequestRuns = sqliteTable(
  'feature_request_runs',
  {
    completedAt: text('completed_at'),
    createdAt: text('created_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    featureRequestId: integer('feature_request_id')
      .notNull()
      .references(() => featureRequests.id, { onDelete: 'cascade' }),
    id: integer('id').primaryKey({ autoIncrement: true }),
    inputContent: text('input_content').notNull(),
    inputTokens: integer('input_tokens'),
    modelId: text('model_id').notNull(),
    outputContent: text('output_content'),
    outputTokens: integer('output_tokens'),
    startedAt: text('started_at'),
    status: text('status').$type<FeatureRequestRunStatus>().notNull().default('pending'),
    step: text('step').$type<FeatureRequestRunStep>().notNull(),
    updatedAt: text('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    index('feature_request_runs_feature_request_id_idx').on(table.featureRequestId),
    index('feature_request_runs_status_idx').on(table.status),
    index('feature_request_runs_step_idx').on(table.step),
  ]
);

export type FeatureRequestRun = typeof featureRequestRuns.$inferSelect;
export type NewFeatureRequestRun = typeof featureRequestRuns.$inferInsert;
