import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { apiKeyKeys } from './api-keys';
import { discoveryKeys } from './discovery';
import { featureRequestContextFileKeys } from './feature-request-context-files';
import { featureRequestRepositoryKeys } from './feature-request-repositories';
import { featureRequestRunKeys } from './feature-request-runs';
import { featureRequestKeys } from './feature-requests';
import { fileSearchKeys } from './file-search';
import { openRouterModelsKeys } from './openrouter-models';
import { projectKeys } from './projects';
import { repositoryKeys } from './repositories';
import { repositoryOverviewKeys } from './repository-overviews';
import { stepConfigurationKeys } from './step-configurations';

export const queries = mergeQueryKeys(
  apiKeyKeys,
  discoveryKeys,
  featureRequestContextFileKeys,
  featureRequestKeys,
  featureRequestRepositoryKeys,
  featureRequestRunKeys,
  fileSearchKeys,
  openRouterModelsKeys,
  projectKeys,
  repositoryKeys,
  repositoryOverviewKeys,
  stepConfigurationKeys
);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
