# Feature Request Data Layer Implementation Plan

**Generated**: 2026-01-17T12:08:00Z
**Original Request**: Feature request database/data layer
**Refined Request**: Implement a complete data layer for the feature requests functionality, which currently has routing infrastructure at `app/(app)/projects/[projectId]/features/` but lacks any database persistence or data access mechanisms.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements a complete data layer for feature requests functionality, following the established patterns in the codebase. It creates a Drizzle ORM schema with foreign key relationship to projects, a repository abstraction layer, Electron IPC handlers, TanStack Query hooks, and Zod validation schemas. The implementation mirrors the existing repositories pattern to maintain consistency.

## Analysis Summary

- Feature request refined with project context
- Discovered 28 files across 8 directories
- Generated 13-step implementation plan

## File Discovery Results

### Files to Create

| File | Purpose |
|------|---------|
| `db/schema/feature-requests.schema.ts` | Drizzle ORM schema for feature_requests table |
| `db/repositories/feature-requests.repository.ts` | Repository with CRUD operations |
| `electron/ipc/feature-requests.handlers.ts` | IPC handlers for main process |
| `hooks/queries/use-feature-requests.ts` | TanStack Query hooks |
| `lib/queries/feature-requests.ts` | Query key factory |
| `lib/validations/feature-request.ts` | Zod validation schemas |

### Files to Modify

| File | Changes |
|------|---------|
| `db/index.ts` | Import feature-requests schema |
| `electron/ipc/channels.ts` | Add featureRequests channel constants |
| `electron/ipc/register-handlers.ts` | Register feature-requests handlers |
| `electron/preload.ts` | Expose featureRequests API |
| `types/electron.d.ts` | Add featureRequests types |
| `hooks/useElectron.ts` | Extend useElectronDb() |

---

## Prerequisites

- [ ] Ensure `pnpm install` has been run and all dependencies are available
- [ ] Verify database is accessible and migrations can be run
- [ ] Confirm existing patterns in `repositories.schema.ts` and related files are understood

## Implementation Steps

### Step 1: Create Feature Requests Database Schema

**What**: Create the Drizzle ORM schema file defining the `feature_requests` table with all required fields and indexes.
**Why**: The database schema is the foundation of the data layer; all other components depend on the table structure being defined first.
**Confidence**: High

**Files to Create:**
- `db/schema/feature-requests.schema.ts` - Drizzle schema defining the feature_requests table

**Changes:**
- Add `feature_requests` table definition using `sqliteTable`
- Add fields: `id` (integer primary key), `createdAt` (text with CURRENT_TIMESTAMP default), `updatedAt` (text with CURRENT_TIMESTAMP default), `projectId` (integer foreign key to projects), `title` (text, required), `description` (text, optional), `status` (text for workflow stage tracking: 'draft' | 'refining' | 'researching' | 'planning' | 'completed')
- Add optional fields for AI outputs: `refinedRequirements` (text), `researchFindings` (text), `implementationPlan` (text)
- Add indexes for `projectId` and `status` columns
- Add cascade delete on projectId foreign key reference
- Export `NewFeatureRequest` and `FeatureRequest` types using `$inferInsert` and `$inferSelect`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Schema file exists at specified path
- [ ] Types are properly exported
- [ ] Foreign key reference to projects table is defined with onDelete cascade
- [ ] Indexes are defined for projectId and status
- [ ] All validation commands pass

---

### Step 2: Update Database Index to Include Feature Requests Schema

**What**: Import and include the feature-requests schema in the database initialization file.
**Why**: The schema must be registered with Drizzle ORM for the database to recognize the new table.
**Confidence**: High

**Files to Modify:**
- `db/index.ts` - Import feature-requests schema and add to combined schema object

**Changes:**
- Add import statement for `feature-requests.schema.ts`
- Spread the imported schema into the combined `schema` object alongside existing schemas

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Feature requests schema is imported in db/index.ts
- [ ] Schema is included in the combined schema object
- [ ] All validation commands pass

---

### Step 3: Generate Database Migration

**What**: Generate a Drizzle Kit migration for the new feature_requests table.
**Why**: The migration creates the actual database table structure and must be run before any data operations.
**Confidence**: High

**Files Created (by migration):**
- `drizzle/XXXX_migration_name.sql` - Auto-generated migration file

**Changes:**
- Run `pnpm db:generate` to generate migration from schema diff
- Verify generated SQL includes CREATE TABLE statement with all columns and indexes

**Validation Commands:**
```bash
pnpm db:generate && pnpm db:migrate
```

**Success Criteria:**
- [ ] Migration file is generated in drizzle/ directory
- [ ] Migration includes correct CREATE TABLE statement
- [ ] Migration runs successfully without errors
- [ ] feature_requests table exists in database

---

### Step 4: Create Feature Requests Repository

**What**: Create the repository implementation providing data access abstraction for feature requests.
**Why**: The repository pattern abstracts database operations, providing a clean interface for the IPC handlers and enabling testability.
**Confidence**: High

**Files to Create:**
- `db/repositories/feature-requests.repository.ts` - Repository with CRUD operations

**Changes:**
- Define `FeatureRequestsRepository` interface with methods: `create`, `getById`, `getByProjectId`, `update`, `delete`
- Implement `createFeatureRequestsRepository` factory function accepting `DrizzleDatabase`
- Implement `create` method using `db.insert().values().returning().get()`
- Implement `getById` method using `db.select().from().where().get()`
- Implement `getByProjectId` method using `db.select().from().where().all()`
- Implement `update` method setting `updatedAt` to CURRENT_TIMESTAMP
- Implement `delete` method returning boolean based on changes count

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Repository file exists at specified path
- [ ] Interface defines all CRUD methods with proper types
- [ ] Factory function creates repository with database instance
- [ ] All methods follow existing repository patterns
- [ ] All validation commands pass

---

### Step 5: Add Feature Requests IPC Channel Constants

**What**: Add IPC channel constants for feature requests database operations.
**Why**: IPC channels must be defined as constants to ensure type safety and consistency between main and renderer processes.
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add featureRequests channel definitions

**Changes:**
- Add `featureRequests` object to `IpcChannels.db` with channel strings for: `create`, `delete`, `getById`, `getByProjectId`, `update`
- Follow naming pattern: `db:featureRequests:methodName`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All five channel constants are defined
- [ ] Channel names follow established pattern
- [ ] Channels are nested under IpcChannels.db.featureRequests
- [ ] All validation commands pass

---

### Step 6: Create Feature Requests IPC Handlers

**What**: Create IPC handlers that expose repository methods to the renderer process.
**Why**: The handlers bridge the main process repository to the renderer, enabling the React app to perform database operations.
**Confidence**: High

**Files to Create:**
- `electron/ipc/feature-requests.handlers.ts` - IPC handler registration

**Changes:**
- Import `ipcMain` and `IpcMainInvokeEvent` from electron
- Import repository types and IpcChannels
- Create `registerFeatureRequestsHandlers` function accepting `FeatureRequestsRepository`
- Register handler for `getById` channel
- Register handler for `getByProjectId` channel
- Register handler for `create` channel
- Register handler for `update` channel (with id and data parameters)
- Register handler for `delete` channel

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Handler file exists at specified path
- [ ] All five handlers are registered
- [ ] Handlers use correct channel constants
- [ ] Function signature matches repository pattern
- [ ] All validation commands pass

---

### Step 7: Register Feature Requests Handlers in Main Process

**What**: Import and register the feature requests handlers in the main handler registration file.
**Why**: Handlers must be registered during app initialization for IPC communication to work.
**Confidence**: High

**Files to Modify:**
- `electron/ipc/register-handlers.ts` - Import and call handler registration

**Changes:**
- Add import for `createFeatureRequestsRepository` from repository file
- Add import for `registerFeatureRequestsHandlers` from handlers file
- Create feature requests repository instance in `registerAllHandlers` function
- Call `registerFeatureRequestsHandlers` with repository instance

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Imports are added for repository and handlers
- [ ] Repository is instantiated in registerAllHandlers
- [ ] Handler registration is called with repository
- [ ] All validation commands pass

---

### Step 8: Update Electron Preload Script

**What**: Expose feature requests API methods through the context bridge to the renderer process.
**Why**: The preload script is the only bridge between main and renderer; without it, the renderer cannot access IPC methods.
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Add featureRequests to ElectronAPI and implementation

**Changes:**
- Add import for `NewFeatureRequest` and `FeatureRequest` types from schema
- Add `featureRequests` object to `ElectronAPI` interface with typed method signatures
- Add `featureRequests` implementation to `electronAPI` object using `ipcRenderer.invoke` with appropriate channels

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Types are imported from feature-requests schema
- [ ] ElectronAPI interface includes featureRequests object
- [ ] All five methods are defined with correct types
- [ ] Implementation uses correct IpcChannels
- [ ] All validation commands pass

---

### Step 9: Update Electron Type Definitions

**What**: Update the global type definitions to include feature requests API types for the renderer process.
**Why**: TypeScript type definitions enable type-safe access to the Electron API in React components.
**Confidence**: High

**Files to Modify:**
- `types/electron.d.ts` - Add featureRequests types

**Changes:**
- Add type re-export for `NewFeatureRequest` and `FeatureRequest` from schema
- Add `featureRequests` object to `ElectronAPI` interface matching preload.ts structure
- Include all five method signatures with proper types using schema imports

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Types are re-exported from feature-requests schema
- [ ] ElectronAPI interface includes featureRequests
- [ ] Method signatures match preload.ts exactly
- [ ] All validation commands pass

---

### Step 10: Extend useElectronDb Hook

**What**: Add feature requests methods to the useElectronDb hook for use in React components.
**Why**: The hook provides a React-friendly abstraction over the Electron API with proper error handling.
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Add featureRequests to useElectronDb

**Changes:**
- Add `featureRequests` useMemo block following the repositories pattern
- Implement `create` method with error throw if API unavailable
- Implement `delete` method with error throw
- Implement `getById` method with undefined fallback
- Implement `getByProjectId` method with empty array fallback
- Implement `update` method with error throw
- Add featureRequests to the returned object

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] featureRequests object is created with useMemo
- [ ] All five methods are implemented with proper error handling
- [ ] Pattern matches existing repositories implementation
- [ ] featureRequests is included in return object
- [ ] All validation commands pass

---

### Step 11: Create Feature Requests Query Key Factory

**What**: Create query key factory for TanStack Query cache management.
**Why**: Query keys enable organized cache invalidation and are required for the TanStack Query hooks to work correctly.
**Confidence**: High

**Files to Create:**
- `lib/queries/feature-requests.ts` - Query key factory

**Changes:**
- Import `createQueryKeys` from `@lukemorales/query-key-factory`
- Create `featureRequestKeys` using `createQueryKeys` with namespace 'featureRequests'
- Define `byProject` key factory taking `projectId: number`
- Define `detail` key factory taking `id: number`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Query key factory file exists at specified path
- [ ] Keys are created with 'featureRequests' namespace
- [ ] byProject and detail key factories are defined
- [ ] Pattern matches repositories query keys
- [ ] All validation commands pass

---

### Step 12: Create Feature Requests TanStack Query Hooks

**What**: Create React hooks for feature requests data fetching and mutations using TanStack Query.
**Why**: These hooks provide the data fetching layer for React components with caching, loading states, and cache invalidation.
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-feature-requests.ts` - TanStack Query hooks

**Changes:**
- Add 'use client' directive
- Import required hooks from @tanstack/react-query
- Import featureRequestKeys from query key factory
- Import useElectronDb from hooks
- Create `useFeatureRequests(projectId: number)` hook for listing by project
- Create `useFeatureRequest(id: number)` hook for single feature request
- Create `useCreateFeatureRequest()` mutation hook with cache invalidation
- Create `useUpdateFeatureRequest()` mutation hook with optimistic cache update
- Create `useDeleteFeatureRequest()` mutation hook with query removal and invalidation

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook file exists at specified path
- [ ] All five hooks are implemented
- [ ] Queries use featureRequestKeys for cache keys
- [ ] Mutations properly invalidate related queries
- [ ] Pattern matches use-repositories.ts
- [ ] All validation commands pass

---

### Step 13: Create Feature Request Zod Validation Schemas

**What**: Create Zod validation schemas for feature request form inputs.
**Why**: Validation schemas ensure type safety and data integrity from user input through to database persistence.
**Confidence**: High

**Files to Create:**
- `lib/validations/feature-request.ts` - Zod validation schemas

**Changes:**
- Import `z` from 'zod'
- Create shared field schemas for title (required, max 255), description (optional), status (enum)
- Create `createFeatureRequestSchema` with required title field
- Create `updateFeatureRequestSchema` with all editable fields optional
- Export `CreateFeatureRequestFormValues` and `UpdateFeatureRequestFormValues` types

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Validation schema file exists at specified path
- [ ] Create and update schemas are defined
- [ ] Types are exported using z.infer
- [ ] Pattern matches repository.ts validation
- [ ] Status enum includes all workflow stages
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Database migration runs successfully with `pnpm db:generate && pnpm db:migrate`
- [ ] Electron app compiles with `pnpm electron:compile`
- [ ] Application starts without errors in development mode

## Notes

**Architectural Decisions:**
- Following exact patterns from repositories implementation to maintain codebase consistency
- Using text type for status field to allow flexibility in workflow stages
- Storing AI outputs as nullable text fields rather than separate tables for simplicity
- Using cascade delete on project foreign key to clean up feature requests when projects are deleted

**Assumptions Requiring Confirmation:**
- Status field values: 'draft', 'refining', 'researching', 'planning', 'completed' (inferred from workflow steps)
- AI output fields as nullable text (could alternatively be JSONB if structured data needed)

**Order Dependencies:**
- Step 1 (schema) must complete before Step 2 (db index update)
- Steps 1-2 must complete before Step 3 (migration)
- Step 4 (repository) depends on Step 3 (migration)
- Steps 5-6 (IPC) depend on Step 4 (repository)
- Step 7 (register) depends on Steps 5-6
- Steps 8-9 (preload/types) depend on Step 5 (channels)
- Step 10 (useElectronDb) depends on Steps 8-9
- Step 11 (query keys) can run in parallel with Steps 5-10
- Step 12 (hooks) depends on Steps 10-11
- Step 13 (validation) can run independently, but logically fits at the end
