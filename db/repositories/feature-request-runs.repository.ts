import { and, desc, eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import type {
  FeatureRequestRun,
  FeatureRequestRunStatus,
  FeatureRequestRunStep,
  NewFeatureRequestRun,
} from '../schema/feature-request-runs.schema';

import { featureRequestRuns } from '../schema/feature-request-runs.schema';

export interface FeatureRequestRunsRepository {
  create(data: NewFeatureRequestRun): FeatureRequestRun;
  delete(id: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestRun>;
  getByFeatureRequestIdAndStatus(featureRequestId: number, status: FeatureRequestRunStatus): Array<FeatureRequestRun>;
  getByFeatureRequestIdAndStep(featureRequestId: number, step: FeatureRequestRunStep): Array<FeatureRequestRun>;
  getById(id: number): FeatureRequestRun | undefined;
  getCurrentRun(featureRequestId: number, step: FeatureRequestRunStep): FeatureRequestRun | undefined;
  getLatestByFeatureRequestId(featureRequestId: number): FeatureRequestRun | undefined;
  getLatestByFeatureRequestIdAndStep(
    featureRequestId: number,
    step: FeatureRequestRunStep
  ): FeatureRequestRun | undefined;
  setCurrentRun(featureRequestId: number, step: FeatureRequestRunStep, runId: number): FeatureRequestRun | undefined;
  update(id: number, data: Partial<NewFeatureRequestRun>): FeatureRequestRun | undefined;
}

export function createFeatureRequestRunsRepository(db: DrizzleDatabase): FeatureRequestRunsRepository {
  return {
    create(data: NewFeatureRequestRun): FeatureRequestRun {
      return db.insert(featureRequestRuns).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(featureRequestRuns).where(eq(featureRequestRuns.id, id)).run();
      return result.changes > 0;
    },

    getByFeatureRequestId(featureRequestId: number): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(eq(featureRequestRuns.featureRequestId, featureRequestId))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getByFeatureRequestIdAndStatus(
      featureRequestId: number,
      status: FeatureRequestRunStatus
    ): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.status, status)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getByFeatureRequestIdAndStep(featureRequestId: number, step: FeatureRequestRunStep): Array<FeatureRequestRun> {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.step, step)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .all();
    },

    getById(id: number): FeatureRequestRun | undefined {
      return db.select().from(featureRequestRuns).where(eq(featureRequestRuns.id, id)).get();
    },

    getCurrentRun(featureRequestId: number, step: FeatureRequestRunStep): FeatureRequestRun | undefined {
      return db
        .select()
        .from(featureRequestRuns)
        .where(
          and(
            eq(featureRequestRuns.featureRequestId, featureRequestId),
            eq(featureRequestRuns.step, step),
            eq(featureRequestRuns.isCurrentRun, true)
          )
        )
        .get();
    },

    getLatestByFeatureRequestId(featureRequestId: number): FeatureRequestRun | undefined {
      return db
        .select()
        .from(featureRequestRuns)
        .where(eq(featureRequestRuns.featureRequestId, featureRequestId))
        .orderBy(desc(featureRequestRuns.createdAt))
        .limit(1)
        .get();
    },

    getLatestByFeatureRequestIdAndStep(
      featureRequestId: number,
      step: FeatureRequestRunStep
    ): FeatureRequestRun | undefined {
      return db
        .select()
        .from(featureRequestRuns)
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.step, step)))
        .orderBy(desc(featureRequestRuns.createdAt))
        .limit(1)
        .get();
    },

    setCurrentRun(featureRequestId: number, step: FeatureRequestRunStep, runId: number): FeatureRequestRun | undefined {
      // First, set isCurrentRun=false for ALL runs matching featureRequestId and step
      db.update(featureRequestRuns)
        .set({ isCurrentRun: false, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
        .where(and(eq(featureRequestRuns.featureRequestId, featureRequestId), eq(featureRequestRuns.step, step)))
        .run();

      // Then, set isCurrentRun=true for the specific runId
      return db
        .update(featureRequestRuns)
        .set({ isCurrentRun: true, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
        .where(eq(featureRequestRuns.id, runId))
        .returning()
        .get();
    },

    update(id: number, data: Partial<NewFeatureRequestRun>): FeatureRequestRun | undefined {
      return db
        .update(featureRequestRuns)
        .set({ ...data, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))` })
        .where(eq(featureRequestRuns.id, id))
        .returning()
        .get();
    },
  };
}
