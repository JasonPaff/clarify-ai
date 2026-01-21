import { createQueryKeys } from '@lukemorales/query-key-factory';

export const discoveryKeys = createQueryKeys('discovery', {
  byFeatureRequestId: (featureRequestId: number) => [featureRequestId],
});
