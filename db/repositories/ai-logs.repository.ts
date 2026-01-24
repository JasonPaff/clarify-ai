import { and, count, desc, eq, gte, inArray, like, lt, or, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { AiLog, AiLogStatus, AiLogWorkflowStep, NewAiLog } from '../schema/ai-logs.schema';

import { aiLogs } from '../schema/ai-logs.schema';

/**
 * Filter parameters for querying AI log entries.
 */
export interface AiLogFilterParams {
  /** Custom end date for time range filtering (ISO 8601 format) */
  endDate?: string;
  /** Filter by feature request ID */
  featureRequestId?: number;
  /** Maximum number of entries to return */
  limit?: number;
  /** Filter by model ID */
  modelId?: string;
  /** Number of entries to skip for pagination */
  offset?: number;
  /** Filter by project ID */
  projectId?: number;
  /** Filter by request ID */
  requestId?: string;
  /** Full-text search query across request/response content */
  searchQuery?: string;
  /** Custom start date for time range filtering (ISO 8601 format) */
  startDate?: string;
  /** Filter by operation status (single value or array for multi-select) */
  status?: AiLogStatus | Array<AiLogStatus>;
  /** Predefined time range filter */
  timeRange?: AiLogTimeRange;
  /** Filter by workflow step (single value or array for multi-select) */
  workflowStep?: AiLogWorkflowStep | Array<AiLogWorkflowStep>;
}

/**
 * Query result for AI log list operations.
 */
export interface AiLogQueryResult {
  /** Array of log entries matching the query */
  entries: Array<AiLog>;
  /** Total number of entries matching the filters (for pagination) */
  totalCount: number;
}

export interface AiLogsRepository {
  create(data: NewAiLog): AiLog;
  delete(id: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<AiLog>;
  getById(id: number): AiLog | undefined;
  getByModelId(modelId: string): Array<AiLog>;
  getByProjectId(projectId: number): Array<AiLog>;
  getByRequestId(requestId: string): AiLog | undefined;
  getByTimeRange(startDate: string, endDate: string): Array<AiLog>;
  getByWorkflowStep(workflowStep: AiLogWorkflowStep): Array<AiLog>;
  getCount(filters?: AiLogFilterParams): number;
  getLatest(limit?: number): Array<AiLog>;
  getStats(filters?: AiLogFilterParams): AiLogStats;
  purgeOlderThan(date: string): number;
  query(params: AiLogFilterParams): AiLogQueryResult;
  update(id: number, data: Partial<NewAiLog>): AiLog | undefined;
}

/**
 * Statistics for AI log entries.
 */
export interface AiLogStats {
  /** Average duration of completed operations in milliseconds */
  averageDurationMs: number;
  /** Total number of completed operations */
  completedCount: number;
  /** Total number of failed operations */
  failedCount: number;
  /** Total number of log entries */
  totalCount: number;
  /** Total input tokens across all operations */
  totalInputTokens: number;
  /** Total output tokens across all operations */
  totalOutputTokens: number;
}

/**
 * Time range filter options for querying logs.
 */
export type AiLogTimeRange = 'all' | 'custom' | 'last-7d' | 'last-24h' | 'last-hour';

export function createAiLogsRepository(db: DrizzleDatabase): AiLogsRepository {
  /**
   * Build dynamic WHERE conditions based on filter parameters
   */
  function buildWhereConditions(params: AiLogFilterParams) {
    const conditions = [];

    if (params.requestId) {
      conditions.push(eq(aiLogs.requestId, params.requestId));
    }

    if (params.workflowStep) {
      if (Array.isArray(params.workflowStep)) {
        if (params.workflowStep.length > 0) {
          conditions.push(inArray(aiLogs.workflowStep, params.workflowStep));
        }
      } else {
        conditions.push(eq(aiLogs.workflowStep, params.workflowStep));
      }
    }

    if (params.modelId) {
      conditions.push(eq(aiLogs.modelId, params.modelId));
    }

    if (params.status) {
      if (Array.isArray(params.status)) {
        if (params.status.length > 0) {
          conditions.push(inArray(aiLogs.status, params.status));
        }
      } else {
        conditions.push(eq(aiLogs.status, params.status));
      }
    }

    if (params.featureRequestId !== undefined) {
      conditions.push(eq(aiLogs.featureRequestId, params.featureRequestId));
    }

    if (params.projectId !== undefined) {
      conditions.push(eq(aiLogs.projectId, params.projectId));
    }

    // Handle time range filtering
    const { endDate, startDate } = resolveTimeRange(params);
    if (startDate) {
      conditions.push(gte(aiLogs.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lt(aiLogs.createdAt, endDate));
    }

    // Handle search query (search in requestBody and responseBody)
    if (params.searchQuery) {
      const searchPattern = `%${params.searchQuery}%`;
      conditions.push(
        or(like(aiLogs.requestBody, searchPattern), like(aiLogs.responseBody, searchPattern))
      );
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  /**
   * Resolve time range filter to actual start/end dates
   */
  function resolveTimeRange(params: AiLogFilterParams): { endDate?: string; startDate?: string } {
    // If custom dates are provided, use them directly
    if (params.startDate || params.endDate) {
      return { endDate: params.endDate, startDate: params.startDate };
    }

    // Handle predefined time ranges
    if (params.timeRange && params.timeRange !== 'all' && params.timeRange !== 'custom') {
      const now = new Date();
      let startDate: Date;

      switch (params.timeRange) {
        case 'last-7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last-24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last-hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        default:
          return {};
      }

      return { startDate: startDate.toISOString() };
    }

    return {};
  }

  return {
    create(data: NewAiLog): AiLog {
      return db.insert(aiLogs).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(aiLogs).where(eq(aiLogs.id, id)).run();
      return result.changes > 0;
    },

    getByFeatureRequestId(featureRequestId: number): Array<AiLog> {
      return db
        .select()
        .from(aiLogs)
        .where(eq(aiLogs.featureRequestId, featureRequestId))
        .orderBy(desc(aiLogs.createdAt))
        .all();
    },

    getById(id: number): AiLog | undefined {
      return db.select().from(aiLogs).where(eq(aiLogs.id, id)).get();
    },

    getByModelId(modelId: string): Array<AiLog> {
      return db
        .select()
        .from(aiLogs)
        .where(eq(aiLogs.modelId, modelId))
        .orderBy(desc(aiLogs.createdAt))
        .all();
    },

    getByProjectId(projectId: number): Array<AiLog> {
      return db
        .select()
        .from(aiLogs)
        .where(eq(aiLogs.projectId, projectId))
        .orderBy(desc(aiLogs.createdAt))
        .all();
    },

    getByRequestId(requestId: string): AiLog | undefined {
      return db.select().from(aiLogs).where(eq(aiLogs.requestId, requestId)).get();
    },

    getByTimeRange(startDate: string, endDate: string): Array<AiLog> {
      return db
        .select()
        .from(aiLogs)
        .where(and(gte(aiLogs.createdAt, startDate), lt(aiLogs.createdAt, endDate)))
        .orderBy(desc(aiLogs.createdAt))
        .all();
    },

    getByWorkflowStep(workflowStep: AiLogWorkflowStep): Array<AiLog> {
      return db
        .select()
        .from(aiLogs)
        .where(eq(aiLogs.workflowStep, workflowStep))
        .orderBy(desc(aiLogs.createdAt))
        .all();
    },

    getCount(filters?: AiLogFilterParams): number {
      const whereConditions = filters ? buildWhereConditions(filters) : undefined;

      const result = db
        .select({ count: count() })
        .from(aiLogs)
        .where(whereConditions)
        .get();

      return result?.count ?? 0;
    },

    getLatest(limit = 10): Array<AiLog> {
      return db.select().from(aiLogs).orderBy(desc(aiLogs.createdAt)).limit(limit).all();
    },

    getStats(filters?: AiLogFilterParams): AiLogStats {
      const whereConditions = filters ? buildWhereConditions(filters) : undefined;

      // Get total count
      const totalResult = db
        .select({ count: count() })
        .from(aiLogs)
        .where(whereConditions)
        .get();
      const totalCount = totalResult?.count ?? 0;

      // Get completed count
      const completedConditions = whereConditions
        ? and(whereConditions, eq(aiLogs.status, 'completed' as AiLogStatus))
        : eq(aiLogs.status, 'completed' as AiLogStatus);
      const completedResult = db
        .select({ count: count() })
        .from(aiLogs)
        .where(completedConditions)
        .get();
      const completedCount = completedResult?.count ?? 0;

      // Get failed count
      const failedConditions = whereConditions
        ? and(whereConditions, eq(aiLogs.status, 'failed' as AiLogStatus))
        : eq(aiLogs.status, 'failed' as AiLogStatus);
      const failedResult = db
        .select({ count: count() })
        .from(aiLogs)
        .where(failedConditions)
        .get();
      const failedCount = failedResult?.count ?? 0;

      // Get token totals and average duration using raw SQL for aggregation
      const aggregateResult = db
        .select({
          avgDuration: sql<number>`COALESCE(AVG(${aiLogs.durationMs}), 0)`.as('avgDuration'),
          totalInput: sql<number>`COALESCE(SUM(${aiLogs.inputTokens}), 0)`.as('totalInput'),
          totalOutput: sql<number>`COALESCE(SUM(${aiLogs.outputTokens}), 0)`.as('totalOutput'),
        })
        .from(aiLogs)
        .where(whereConditions)
        .get();

      return {
        averageDurationMs: aggregateResult?.avgDuration ?? 0,
        completedCount,
        failedCount,
        totalCount,
        totalInputTokens: aggregateResult?.totalInput ?? 0,
        totalOutputTokens: aggregateResult?.totalOutput ?? 0,
      };
    },

    purgeOlderThan(date: string): number {
      const result = db.delete(aiLogs).where(lt(aiLogs.createdAt, date)).run();
      return result.changes;
    },

    query(params: AiLogFilterParams): AiLogQueryResult {
      const whereConditions = buildWhereConditions(params);
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;

      // Get total count for pagination
      const countResult = db
        .select({ count: count() })
        .from(aiLogs)
        .where(whereConditions)
        .get();
      const totalCount = countResult?.count ?? 0;

      // Get paginated results
      const entries = db
        .select()
        .from(aiLogs)
        .where(whereConditions)
        .orderBy(desc(aiLogs.createdAt))
        .limit(limit)
        .offset(offset)
        .all();

      return {
        entries,
        totalCount,
      };
    },

    update(id: number, data: Partial<NewAiLog>): AiLog | undefined {
      return db
        .update(aiLogs)
        .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
        .where(eq(aiLogs.id, id))
        .returning()
        .get();
    },
  };
}
