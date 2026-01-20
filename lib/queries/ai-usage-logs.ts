import { createQueryKeys } from '@lukemorales/query-key-factory';

export const aiUsageLogKeys = createQueryKeys('aiUsageLogs', {
  byProject: (projectId: number) => [projectId],
  totalsByProject: (projectId: number) => [projectId],
});
