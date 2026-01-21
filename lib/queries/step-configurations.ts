import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { StepConfigurationStep } from '@/db/schema/step-configurations.schema';

export const stepConfigurationKeys = createQueryKeys('stepConfigurations', {
  byProject: (projectId: number) => [projectId],
  byProjectAndStep: (projectId: number, step: StepConfigurationStep) => [projectId, step],
  detail: (id: number) => [id],
});
