# Step 1: Feature Request Refinement

**Started**: 2026-01-20T00:02:00.000Z
**Completed**: 2026-01-20T00:02:30.000Z
**Duration**: ~30s
**Status**: Completed

## Original Request

```
Plan Phase 3 of the feature-request-workflow-implementation-order.md

Phase 3: Query Hooks & State Management
Goal: Create React hooks for accessing new data

Tasks:
3.1 Run History Hooks
- Create use-feature-request-runs.ts with useRunHistory, useCurrentRun, useCreateRun, useSetCurrentRun
- Add query keys to lib/queries/

3.2 Step Configuration Hooks
- Create use-step-configurations.ts with useStepConfig, useUpdateStepConfig
- Add query keys

3.3 Context Files Hooks
- Create use-feature-request-context-files.ts with useContextFiles, useAddContextFile, useRemoveContextFile
- Add query keys

3.4 Feature Request Hook Updates
- Add useArchiveFeatureRequest mutation
- Add useUnarchiveFeatureRequest mutation
- Update existing hooks to handle new fields
```

## Project Context Provided

- TanStack Query v5 with @lukemorales/query-key-factory
- Query hooks in `hooks/queries/` directory
- Query keys in `lib/queries/` using createQueryKeys pattern
- useElectronDb() hook for Electron IPC access
- Mutations must invalidate query keys on success
- Phase 1 (schemas) and Phase 2 (IPC handlers) already complete

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

"Plan Phase 3 of the feature-request-workflow-implementation-order.md - Query Hooks & State Management..."

Output ONLY the refined paragraph (200-500 words), nothing else.
```

## Refined Feature Request

Implement Phase 3 of the feature request workflow by creating React hooks for accessing the new data layer established in Phases 1 and 2, following the existing TanStack Query v5 patterns established in `hooks/queries/use-feature-requests.ts` and query key conventions in `lib/queries/`. First, create `hooks/queries/use-feature-request-runs.ts` containing four hooks: `useRunHistory(featureRequestId)` to fetch all runs for a feature request ordered by creation date, `useCurrentRun(featureRequestId)` to fetch the currently active run (where `isCurrent` is true), `useCreateRun()` as a mutation that creates a new run record and invalidates the run history query, and `useSetCurrentRun()` as a mutation that marks a specific run as current while unsetting any previous current run, invalidating both run queries. Second, create `hooks/queries/use-step-configurations.ts` with `useStepConfig(featureRequestId, stepType)` to fetch configuration for a specific step (refine, research, or plan) and `useUpdateStepConfig()` as a mutation that updates step configuration fields (modelId, temperature, customPrompt, isEnabled) and invalidates the step config query. Third, create `hooks/queries/use-feature-request-context-files.ts` with `useContextFiles(featureRequestId)` to fetch all context files for a feature request, `useAddContextFile()` as a mutation that creates a new context file record and invalidates the context files query, and `useRemoveContextFile()` as a mutation that deletes a context file by ID and invalidates the query. Fourth, update the existing `use-feature-requests.ts` hook file to add `useArchiveFeatureRequest()` and `useUnarchiveFeatureRequest()` mutations that set the `archivedAt` timestamp field accordingly and invalidate feature request queries, ensuring existing hooks properly handle the new `archivedAt`, `currentRunId`, and other fields added in Phase 1. For each hook file, add corresponding query key definitions to `lib/queries/` using the `createQueryKeys` factory pattern with appropriate scope (featureRequestRuns, stepConfigurations, contextFiles) and parameterized keys for ID-based queries. All hooks must use the `useElectronDb()` hook to access IPC database methods, implement proper error handling, and follow the established mutation pattern of invalidating relevant query keys on success using `queryClient.invalidateQueries()`.

## Validation Results

- **Format Check**: PASS - Single paragraph without headers or sections
- **Length Check**: PASS - 407 words (original ~100 words, refined ~4x)
- **Scope Check**: PASS - Core intent preserved, no feature creep
- **Quality Check**: PASS - Essential technical context added

## Length Analysis

| Metric | Value |
|--------|-------|
| Original Word Count | ~100 words |
| Refined Word Count | 407 words |
| Expansion Ratio | ~4x |
