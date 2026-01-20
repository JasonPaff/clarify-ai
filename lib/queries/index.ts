import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { aiUsageLogKeys } from './ai-usage-logs';
import { apiKeyKeys } from './api-keys';
import { featureRequestRepositoryKeys } from './feature-request-repositories';
import { featureRequestKeys } from './feature-requests';
import { openRouterModelsKeys } from './openrouter-models';
import { projectKeys } from './projects';
import { repositoryKeys } from './repositories';
import { repositoryOverviewKeys } from './repository-overviews';

export const queries = mergeQueryKeys(
  aiUsageLogKeys,
  apiKeyKeys,
  featureRequestKeys,
  featureRequestRepositoryKeys,
  openRouterModelsKeys,
  projectKeys,
  repositoryKeys,
  repositoryOverviewKeys
);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
