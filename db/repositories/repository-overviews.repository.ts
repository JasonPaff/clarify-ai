import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewRepositoryOverview, RepositoryOverview } from '../schema/repository-overviews.schema';

import { repositoryOverviews } from '../schema/repository-overviews.schema';

export interface RepositoryOverviewsRepository {
  create(data: NewRepositoryOverview): RepositoryOverview;
  delete(id: number): boolean;
  deleteByRepositoryId(repositoryId: number): boolean;
  getByRepositoryId(repositoryId: number): RepositoryOverview | undefined;
  update(id: number, data: Partial<NewRepositoryOverview>): RepositoryOverview | undefined;
  upsert(repositoryId: number, data: Omit<NewRepositoryOverview, 'repositoryId'>): RepositoryOverview;
}

export function createRepositoryOverviewsRepository(db: DrizzleDatabase): RepositoryOverviewsRepository {
  return {
    create(data: NewRepositoryOverview): RepositoryOverview {
      return db.insert(repositoryOverviews).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(repositoryOverviews).where(eq(repositoryOverviews.id, id)).run();
      return result.changes > 0;
    },

    deleteByRepositoryId(repositoryId: number): boolean {
      const result = db.delete(repositoryOverviews).where(eq(repositoryOverviews.repositoryId, repositoryId)).run();
      return result.changes > 0;
    },

    getByRepositoryId(repositoryId: number): RepositoryOverview | undefined {
      return db.select().from(repositoryOverviews).where(eq(repositoryOverviews.repositoryId, repositoryId)).get();
    },

    update(id: number, data: Partial<NewRepositoryOverview>): RepositoryOverview | undefined {
      return db
        .update(repositoryOverviews)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(repositoryOverviews.id, id))
        .returning()
        .get();
    },

    upsert(repositoryId: number, data: Omit<NewRepositoryOverview, 'repositoryId'>): RepositoryOverview {
      const existing = db
        .select()
        .from(repositoryOverviews)
        .where(eq(repositoryOverviews.repositoryId, repositoryId))
        .get();

      if (existing) {
        return db
          .update(repositoryOverviews)
          .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
          .where(eq(repositoryOverviews.id, existing.id))
          .returning()
          .get();
      }

      return db
        .insert(repositoryOverviews)
        .values({ ...data, repositoryId })
        .returning()
        .get();
    },
  };
}
