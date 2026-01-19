# Implementation Plan: Feature Request Repository Selection

**Generated**: 2026-01-18
**Original Request**: Add repository selection to the feature request workflow with optional selection at creation/editing and required selection at the file discovery step.

## Overview

| Field              | Value       |
| ------------------ | ----------- |
| Estimated Duration | 2-3 days    |
| Complexity         | Medium-High |
| Risk Level         | Medium      |

## Quick Summary

This feature adds repository selection to the feature request workflow by implementing a junction table that links feature requests to repositories in a many-to-many relationship. Users can optionally select target repositories during feature request creation/editing, with required selection enforced at the file discovery (research) step before initiating codebase analysis.

## Prerequisites

- [ ] Verify SQLite database is accessible and migrations run successfully
- [ ] Confirm TanStack Form and TanStack Query are functioning in the application
- [ ] Ensure existing repositories query hooks return data for the current project

## Implementation Steps

### Step 1: Create Junction Table Schema

**What**: Define the Drizzle schema for the `feature_request_repositories` junction table with foreign keys to both `feature_requests` and `repositories` tables.

**Why**: This establishes the many-to-many relationship between feature requests and repositories with proper referential integrity and cascade deletes.

**Confidence**: High

**Files to Create:**

- `db/schema/feature-request-repositories.schema.ts` - Junction table schema with composite unique constraint

**Changes:**

- Define `featureRequestRepositories` table with `id`, `featureRequestId`, `repositoryId`, `createdAt` columns
- Add foreign key references to `feature_requests` and `repositories` with `onDelete: 'cascade'`
- Add composite unique index on `featureRequestId` and `repositoryId` to prevent duplicates
- Add individual indexes for efficient querying by either foreign key
- Export `FeatureRequestRepository` and `NewFeatureRequestRepository` types using `$inferSelect` and `$inferInsert`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Schema file exports table definition and inferred types
- [ ] Foreign key references use cascade delete
- [ ] Composite unique constraint prevents duplicate associations
- [ ] All validation commands pass

---

### Step 2: Update Database Configuration

**What**: Register the new schema in the database index and Drizzle configuration files.

**Why**: Required for the schema to be recognized by Drizzle ORM and included in migration generation.

**Confidence**: High

**Files to Modify:**

- `db/index.ts` - Import and spread the new schema
- `drizzle.config.ts` - Add schema file path to the schema array

**Changes:**

- Import `* as featureRequestRepositoriesSchema` from the new schema file in `db/index.ts`
- Spread `featureRequestRepositoriesSchema` into the combined schema object
- Add `'./db/schema/feature-request-repositories.schema.ts'` to the schema array in `drizzle.config.ts`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Schema is properly imported and merged in `db/index.ts`
- [ ] Drizzle config includes the new schema file path
- [ ] All validation commands pass

---

### Step 3: Generate Database Migration

**What**: Generate the SQL migration file for the new junction table.

**Why**: Creates the actual database table structure based on the Drizzle schema definition.

**Confidence**: High

**Files to Create:**

- Migration file in `drizzle/` (auto-generated)

**Changes:**

- Run `pnpm db:generate` to create migration SQL

**Validation Commands:**

```bash
pnpm db:generate
```

**Success Criteria:**

- [ ] Migration file is generated in `drizzle/` directory
- [ ] Migration creates `feature_request_repositories` table with correct schema
- [ ] Foreign key constraints and indexes are included in migration
- [ ] All validation commands pass

---

### Step 4: Create Repository Pattern Implementation

**What**: Implement the repository pattern for feature request repository associations with CRUD operations.

**Why**: Provides a clean abstraction layer for database operations following the established project pattern.

**Confidence**: High

**Files to Create:**

- `db/repositories/feature-request-repositories.repository.ts` - Repository implementation

**Changes:**

- Define `FeatureRequestRepositoriesRepository` interface with methods: `getByFeatureRequestId`, `setForFeatureRequest`, `addToFeatureRequest`, `removeFromFeatureRequest`
- Implement `createFeatureRequestRepositoriesRepository` factory function
- `getByFeatureRequestId` returns array of repository IDs for a feature request
- `setForFeatureRequest` replaces all associations (delete existing, insert new) in a single operation
- `addToFeatureRequest` adds a single association (insert or ignore if exists)
- `removeFromFeatureRequest` removes a single association

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Repository interface defines all required methods
- [ ] Factory function returns properly typed repository object
- [ ] `setForFeatureRequest` handles the "replace all" pattern efficiently
- [ ] All validation commands pass

---

### Step 5: Create IPC Channel Definitions

**What**: Define IPC channel constants for feature request repository operations.

**Why**: Maintains type-safe channel names and follows the established IPC communication pattern.

**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add new channel definitions

**Changes:**

- Add `featureRequestRepositories` object to `IpcChannels.db` namespace
- Define channels: `getByFeatureRequestId`, `setForFeatureRequest`, `addToFeatureRequest`, `removeFromFeatureRequest`
- Follow naming pattern: `'db:featureRequestRepositories:methodName'`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New channels added alphabetically within `db` namespace
- [ ] Channel names follow established naming convention
- [ ] All validation commands pass

---

### Step 6: Create IPC Handlers

**What**: Implement Electron IPC handlers for feature request repository operations.

**Why**: Bridges the renderer process requests to the database repository in the main process.

**Confidence**: High

**Files to Create:**

- `electron/ipc/feature-request-repositories.handlers.ts` - IPC handler registration

**Changes:**

- Import `FeatureRequestRepositoriesRepository` type from the repository file
- Import `IpcChannels` for channel constants
- Create `registerFeatureRequestRepositoriesHandlers` function taking repository as parameter
- Register handlers for each channel using `ipcMain.handle`
- Each handler calls corresponding repository method with validated parameters

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler function exports with correct signature
- [ ] All channels have corresponding handlers registered
- [ ] Handlers properly delegate to repository methods
- [ ] All validation commands pass

---

### Step 7: Register IPC Handlers

**What**: Register the new IPC handlers in the central handler registration.

**Why**: Ensures handlers are initialized when the Electron app starts.

**Confidence**: High

**Files to Modify:**

- `electron/ipc/register-handlers.ts` - Import and call new handler registration

**Changes:**

- Import `createFeatureRequestRepositoriesRepository` from the repository file
- Import `registerFeatureRequestRepositoriesHandlers` from the handlers file
- Create repository instance using `createFeatureRequestRepositoriesRepository(db)`
- Call `registerFeatureRequestRepositoriesHandlers(featureRequestRepositoriesRepository)`
- Add appropriate comment grouping like existing handlers

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Import statements added for repository and handlers
- [ ] Repository created and handlers registered in correct order
- [ ] Follows existing pattern with comment blocks
- [ ] All validation commands pass

---

### Step 8: Update Preload Script

**What**: Expose the new IPC methods to the renderer process via the context bridge.

**Why**: Makes the feature request repository operations accessible from React components.

**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add to ElectronAPI interface and implementation

**Changes:**

- Add `featureRequestRepositories` object to `ElectronAPI.db` interface with method signatures
- Implement the methods in the `electronAPI` object using `ipcRenderer.invoke` with correct channels
- Methods: `getByFeatureRequestId`, `setForFeatureRequest`, `addToFeatureRequest`, `removeFromFeatureRequest`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Interface methods match handler signatures
- [ ] Implementation uses correct IPC channels
- [ ] Methods alphabetically sorted within `db.featureRequestRepositories`
- [ ] All validation commands pass

---

### Step 9: Update Type Definitions

**What**: Update the global type definitions for the Electron API.

**Why**: Provides TypeScript types for renderer-side code accessing the Electron API.

**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add type re-exports and interface

**Changes:**

- Add type re-exports for `FeatureRequestRepository` and `NewFeatureRequestRepository` from schema
- Add `featureRequestRepositories` object to `ElectronAPI.db` interface matching preload
- Use `import()` syntax for types like existing patterns

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Type exports added at top of file
- [ ] Interface matches preload script exactly
- [ ] Import syntax follows existing pattern
- [ ] All validation commands pass

---

### Step 10: Update useElectronDb Hook

**What**: Add the feature request repositories methods to the useElectronDb hook.

**Why**: Provides a typed React hook interface for accessing the IPC methods.

**Confidence**: High

**Files to Modify:**

- `hooks/useElectron.ts` - Add featureRequestRepositories to useElectronDb

**Changes:**

- Add `featureRequestRepositories` to the return object of `useElectronDb`
- Create `useMemo` block similar to other entities
- Implement wrapper methods: `getByFeatureRequestId`, `setForFeatureRequest`, `addToFeatureRequest`, `removeFromFeatureRequest`
- Handle null API case appropriately

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Hook exports featureRequestRepositories in return object
- [ ] Methods properly wrapped with API null checks
- [ ] Follows existing memoization pattern
- [ ] All validation commands pass

---

### Step 11: Create Query Key Factory

**What**: Define query keys for feature request repository associations.

**Why**: Enables organized cache management and invalidation for TanStack Query.

**Confidence**: High

**Files to Create:**

- `lib/queries/feature-request-repositories.ts` - Query key factory

**Files to Modify:**

- `lib/queries/index.ts` - Merge new query keys

**Changes:**

- Create `featureRequestRepositoryKeys` using `createQueryKeys` with domain name `'featureRequestRepositories'`
- Define key: `byFeatureRequest: (featureRequestId: number) => [featureRequestId]`
- Import and add to `mergeQueryKeys` call in index.ts

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Query key factory exports correctly
- [ ] Keys merged into main queries object
- [ ] Follows existing naming conventions
- [ ] All validation commands pass

---

### Step 12: Create Query Hooks

**What**: Create TanStack Query hooks for fetching and mutating feature request repository associations.

**Why**: Provides reactive data fetching with automatic cache management for the UI.

**Confidence**: High

**Files to Create:**

- `hooks/queries/use-feature-request-repositories.ts` - Query and mutation hooks

**Changes:**

- Create `useFeatureRequestRepositories(featureRequestId: number)` query hook
- Create `useSetFeatureRequestRepositories()` mutation hook for replacing all associations
- Create `useAddFeatureRequestRepository()` mutation hook for adding single association
- Create `useRemoveFeatureRequestRepository()` mutation hook for removing single association
- All mutations invalidate `byFeatureRequest` query key on success

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Query hook returns repository IDs array with loading/error states
- [ ] Mutation hooks properly invalidate caches
- [ ] Hooks use `useElectronDb` for IPC access
- [ ] All validation commands pass

---

### Step 13: Create Validation Schemas

**What**: Create Zod validation schemas for repository selection in forms.

**Why**: Ensures data integrity and provides validation error messages for the UI.

**Confidence**: High

**Files to Create:**

- `lib/validations/feature-request-repositories.ts` - Validation schemas

**Files to Modify:**

- `lib/validations/feature-request.ts` - Extend existing schemas

**Changes:**

- Create `repositoryIdsSchema` as `z.array(z.number().int().positive()).optional()` for create/edit forms
- Create `requiredRepositoryIdsSchema` as `z.array(z.number().int().positive()).min(1, 'At least one repository must be selected')` for research step
- Add `repositoryIds` field to create/edit schemas using optional schema

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Optional schema allows empty array or undefined
- [ ] Required schema enforces minimum 1 selection with error message
- [ ] Existing form schemas extended with new field
- [ ] All validation commands pass

---

### Step 14: Create MultiSelectField Component

**What**: Create a reusable multi-select form field component for TanStack Form integration. Base-UI components should be used as the base.

**Why**: Provides a consistent UI pattern for selecting multiple items with checkbox-style selection.

**Confidence**: Medium

**Files to Create:**

- `components/ui/form/multi-select-field.tsx` - Multi-select field component

**Changes:**

- Create `MultiSelectField` component following CheckboxField and SelectField patterns
- Accept props: `label`, `description`, `options` (array of `{value, label}`), `isDisabled`, `size`
- Use `useFieldContext<Array<number>>()` for array value type
- Render list of checkboxes using Base UI primitives
- Handle selection toggling: add to array on check, remove on uncheck
- Display validation error state using `TanStackFieldRoot` wrapper

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component accepts options array and manages array value state
- [ ] Selection changes properly update form field value
- [ ] Error state displays when validation fails
- [ ] Follows CVA variant pattern for styling
- [ ] All validation commands pass

---

### Step 15: Register MultiSelectField in Form Hook

**What**: Add MultiSelectField to the form hook's field components registry.

**Why**: Makes the component available via `form.AppField` pattern.

**Confidence**: High

**Files to Modify:**

- `lib/forms/form-hook.ts` - Register new field component

**Changes:**

- Import `MultiSelectField` from the new component file
- Add `MultiSelectField` to the `fieldComponents` object

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component imported at top of file
- [ ] Component registered in fieldComponents alphabetically
- [ ] All validation commands pass

---

### Step 16: Create Repository Selector Component

**What**: Create a feature-specific component that wraps MultiSelectField with repository data fetching.

**Why**: Encapsulates the logic of fetching project repositories and transforming them for the multi-select.

**Confidence**: High

**Files to Create:**

- `components/features/repository-selector.tsx` - Repository selector wrapper

**Changes:**

- Create `RepositorySelector` component accepting `projectId` and form field props
- Fetch repositories using `useRepositories(projectId)` hook
- Transform repository data to options format: `{ value: repository.id, label: repository.name }`
- Handle loading and empty states
- Render `MultiSelectField` with transformed options

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component fetches repositories for given project
- [ ] Options formatted correctly for MultiSelectField
- [ ] Loading and empty states handled
- [ ] All validation commands pass

---

### Step 17: Update Create Feature Request Form

**What**: Add optional repository selection to the create feature request form.

**Why**: Allows users to optionally specify target repositories when creating a feature request.

**Confidence**: High

**Files to Modify:**

- `components/features/create-feature-request-form.tsx` - Add repository selector

**Changes:**

- Add `projectId: number` to component props interface
- Add `repositoryIds: []` to form default values
- Update `onSubmit` type to include `repositoryIds: Array<number>`
- Add `form.AppField` for `repositoryIds` field after description
- Add description text indicating selection is optional

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Form includes repository selection field
- [ ] Selection is visually marked as optional
- [ ] Submit values include repositoryIds array
- [ ] All validation commands pass

---

### Step 18: Update New Feature Request Dialog

**What**: Handle repository associations when creating a new feature request.

**Why**: Persists the repository selections to the junction table after feature request creation.

**Confidence**: High

**Files to Modify:**

- `components/features/new-feature-request-dialog.tsx` - Handle repository associations

**Changes:**

- Import `useSetFeatureRequestRepositories` mutation hook
- Update `handleSubmit` to save repository associations after creation
- Pass `projectId` to `CreateFeatureRequestForm` component
- Chain mutations: create feature request, then set repository associations

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Repository associations saved after feature request creation
- [ ] ProjectId passed to form for repository fetching
- [ ] All validation commands pass

---

### Step 19: Update Edit Feature Request Form

**What**: Add repository selection to the edit feature request form with current associations loaded.

**Why**: Allows users to modify target repositories for existing feature requests.

**Confidence**: High

**Files to Modify:**

- `components/features/edit-feature-request-form.tsx` - Add repository selector

**Changes:**

- Add `projectId: number` and `initialRepositoryIds: Array<number>` to props interface
- Add `repositoryIds` to form default values using `initialRepositoryIds` prop
- Update `onSubmit` type to include `repositoryIds: Array<number>`
- Add `form.AppField` for `repositoryIds` field

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Form loads with existing repository selections
- [ ] Selection changes tracked in form state
- [ ] Submit values include updated repositoryIds
- [ ] All validation commands pass

---

### Step 20: Update Edit Feature Request Dialog

**What**: Load and save repository associations when editing a feature request.

**Why**: Fetches current associations and persists changes.

**Confidence**: High

**Files to Modify:**

- `components/features/edit-feature-request-dialog.tsx` - Handle repository associations

**Changes:**

- Add `projectId: number` to props interface
- Import and use `useFeatureRequestRepositories` query hook
- Import `useSetFeatureRequestRepositories` mutation hook
- Pass `projectId` and `initialRepositoryIds` to form
- Update `handleSubmit` to save repository associations

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Current associations loaded when dialog opens
- [ ] Updated associations saved on form submit
- [ ] All validation commands pass

---

### Step 21: Create Research Step Component

**What**: Create the research/file discovery step component with required repository selection.

**Why**: This is the workflow step where repositories become required before file discovery.

**Confidence**: Medium

**Files to Create:**

- `components/features/research-step.tsx` - Research step component

**Changes:**

- Create `ResearchStep` component accepting `featureRequest` and `projectId` props
- Fetch current repository associations using `useFeatureRequestRepositories`
- Create form with `repositoryIds` field and required validation schema
- Initialize form with current associations (pre-populated)
- Add "Start File Discovery" button disabled until repositories selected
- On selection change, persist to junction table

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Pre-populated with existing repository associations
- [ ] Required validation prevents proceeding without selection
- [ ] Selection changes persist to junction table
- [ ] File discovery button disabled when no repositories selected
- [ ] All validation commands pass

---

### Step 22: Integrate Research Step into Workflow Page

**What**: Replace the research step placeholder with the ResearchStep component.

**Why**: Connects the repository selection requirement into the workflow.

**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Integrate ResearchStep

**Changes:**

- Import `ResearchStep` component
- Add conditional rendering for `currentStep === 'research'`
- Render `ResearchStep` with `featureRequest` and `projectId` props

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Research step renders ResearchStep component
- [ ] Component receives required props
- [ ] All validation commands pass

---

### Step 23: Update Components That Use Edit Dialog

**What**: Update components rendering EditFeatureRequestDialog to pass projectId.

**Why**: The edit dialog now requires projectId.

**Confidence**: High

**Files to Modify:**

- Search for and update all usages of `EditFeatureRequestDialog`

**Changes:**

- Find all components that render `EditFeatureRequestDialog`
- Add `projectId` prop to each usage

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All EditFeatureRequestDialog usages pass projectId
- [ ] No TypeScript errors for missing required prop
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Database migration generated and applies cleanly
- [ ] Application starts without errors (`pnpm electron:dev`)
- [ ] Creating a feature request with repository selection persists associations
- [ ] Editing a feature request loads and saves repository associations
- [ ] Research step displays repository selector with required validation
- [ ] Research step persists selection changes to junction table
- [ ] File discovery button is disabled until repositories are selected

## Notes

- The MultiSelectField component design should consider UX for typical 1-5 repository selections per project
- The research step mutations should use optimistic updates for better UX when toggling selections
- Consider adding a visual indicator showing which repositories have been scanned
- The junction table approach allows for future extension (e.g., scan results per repository-feature combination)
- Cache invalidation should ensure UI consistency when associations change
- Migration must run before testing IPC handlers - restart Electron app to trigger migrations
