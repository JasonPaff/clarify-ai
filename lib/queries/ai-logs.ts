import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { AiLogFilterParams } from '@/db/repositories/ai-logs.repository';
import type { AiLogWorkflowStep } from '@/db/schema/ai-logs.schema';

export const aiLogKeys = createQueryKeys('aiLogs', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
  byProject: (projectId: number) => [projectId],
  byRequestId: (requestId: string) => [requestId],
  byWorkflowStep: (workflowStep: AiLogWorkflowStep) => [workflowStep],
  config: null,
  count: (filters?: AiLogFilterParams) => [{ filters }],
  detail: (id: number) => [id],
  latest: (limit?: number) => [{ limit }],
  list: (filters?: AiLogFilterParams) => [{ filters }],
  stats: (filters?: AiLogFilterParams) => [{ filters }],
});
