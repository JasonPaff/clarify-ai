import { createQueryKeys } from '@lukemorales/query-key-factory';

import type { ContextFileType } from '@/db/schema/feature-request-context-files.schema';

export const featureRequestContextFileKeys = createQueryKeys('featureRequestContextFiles', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
  byFeatureRequestAndType: (featureRequestId: number, fileType: ContextFileType) => [
    featureRequestId,
    fileType,
  ],
  detail: (id: number) => [id],
});
