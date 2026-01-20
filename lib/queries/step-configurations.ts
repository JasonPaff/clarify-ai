import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

export const stepConfigurationKeys = createQueryKeys('stepConfigurations', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
  byFeatureRequestAndStep: (featureRequestId: number, step: StepConfigurationStep) => [featureRequestId, step],
  detail: (id: number) => [id],
});
