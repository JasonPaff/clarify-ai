import { createQueryKeys } from '@lukemorales/query-key-factory';

export const repositoryKeys = createQueryKeys('repositories', {
  byProject: (projectId: number) => [projectId],
  detail: (id: number) => [id],
});
