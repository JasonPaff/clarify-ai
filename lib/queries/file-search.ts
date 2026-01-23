import { createQueryKeys } from '@lukemorales/query-key-factory';

export const fileSearchKeys = createQueryKeys('fileSearch', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
  byQuery: (featureRequestId: number, queryHash: string) => [featureRequestId, queryHash],
});
