# Step 2: File Discovery

**Started**: 2026-01-20T00:03:00.000Z
**Completed**: 2026-01-20T00:04:00.000Z
**Duration**: ~60s
**Status**: Completed

## Refined Request Used

Implement Phase 3 of the feature request workflow by creating React hooks for accessing the new data layer established in Phases 1 and 2, following the existing TanStack Query v5 patterns established in `hooks/queries/use-feature-requests.ts` and query key conventions in `lib/queries/`.

## Analysis Summary

- Explored 4 major directories (hooks/queries, lib/queries, db/schema, electron/ipc)
- Examined 28 candidate files
- Found 11 highly relevant files
- Identified 8 supporting files
- Identified 6 files that need to be CREATED
- Identified 3 files that need to be MODIFIED

## Discovered Files

### Critical Priority - FILES TO CREATE

| File Path                                            | Relevance                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `hooks/queries/use-feature-request-runs.ts`          | New hook file for `useRunHistory`, `useCurrentRun`, `useCreateRun`, `useSetCurrentRun` |
| `hooks/queries/use-step-configurations.ts`           | New hook file for `useStepConfig`, `useUpdateStepConfig`                               |
| `hooks/queries/use-feature-request-context-files.ts` | New hook file for `useContextFiles`, `useAddContextFile`, `useRemoveContextFile`       |
| `lib/queries/feature-request-runs.ts`                | New query key definitions for feature request runs                                     |
| `lib/queries/step-configurations.ts`                 | New query key definitions for step configurations                                      |
| `lib/queries/feature-request-context-files.ts`       | New query key definitions for context files                                            |

### High Priority - FILES TO MODIFY

| File Path                               | Needed Changes                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `hooks/queries/use-feature-requests.ts` | Add `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` mutations                                |
| `lib/queries/index.ts`                  | Import and merge new query key factories                                                                 |
| `hooks/useElectron.ts`                  | Add `featureRequestRuns`, `stepConfigurations`, `featureRequestContextFiles` to `useElectronDb()` return |

### High Priority - REFERENCE FILES (Patterns to Follow)

| File Path                                           | Pattern Provided                                                |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `hooks/queries/use-repositories.ts`                 | Query/mutation hook patterns with cache invalidation            |
| `hooks/queries/use-repository-overviews.ts`         | `useQueries` for parallel fetching and upsert mutation patterns |
| `hooks/queries/use-feature-request-repositories.ts` | Mutation patterns with featureRequestId-based invalidation      |
| `lib/queries/repositories.ts`                       | Query key factory pattern with `createQueryKeys`                |
| `lib/queries/feature-requests.ts`                   | Query key factory pattern with `byProject` and `detail` keys    |
| `lib/queries/feature-request-repositories.ts`       | Query key factory with `byFeatureRequest` pattern               |

### Medium Priority - API Understanding

| File Path                                                | Information Provided                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `electron/ipc/feature-request-runs.handlers.ts`          | Available IPC methods: `getById`, `getByFeatureRequestId`, `getCurrentRun`, `setCurrentRun`, `create`, `update`, `delete` |
| `electron/ipc/step-configurations.handlers.ts`           | Available IPC methods: `getByFeatureRequestIdAndStep`, `upsert`, `create`, `update`, `delete`                             |
| `electron/ipc/feature-request-context-files.handlers.ts` | Available IPC methods: `getByFeatureRequestId`, `create`, `bulkCreate`, `delete`, `setIncludedInContext`                  |
| `electron/preload.ts`                                    | Electron API interface exposed to renderer (already complete)                                                             |
| `types/electron.ts`                                      | Type definitions for ElectronAPI (already complete)                                                                       |
| `electron/ipc/channels.ts`                               | IPC channel constants (already includes all new channels)                                                                 |

### Medium Priority - Schema/Type Information

| File Path                                           | Types Provided                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `db/schema/feature-request-runs.schema.ts`          | `FeatureRequestRun`, `NewFeatureRequestRun`, `FeatureRequestRunStep`, `FeatureRequestRunStatus` |
| `db/schema/step-configurations.schema.ts`           | `StepConfiguration`, `NewStepConfiguration`, `StepConfigurationStep`                            |
| `db/schema/feature-request-context-files.schema.ts` | `FeatureRequestContextFile`, `NewFeatureRequestContextFile`, `ContextFileType`                  |
| `db/schema/feature-requests.schema.ts`              | Has `archivedAt` field for archive mutations                                                    |

### Low Priority - Repository Pattern Reference

| File Path                                                     | Information                                       |
| ------------------------------------------------------------- | ------------------------------------------------- |
| `db/repositories/feature-request-runs.repository.ts`          | Repository implementation                         |
| `db/repositories/step-configurations.repository.ts`           | Repository implementation with upsert pattern     |
| `db/repositories/feature-request-context-files.repository.ts` | Repository implementation with bulkCreate pattern |

## Key Patterns Discovered

### 1. Query Key Factory Pattern

Uses `@lukemorales/query-key-factory` with `createQueryKeys` function:

- Keys exported from individual files in `lib/queries/`
- All keys merged in `lib/queries/index.ts` using `mergeQueryKeys`
- Common patterns: `detail(id)`, `byProject(projectId)`, `byFeatureRequest(featureRequestId)`

### 2. Hook File Structure

```typescript
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { xxxKeys } from '@/lib/queries/xxx';
import { useElectronDb } from '../useElectron';
```

### 3. Cache Invalidation Patterns

- `queryClient.invalidateQueries({ queryKey: keys._def })` - broad invalidation
- `queryClient.setQueryData(keys.detail(id).queryKey, data)` - optimistic updates
- `queryClient.removeQueries()` - for deletes to prevent refetch errors

### 4. useElectronDb Pattern

Returns object with domain-specific methods (e.g., `featureRequests`, `repositories`)

### 5. Query Hook Pattern

```typescript
export function useXxx(id: number) {
  const { xxx, isElectron } = useElectronDb();
  return useQuery({
    ...xxxKeys.detail(id),
    enabled: isElectron && id > 0,
    queryFn: () => xxx.getById(id),
  });
}
```

### 6. Mutation Hook Pattern

```typescript
export function useCreateXxx() {
  const queryClient = useQueryClient();
  const { xxx } = useElectronDb();
  return useMutation({
    mutationFn: (data) => xxx.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: xxxKeys._def });
    },
  });
}
```

## Discovery Statistics

| Category             | Count |
| -------------------- | ----- |
| Files to Create      | 6     |
| Files to Modify      | 3     |
| Reference Files      | 19    |
| Total Relevant Files | 28    |

## Validation Results

- **Minimum Files**: PASS - Discovered 28 relevant files (requirement: >= 3)
- **Categorization**: PASS - All files categorized by priority
- **File Existence**: PASS - All referenced files validated to exist
- **Pattern Recognition**: PASS - Identified existing patterns for hooks and query keys
