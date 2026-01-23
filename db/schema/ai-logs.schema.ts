import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { featureRequests } from './feature-requests.schema';
import { projects } from './projects.schema';

/**
 * AI log status values:
 * - 'pending': Request not yet started
 * - 'streaming': Currently streaming response
 * - 'completed': Request finished successfully
 * - 'failed': Request encountered an error
 * - 'cancelled': Request was cancelled
 */
export type AiLogStatus = 'cancelled' | 'completed' | 'failed' | 'pending' | 'streaming';

/**
 * Workflow step values for AI operations:
 * - 'describe': The feature description step
 * - 'clarify': The clarification/refinement step
 * - 'discover': The file discovery/research step
 * - 'plan': The implementation planning step
 * - 'other': Any other AI operation outside the main workflow
 */
export type AiLogWorkflowStep = 'clarify' | 'describe' | 'discover' | 'other' | 'plan';

export const aiLogs = sqliteTable(
  'ai_logs',
  {
    completedAt: text('completed_at'),
    createdAt: text('created_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .notNull(),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    featureRequestId: integer('feature_request_id').references(() => featureRequests.id, {
      onDelete: 'set null',
    }),
    id: integer('id').primaryKey({ autoIncrement: true }),
    inputTokens: integer('input_tokens'),
    modelId: text('model_id').notNull(),
    outputTokens: integer('output_tokens'),
    projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
    reasoningTokens: integer('reasoning_tokens'),
    requestBody: text('request_body'),
    requestId: text('request_id').notNull().unique(),
    responseBody: text('response_body'),
    startedAt: text('started_at'),
    status: text('status').$type<AiLogStatus>().notNull().default('pending'),
    streamChunks: text('stream_chunks'),
    toolCalls: text('tool_calls'),
    updatedAt: text('updated_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
      .notNull(),
    workflowStep: text('workflow_step').$type<AiLogWorkflowStep>(),
  },
  (table) => [
    index('ai_logs_created_at_idx').on(table.createdAt),
    index('ai_logs_feature_request_id_idx').on(table.featureRequestId),
    index('ai_logs_model_id_idx').on(table.modelId),
    index('ai_logs_project_id_idx').on(table.projectId),
    index('ai_logs_request_id_idx').on(table.requestId),
    index('ai_logs_status_idx').on(table.status),
    index('ai_logs_workflow_step_idx').on(table.workflowStep),
  ]
);

export type AiLog = typeof aiLogs.$inferSelect;
export type NewAiLog = typeof aiLogs.$inferInsert;
