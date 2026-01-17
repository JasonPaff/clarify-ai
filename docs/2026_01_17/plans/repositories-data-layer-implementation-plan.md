# Repositories Data Layer Implementation Plan

**Generated**: 2026-01-17
**Original Request**: repositories feature data layer
**Refined Request**: The repositories feature data layer requires implementing the complete database-to-UI data flow for managing code repository associations within projects, enabling users to link local filesystem directories to their Clarify AI projects for context-aware AI analysis.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This implementation adds the complete database-to-UI data flow for managing code repository associations within projects. It follows the established patterns in the codebase, creating a Drizzle schema, repository class, IPC handlers, and TanStack Query hooks to enable users to link local filesystem directories to their Clarify AI projects.

## Prerequisites

- [ ] Verify Node.js and pnpm are installed
- [ ] Ensure the project builds successfully with `pnpm build`
- [ ] Run existing tests/linting to confirm baseline: `pnpm lint && pnpm typecheck`

## Implementation Steps

### Step 1: Create Database Schema for Repositories

**What**: Define the Drizzle schema for the repositories table with foreign key relationship to projects.
**Why**: The schema is the foundation of the data layer, defining the structure for storing repository associations.
**Confidence**: High

**Files to Create:**

- `db/schema/repositories.schema.ts` - Drizzle schema definition for repositories table

**Files to Modify:**

- `db/schema/index.ts` - Add export for new repositories schema

**Changes:**

- Create `repositories` table with fields: `id` (integer primary key), `projectId` (foreign key to projects), `path` (text for filesystem path), `name` (text for display name), `lastScannedAt` (optional text timestamp), `fileCount` (optional integer), `createdAt`, `updatedAt`
- Add index on `projectId` for efficient querying by project
- Add index on `path` for uniqueness checks
- Export `Repository` and `NewRepository` types using `$inferSelect` and `$inferInsert`
- Add export statement in `db/schema/index.ts`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Schema file follows pattern from `projects.schema.ts`
- [ ] Foreign key references `projects.id`
- [ ] Types exported for `Repository` and `NewRepository`
- [ ] Schema exported from `db/schema/index.ts`
- [ ] All validation commands pass

---

### Step 2: Create Repository Pattern Implementation

**What**: Implement the repository class with CRUD operations for repositories data access.
**Why**: The repository pattern abstracts database operations and provides a clean interface for IPC handlers.
**Confidence**: High

**Files to Create:**

- `db/repositories/repositories.repository.ts` - Repository pattern implementation

**Files to Modify:**

- `db/repositories/index.ts` - Add export for new repository

**Changes:**

- Create `RepositoriesRepository` interface with methods: `create`, `delete`, `getById`, `getByProjectId`, `update`
- Implement `createRepositoriesRepository` factory function following the pattern from `projects.repository.ts`
- Add `getByProjectId` method to fetch all repositories for a specific project
- Use `eq` from drizzle-orm for filtering queries
- Use `sql` template literal for `updatedAt` on updates
- Export repository interface and factory function from `db/repositories/index.ts`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Repository interface matches existing pattern
- [ ] Factory function accepts `DrizzleDatabase` parameter
- [ ] All CRUD methods implemented with proper types
- [ ] `getByProjectId` returns `Array<Repository>`
- [ ] Repository exported from index file
- [ ] All validation commands pass

---

### Step 3: Create Database Types Re-export File

**What**: Create the `db/types.ts` file to re-export database types for renderer use.
**Why**: The `types/electron.d.ts` file references `db/types.ts` for type imports, which currently does not exist.
**Confidence**: High

**Files to Create:**

- `db/types.ts` - Re-export file for database types

**Changes:**

- Re-export `NewProject`, `Project` from schema
- Re-export `NewRepository`, `Repository` from schema
- Keep file minimal, only re-exporting types needed by renderer

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] File exports all necessary types for renderer consumption
- [ ] Types are compatible with existing imports in `types/electron.d.ts`
- [ ] All validation commands pass

---

### Step 4: Add IPC Channels for Repositories

**What**: Define IPC channel constants for repository operations.
**Why**: IPC channels must be defined before handlers can be registered, following the existing channel pattern.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add repositories channels under `db` namespace

**Changes:**

- Add `repositories` object under `db` with channels: `create`, `delete`, `getById`, `getByProjectId`, `update`
- Follow naming convention: `db:repositories:methodName`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Channels follow existing naming pattern (`db:repositories:*`)
- [ ] All CRUD operations have corresponding channels
- [ ] `getByProjectId` channel included for project-scoped queries
- [ ] All validation commands pass

---

### Step 5: Create IPC Handlers for Repositories

**What**: Implement IPC handlers that bridge the renderer process to the repository.
**Why**: Handlers enable the renderer to invoke database operations through Electron's IPC mechanism.
**Confidence**: High

**Files to Create:**

- `electron/ipc/repositories.handlers.ts` - IPC handlers for repository operations

**Files to Modify:**

- `electron/ipc/index.ts` - Import and register repositories handlers

**Changes:**

- Create `registerRepositoriesHandlers` function accepting `RepositoriesRepository` parameter
- Register handlers for all channels: `create`, `delete`, `getById`, `getByProjectId`, `update`
- Follow pattern from `projects.handlers.ts` with `IpcMainInvokeEvent` typing
- Import `createRepositoriesRepository` in index.ts
- Call `registerRepositoriesHandlers` with instantiated repository

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Handlers follow pattern from `projects.handlers.ts`
- [ ] All channel handlers registered with `ipcMain.handle`
- [ ] Handlers registered in `electron/ipc/index.ts`
- [ ] All validation commands pass

---

### Step 6: Update Electron Preload Script

**What**: Expose repository operations to the renderer process via contextBridge.
**Why**: The preload script is the secure bridge between main and renderer processes.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add repositories to ElectronAPI interface and implementation

**Changes:**

- Import `NewRepository`, `Repository` types from `../db/schema`
- Add `repositories` object to `ElectronAPI` interface under `db` namespace
- Implement `repositories` methods in `electronAPI` object using `ipcRenderer.invoke`
- Methods: `create`, `delete`, `getById`, `getByProjectId`, `update`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `ElectronAPI.db.repositories` interface defined with all methods
- [ ] Implementation uses correct IPC channels
- [ ] Type safety maintained for parameters and return types
- [ ] All validation commands pass

---

### Step 7: Update Electron Type Definitions

**What**: Update the global ElectronAPI type definitions for renderer consumption.
**Why**: Type definitions ensure TypeScript support across the renderer process.
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add repositories interface to ElectronAPI

**Changes:**

- Add export for `NewRepository`, `Repository` types from `../db/types`
- Add `repositories` interface under `db` with all method signatures
- Use inline import pattern for types (e.g., `import('../db/types').Repository`)
- Match the structure of existing `projects` interface

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Types exported for renderer use
- [ ] `db.repositories` interface matches preload implementation
- [ ] All method signatures correctly typed
- [ ] All validation commands pass

---

### Step 8: Create Query Key Factory for Repositories

**What**: Define TanStack Query keys using the query-key-factory pattern.
**Why**: Query keys enable proper cache management and invalidation for repository data.
**Confidence**: High

**Files to Create:**

- `lib/queries/repositories.ts` - Query key factory for repositories

**Files to Modify:**

- `lib/queries/index.ts` - Merge repository keys into queries

**Changes:**

- Create `repositoryKeys` using `createQueryKeys` from `@lukemorales/query-key-factory`
- Define keys: `list` (by projectId), `detail` (by id)
- Import and merge `repositoryKeys` in `index.ts` using `mergeQueryKeys`
- Update `QueryKeys` type inference

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Query keys follow pattern from `projects.ts`
- [ ] `list` key accepts `projectId` parameter for project-scoped queries
- [ ] Keys merged into main `queries` export
- [ ] All validation commands pass

---

### Step 9: Create Zod Validation Schemas

**What**: Define Zod schemas for repository form validation.
**Why**: Validation schemas ensure data integrity for create and update operations.
**Confidence**: High

**Files to Create:**

- `lib/validations/repository.ts` - Zod validation schemas

**Changes:**

- Create `createRepositorySchema` with fields: `path` (required string), `name` (required string)
- Create `updateRepositorySchema` for partial updates
- Export `CreateRepositoryFormValues` and `UpdateRepositoryFormValues` types
- Add validation rules: path must be non-empty, name must be 1-255 characters

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Schemas follow pattern from `project.ts`
- [ ] Required fields validated
- [ ] Types exported for form usage
- [ ] All validation commands pass

---

### Step 10: Extend useElectron Hook with Repositories

**What**: Add repositories methods to the `useElectronDb` hook.
**Why**: The hook provides a convenient, type-safe interface for renderer components to access database operations.
**Confidence**: High

**Files to Modify:**

- `hooks/useElectron.ts` - Extend `useElectronDb` with repositories

**Changes:**

- Add `repositories` object to `useElectronDb` return value
- Implement methods: `create`, `delete`, `getById`, `getByProjectId`, `update`
- Follow same pattern as `projects` with error handling for missing API
- Use `useMemo` for stable method references

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `repositories` object added to `useElectronDb` return
- [ ] All methods properly typed and implemented
- [ ] Error handling consistent with existing `projects` pattern
- [ ] All validation commands pass

---

### Step 11: Create TanStack Query Hooks for Repositories

**What**: Implement React Query hooks for repositories data fetching and mutations.
**Why**: Query hooks provide reactive data fetching with automatic cache management for UI components.
**Confidence**: High

**Files to Create:**

- `hooks/queries/use-repositories.ts` - TanStack Query hooks

**Changes:**

- Create `useRepositories(projectId)` hook for fetching repositories by project
- Create `useRepository(id)` hook for fetching single repository
- Create `useCreateRepository()` mutation hook with cache invalidation
- Create `useUpdateRepository()` mutation hook with optimistic updates
- Create `useDeleteRepository()` mutation hook with cache cleanup
- Use `repositoryKeys` for query keys
- Invalidate list queries on create/update/delete

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hooks follow pattern from `use-projects.ts`
- [ ] `useRepositories` accepts `projectId` parameter
- [ ] All mutations invalidate relevant queries
- [ ] `enabled` flag checks `isElectron`
- [ ] All validation commands pass

---

### Step 12: Generate and Run Database Migration

**What**: Generate and apply the database migration for the new repositories table.
**Why**: The migration creates the actual database table structure defined in the schema.
**Confidence**: High

**Files Generated (by Drizzle Kit):**

- `drizzle/*.sql` - Migration file (auto-generated)

**Changes:**

- Run `pnpm db:generate` to create migration from schema changes
- Run `pnpm db:migrate` to apply migration
- Verify table created with foreign key constraint

**Validation Commands:**

```bash
pnpm db:generate && pnpm db:migrate && pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Migration file generated in `drizzle/` directory
- [ ] Migration applies successfully
- [ ] Foreign key constraint on `projectId` active
- [ ] Indexes created on `projectId` and `path`
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Database migration applies without errors
- [ ] Electron app starts successfully with `pnpm electron:dev`
- [ ] No TypeScript errors in IDE

## Notes

- The `db/types.ts` file needs to be created as it is referenced by `types/electron.d.ts` but does not currently exist. This is a prerequisite fix included in Step 3.
- Foreign key constraint requires `foreign_keys = ON` pragma which is already set in `db/index.ts`.
- The `getByProjectId` method is essential for the UI to display repositories scoped to a specific project.
- Query key factory uses `projectId` as the primary filter for list queries since repositories are always fetched in project context.
- Consider adding a unique constraint on `(projectId, path)` combination to prevent duplicate repository paths per project.

---

## File Discovery Results

### Files to Create (7)

| File | Purpose |
|------|---------|
| `db/schema/repositories.schema.ts` | Drizzle schema for repositories table |
| `db/repositories/repositories.repository.ts` | Repository pattern implementation |
| `db/types.ts` | Type re-exports for renderer |
| `electron/ipc/repositories.handlers.ts` | IPC handlers for repository operations |
| `lib/queries/repositories.ts` | Query key factory |
| `lib/validations/repository.ts` | Zod validation schemas |
| `hooks/queries/use-repositories.ts` | TanStack Query hooks |

### Files to Modify (9)

| File | Changes |
|------|---------|
| `db/schema/index.ts` | Export repositories schema |
| `db/repositories/index.ts` | Export repositories repository |
| `electron/ipc/channels.ts` | Add db.repositories channels |
| `electron/ipc/index.ts` | Register repositories handlers |
| `electron/preload.ts` | Add repositories to ElectronAPI |
| `types/electron.d.ts` | Add repositories interface |
| `lib/queries/index.ts` | Merge repository keys |
| `hooks/useElectron.ts` | Extend with repositories methods |
