import { createQueryKeys } from '@lukemorales/query-key-factory';

export const repositoryOverviewKeys = createQueryKeys('repositoryOverviews', {
  byRepositoryId: (repositoryId: number) => [repositoryId],
  byRepositoryIds: (repositoryIds: Array<number>) => [{ repositoryIds }],
});
