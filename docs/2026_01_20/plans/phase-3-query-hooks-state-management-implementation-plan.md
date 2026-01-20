# Implementation Plan: Phase 3 - Query Hooks & State Management

**Generated**: 2026-01-20
**Original Request**: Plan Phase 3 of the feature-request-workflow-implementation-order.md

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

- Create query key definitions for feature request runs, step configurations, and context files using the established `createQueryKeys` pattern
- Implement TanStack Query hooks for each new data entity following the existing patterns in `use-feature-requests.ts` and `use-repository-overviews.ts`
- Extend `useElectronDb()` hook to expose IPC method wrappers for the three new database domains
- Add archive/unarchive mutations to the existing feature requests hooks
- Merge all new query keys into the central `lib/queries/index.ts` registry

## Prerequisites

- [x] Phase 1 database schemas complete (`feature-request-runs.schema.ts`, `step-configurations.schema.ts`, `feature-request-context-files.schema.ts`)
- [x] Phase 2 IPC handlers complete with all methods exposed in `ElectronAPI` interface
- [x] All Phase 2 IPC handlers registered and functional
- [x] `types/electron.ts` exports updated with new schema types

## Implementation Steps

### Step 1: Create Query Keys for Feature Request Runs

**What**: Create query key definitions for feature request runs using `createQueryKeys`
**Why**: Query keys are required before creating hooks; they enable cache management and invalidation
**Confidence**: High

**Files to Create:**
- `lib/queries/feature-request-runs.ts` - Query key factory for run-related queries

**Changes:**
- Define `featureRequestRunKeys` using `createQueryKeys` from `@lukemorales/query-key-factory`
- Add key for `byFeatureRequest(featureRequestId)` - list all runs for a feature request
- Add key for `byFeatureRequestAndStep(featureRequestId, step)` - list runs filtered by step
- Add key for `currentRun(featureRequestId, step)` - get the current run for a step
- Add key for `detail(id)` - get a single run by ID
- Add key for `latest(featureRequestId)` - get the most recent run
- Add key for `latestByStep(featureRequestId, step)` - get the most recent run for a step

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] File exports `featureRequestRunKeys` with all defined key factories
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 2: Create Query Keys for Step Configurations

**What**: Create query key definitions for step configurations using `createQueryKeys`
**Why**: Query keys enable organized cache management for step configuration queries
**Confidence**: High

**Files to Create:**
- `lib/queries/step-configurations.ts` - Query key factory for step configuration queries

**Changes:**
- Define `stepConfigurationKeys` using `createQueryKeys` from `@lukemorales/query-key-factory`
- Add key for `byFeatureRequest(featureRequestId)` - list all configurations for a feature request
- Add key for `byFeatureRequestAndStep(featureRequestId, step)` - get configuration for specific step
- Add key for `detail(id)` - get a single configuration by ID

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] File exports `stepConfigurationKeys` with all defined key factories
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 3: Create Query Keys for Feature Request Context Files

**What**: Create query key definitions for context files using `createQueryKeys`
**Why**: Query keys enable organized cache management for context file queries
**Confidence**: High

**Files to Create:**
- `lib/queries/feature-request-context-files.ts` - Query key factory for context file queries

**Changes:**
- Define `featureRequestContextFileKeys` using `createQueryKeys` from `@lukemorales/query-key-factory`
- Add key for `byFeatureRequest(featureRequestId)` - list all context files for a feature request
- Add key for `byFeatureRequestAndType(featureRequestId, fileType)` - list files filtered by type
- Add key for `detail(id)` - get a single context file by ID

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] File exports `featureRequestContextFileKeys` with all defined key factories
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 4: Update Query Keys Index

**What**: Merge new query key factories into the central registry
**Why**: Enables type-safe access to all query keys through the unified `queries` object
**Confidence**: High

**Files to Modify:**
- `lib/queries/index.ts` - Central query key registry

**Changes:**
- Import `featureRequestRunKeys` from `./feature-request-runs`
- Import `stepConfigurationKeys` from `./step-configurations`
- Import `featureRequestContextFileKeys` from `./feature-request-context-files`
- Add all three key factories to `mergeQueryKeys` call

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All new key factories are imported and merged
- [ ] `QueryKeys` type includes all new key definitions
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 5: Update useElectronDb Hook with New Domains

**What**: Extend `useElectronDb()` to expose IPC wrappers for runs, step configs, and context files
**Why**: Hooks need access to Electron IPC methods through the established abstraction pattern
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Electron API hooks

**Changes:**
- Add `featureRequestRuns` useMemo block with methods: `create`, `delete`, `getById`, `getByFeatureRequestId`, `getByFeatureRequestIdAndStatus`, `getByFeatureRequestIdAndStep`, `getCurrentRun`, `getLatestByFeatureRequestId`, `getLatestByFeatureRequestIdAndStep`, `setCurrentRun`, `update`
- Add `stepConfigurations` useMemo block with methods: `create`, `delete`, `getById`, `getByFeatureRequestId`, `getByFeatureRequestIdAndStep`, `update`, `upsert`
- Add `featureRequestContextFiles` useMemo block with methods: `create`, `bulkCreate`, `delete`, `getById`, `getByFeatureRequestId`, `getByFeatureRequestIdAndType`, `setIncludedInContext`, `update`
- Update return object to include all three new domain objects
- Follow existing pattern of throwing `Error('Electron API not available')` for mutations and returning empty arrays/undefined for queries

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `useElectronDb()` returns `featureRequestRuns`, `stepConfigurations`, and `featureRequestContextFiles`
- [ ] All methods match the signatures in `ElectronAPI.db.*` interface
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 6: Create Feature Request Runs Hooks

**What**: Create TanStack Query hooks for feature request run operations
**Why**: Provides React components with access to run data with caching and mutations
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-feature-request-runs.ts` - Query hooks for runs

**Changes:**
- Add `'use client'` directive
- Import `useMutation`, `useQuery`, `useQueryClient` from `@tanstack/react-query`
- Import `featureRequestRunKeys` from `@/lib/queries/feature-request-runs`
- Import `useElectronDb` from `../useElectron`
- Implement `useRunHistory(featureRequestId)` - query for all runs of a feature request
- Implement `useRunsByStep(featureRequestId, step)` - query for runs filtered by step
- Implement `useCurrentRun(featureRequestId, step)` - query for the current run of a step
- Implement `useRun(id)` - query for a single run by ID
- Implement `useLatestRun(featureRequestId)` - query for the most recent run
- Implement `useLatestRunByStep(featureRequestId, step)` - query for the most recent run by step
- Implement `useCreateRun()` - mutation to create a new run
- Implement `useUpdateRun()` - mutation to update a run
- Implement `useDeleteRun()` - mutation to delete a run
- Implement `useSetCurrentRun()` - mutation to set a run as current for its step
- All queries should use `enabled: isElectron && id > 0` pattern
- All mutations should invalidate relevant query keys on success

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All hooks exported and functional
- [ ] Queries use proper enabled conditions
- [ ] Mutations invalidate correct query keys
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 7: Create Step Configurations Hooks

**What**: Create TanStack Query hooks for step configuration operations
**Why**: Provides React components with access to step configuration data with caching
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-step-configurations.ts` - Query hooks for step configurations

**Changes:**
- Add `'use client'` directive
- Import `useMutation`, `useQuery`, `useQueryClient` from `@tanstack/react-query`
- Import `stepConfigurationKeys` from `@/lib/queries/step-configurations`
- Import `useElectronDb` from `../useElectron`
- Implement `useStepConfigurations(featureRequestId)` - query for all configurations
- Implement `useStepConfig(featureRequestId, step)` - query for a specific step's configuration
- Implement `useStepConfiguration(id)` - query for a single configuration by ID
- Implement `useCreateStepConfiguration()` - mutation to create a configuration
- Implement `useUpdateStepConfig()` - mutation to update a configuration
- Implement `useDeleteStepConfiguration()` - mutation to delete a configuration
- Implement `useUpsertStepConfig()` - mutation to upsert a configuration
- All queries should use `enabled: isElectron && featureRequestId > 0` pattern
- All mutations should invalidate relevant query keys on success

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All hooks exported and functional
- [ ] Queries use proper enabled conditions
- [ ] Mutations invalidate correct query keys
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 8: Create Feature Request Context Files Hooks

**What**: Create TanStack Query hooks for context file operations
**Why**: Provides React components with access to context file data with caching
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-feature-request-context-files.ts` - Query hooks for context files

**Changes:**
- Add `'use client'` directive
- Import `useMutation`, `useQuery`, `useQueryClient` from `@tanstack/react-query`
- Import `featureRequestContextFileKeys` from `@/lib/queries/feature-request-context-files`
- Import `useElectronDb` from `../useElectron`
- Implement `useContextFiles(featureRequestId)` - query for all context files
- Implement `useContextFilesByType(featureRequestId, fileType)` - query filtered by type
- Implement `useContextFile(id)` - query for a single context file by ID
- Implement `useAddContextFile()` - mutation to create a context file
- Implement `useBulkAddContextFiles()` - mutation to bulk create context files
- Implement `useUpdateContextFile()` - mutation to update a context file
- Implement `useRemoveContextFile()` - mutation to delete a context file
- Implement `useSetContextFileIncluded()` - mutation to toggle `includedInContext`
- All queries should use `enabled: isElectron && featureRequestId > 0` pattern
- All mutations should invalidate relevant query keys on success

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All hooks exported and functional
- [ ] Queries use proper enabled conditions
- [ ] Mutations invalidate correct query keys
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

### Step 9: Update Feature Requests Hooks with Archive/Unarchive

**What**: Add archive and unarchive mutation hooks to the existing feature requests hooks file
**Why**: Completes the feature request hooks with archive functionality for the workflow
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-feature-requests.ts` - Existing feature request hooks

**Changes:**
- Implement `useArchiveFeatureRequest()` mutation that calls `featureRequests.update(id, { archivedAt: new Date().toISOString() })`
- Implement `useUnarchiveFeatureRequest()` mutation that calls `featureRequests.update(id, { archivedAt: null })`
- Both mutations should invalidate `featureRequestKeys.detail(id)` and `featureRequestKeys.byProject._def` on success
- Follow the existing mutation pattern in the file for consistency

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` hooks exported
- [ ] Mutations properly set/clear `archivedAt` timestamp
- [ ] Query cache invalidation works correctly
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] All new query key files export properly typed key factories
- [ ] `lib/queries/index.ts` merges all new keys without type errors
- [ ] `useElectronDb()` returns all new domain objects
- [ ] All hook files use `'use client'` directive
- [ ] All queries use proper `enabled` conditions
- [ ] All mutations invalidate appropriate query keys

## Notes

- The implementation closely follows the existing patterns established in `use-feature-requests.ts`, `use-feature-request-repositories.ts`, and `use-repository-overviews.ts`
- Query key naming follows the convention: `entityNameKeys` (e.g., `featureRequestRunKeys`)
- Hook naming follows the convention: `use<Action><Entity>` (e.g., `useCreateRun`, `useContextFiles`)
- The `FeatureRequestRunStep` and `StepConfigurationStep` types are identical (`'refine' | 'research' | 'plan'`) but are kept separate as they come from different schema files
- Context file types (`ContextFileType`) include `'repository'`, `'document'`, and `'image'`
- The `setCurrentRun` mutation should also clear `isCurrentRun` on other runs for the same feature request and step - this is handled by the IPC handler, not the hook
- Consider adding optimistic updates for frequently used mutations in future iterations
