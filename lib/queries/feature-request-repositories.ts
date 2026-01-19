import { createQueryKeys } from '@lukemorales/query-key-factory';

export const featureRequestRepositoryKeys = createQueryKeys('featureRequestRepositories', {
  byFeatureRequest: (featureRequestId: number) => [featureRequestId],
});
