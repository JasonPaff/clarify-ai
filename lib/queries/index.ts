import {
  inferQueryKeyStore,
  mergeQueryKeys,
} from "@lukemorales/query-key-factory";

import { projectKeys } from "./projects";

export const queries = mergeQueryKeys(projectKeys);
export type QueryKeys = inferQueryKeyStore<typeof queries>;
