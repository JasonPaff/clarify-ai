import { and, eq } from 'drizzle-orm';

import type { DrizzleDatabase } from '@/db';

import { featureRequestRepositories } from '../schema/feature-request-repositories.schema';

export interface FeatureRequestRepositoriesRepository {
  addToFeatureRequest(featureRequestId: number, repositoryId: number): boolean;
  getByFeatureRequestId(featureRequestId: number): Array<number>;
  removeFromFeatureRequest(featureRequestId: number, repositoryId: number): boolean;
  setForFeatureRequest(featureRequestId: number, repositoryIds: Array<number>): void;
}

export function createFeatureRequestRepositoriesRepository(db: DrizzleDatabase): FeatureRequestRepositoriesRepository {
  return {
    addToFeatureRequest(featureRequestId: number, repositoryId: number): boolean {
      try {
        db.insert(featureRequestRepositories).values({ featureRequestId, repositoryId }).onConflictDoNothing().run();
        return true;
      } catch {
        return false;
      }
    },

    getByFeatureRequestId(featureRequestId: number): Array<number> {
      const results = db
        .select({ repositoryId: featureRequestRepositories.repositoryId })
        .from(featureRequestRepositories)
        .where(eq(featureRequestRepositories.featureRequestId, featureRequestId))
        .all();
      return results.map((row) => row.repositoryId);
    },

    removeFromFeatureRequest(featureRequestId: number, repositoryId: number): boolean {
      const result = db
        .delete(featureRequestRepositories)
        .where(
          and(
            eq(featureRequestRepositories.featureRequestId, featureRequestId),
            eq(featureRequestRepositories.repositoryId, repositoryId)
          )
        )
        .run();
      return result.changes > 0;
    },

    setForFeatureRequest(featureRequestId: number, repositoryIds: Array<number>): void {
      // Delete existing associations
      db.delete(featureRequestRepositories)
        .where(eq(featureRequestRepositories.featureRequestId, featureRequestId))
        .run();

      // Insert new associations if any
      if (repositoryIds.length > 0) {
        const values = repositoryIds.map((repositoryId) => ({
          featureRequestId,
          repositoryId,
        }));
        db.insert(featureRequestRepositories).values(values).run();
      }
    },
  };
}
