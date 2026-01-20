import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { FeatureRequestRunStep } from '@/db/schema/feature-request-runs.schema';

export const featureRequestRunKeys = createQueryKeys('featureRequestRuns', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
  byFeatureRequestAndStep: (featureRequestId: number, step: FeatureRequestRunStep) => [
    featureRequestId,
    step,
  ],
  currentRun: (featureRequestId: number, step: FeatureRequestRunStep) => [featureRequestId, step],
  detail: (id: number) => [id],
  latest: (featureRequestId: number) => [featureRequestId],
  latestByStep: (featureRequestId: number, step: FeatureRequestRunStep) => [featureRequestId, step],
});
