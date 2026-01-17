import { eq, sql } from 'drizzle-orm';

import type { DrizzleDatabase } from '../index';
import type { NewRepository, Repository } from '../schema';

import { repositories } from '../schema';

export interface RepositoriesRepository {
  create(data: NewRepository): Repository;
  delete(id: number): boolean;
  getById(id: number): Repository | undefined;
  getByProjectId(projectId: number): Array<Repository>;
  update(id: number, data: Partial<NewRepository>): Repository | undefined;
}

export function createRepositoriesRepository(db: DrizzleDatabase): RepositoriesRepository {
  return {
    create(data: NewRepository): Repository {
      return db.insert(repositories).values(data).returning().get();
    },

    delete(id: number): boolean {
      const result = db.delete(repositories).where(eq(repositories.id, id)).run();
      return result.changes > 0;
    },

    getById(id: number): Repository | undefined {
      return db.select().from(repositories).where(eq(repositories.id, id)).get();
    },

    getByProjectId(projectId: number): Array<Repository> {
      return db.select().from(repositories).where(eq(repositories.projectId, projectId)).all();
    },

    update(id: number, data: Partial<NewRepository>): Repository | undefined {
      return db
        .update(repositories)
        .set({ ...data, updatedAt: sql`(CURRENT_TIMESTAMP)` })
        .where(eq(repositories.id, id))
        .returning()
        .get();
    },
  };
}
