import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { featureRequestKeys } from './feature-requests';
import { projectKeys } from './projects';
import { repositoryKeys } from './repositories';

export const queries = mergeQueryKeys(featureRequestKeys, projectKeys, repositoryKeys);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
