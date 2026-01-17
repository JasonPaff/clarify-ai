import { inferQueryKeyStore, mergeQueryKeys } from '@lukemorales/query-key-factory';

import { projectKeys } from './projects';
import { repositoryKeys } from './repositories';

export const queries = mergeQueryKeys(projectKeys, repositoryKeys);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
