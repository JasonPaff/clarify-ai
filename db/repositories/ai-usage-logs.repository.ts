import { desc, eq, sql, sum } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import type { AiUsageLog, NewAiUsageLog } from '../schema/ai-usage-logs.schema';

import { aiUsageLogs } from '../schema/ai-usage-logs.schema';

export interface AiUsageLogsRepository {
  create(data: NewAiUsageLog): AiUsageLog;
  deleteByProjectId(projectId: number): void;
  getByProjectId(projectId: number): Array<AiUsageLog>;
  getByProjectIdPaginated(projectId: number, limit: number, offset: number): Array<AiUsageLog>;
  getRecentByProjectId(projectId: number, limit: number): Array<AiUsageLog>;
  getTotalsByProjectId(projectId: number): AiUsageLogTotals | null;
}

export interface AiUsageLogTotals {
  operationCount: number;
  totalCostUsd: number;
  totalTokens: number;
}

export function createAiUsageLogsRepository(db: DrizzleDatabase): AiUsageLogsRepository {
  return {
    create(data: NewAiUsageLog): AiUsageLog {
      return db.insert(aiUsageLogs).values(data).returning().get();
    },

    deleteByProjectId(projectId: number): void {
      db.delete(aiUsageLogs).where(eq(aiUsageLogs.projectId, projectId)).run();
    },

    getByProjectId(projectId: number): Array<AiUsageLog> {
      return db
        .select()
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.projectId, projectId))
        .orderBy(desc(aiUsageLogs.createdAt))
        .all();
    },

    getByProjectIdPaginated(projectId: number, limit: number, offset: number): Array<AiUsageLog> {
      return db
        .select()
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.projectId, projectId))
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(limit)
        .offset(offset)
        .all();
    },

    getRecentByProjectId(projectId: number, limit: number): Array<AiUsageLog> {
      return db
        .select()
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.projectId, projectId))
        .orderBy(desc(aiUsageLogs.createdAt))
        .limit(limit)
        .all();
    },

    getTotalsByProjectId(projectId: number): AiUsageLogTotals | null {
      const result = db
        .select({
          operationCount: sql<number>`count(*)`.as('operation_count'),
          totalCostUsd: sum(aiUsageLogs.estimatedCostUsd).as('total_cost_usd'),
          totalTokens: sum(aiUsageLogs.totalTokens).as('total_tokens'),
        })
        .from(aiUsageLogs)
        .where(eq(aiUsageLogs.projectId, projectId))
        .get();

      if (!result || result.operationCount === 0) {
        return null;
      }

      return {
        operationCount: result.operationCount,
        totalCostUsd: Number(result.totalCostUsd) || 0,
        totalTokens: Number(result.totalTokens) || 0,
      };
    },
  };
}
