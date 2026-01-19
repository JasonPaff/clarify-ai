import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { apiKeyKeys } from './api-keys';
import { featureRequestKeys } from './feature-requests';
import { projectKeys } from './projects';
import { repositoryKeys } from './repositories';
import { repositoryOverviewKeys } from './repository-overviews';

export const queries = mergeQueryKeys(
  apiKeyKeys,
  featureRequestKeys,
  projectKeys,
  repositoryKeys,
  repositoryOverviewKeys
);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
