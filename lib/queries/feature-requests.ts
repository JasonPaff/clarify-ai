import { createQueryKeys } from '@lukemorales/query-key-factory';

export const featureRequestKeys = createQueryKeys('featureRequests', {
  byProject: (projectId: number) => [projectId],
  detail: (id: number) => [id],
});
