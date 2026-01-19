# Step 2: AI-Powered File Discovery

## Metadata

| Field | Value |
|-------|-------|
| Step | 2 - File Discovery |
| Status | Completed |
| Started | 2026-01-18 |
| Duration | ~45 seconds |
| Files Discovered | 28+ relevant files |
| Directories Explored | 12 |

## Refined Request Input

Add repository selection to the feature request workflow by implementing a junction table `feature-request-repositories` in the Drizzle schema that links feature requests to repositories through `featureRequestId` and `repositoryId` foreign keys, enabling many-to-many relationships while maintaining referential integrity with cascade deletes. Extend the feature request creation and editing forms to include an optional multi-select field for "Target repositories" that queries available repositories for the current project. On the file discovery step, render a repository selector component that is pre-populated with previously selected repositories, making this selection required. Changes at file discovery persist back to the feature request.

## Discovery Analysis

### New Files to Create (8 files)

| File Path | Priority | Purpose |
|-----------|----------|---------|
| `db/schema/feature-request-repositories.schema.ts` | Critical | Junction table schema for many-to-many relationship |
| `db/repositories/feature-request-repositories.repository.ts` | Critical | Repository pattern for junction table CRUD |
| `electron/ipc/feature-request-repositories.handlers.ts` | Critical | IPC handlers for repository associations |
| `hooks/queries/use-feature-request-repositories.ts` | Critical | TanStack Query hooks for fetching/mutating associations |
| `lib/queries/feature-request-repositories.ts` | Critical | Query key factory for cache management |
| `lib/validations/feature-request-repositories.ts` | High | Zod validation (at least one required for research step) |
| `components/ui/form/multi-select-field.tsx` | High | Multi-select field component with checkboxes |
| `components/features/repository-selector.tsx` | High | Repository selector for research step |

### Files to Modify (16 files)

| File Path | Priority | Change Required |
|-----------|----------|-----------------|
| `electron/ipc/channels.ts` | Critical | Add `db.featureRequestRepositories` channels |
| `electron/ipc/register-handlers.ts` | Critical | Register new handlers |
| `electron/preload.ts` | Critical | Expose new IPC methods |
| `types/electron.d.ts` | Critical | Add type definitions for new methods |
| `hooks/useElectron.ts` | Critical | Add `featureRequestRepositories` to `useElectronDb()` |
| `db/index.ts` | Critical | Import and add new schema |
| `drizzle.config.ts` | Critical | Add schema file to array |
| `lib/queries/index.ts` | High | Merge new query keys |
| `lib/validations/feature-request.ts` | High | Extend for optional repository IDs |
| `components/features/create-feature-request-form.tsx` | High | Add optional multi-select |
| `components/features/edit-feature-request-form.tsx` | High | Add optional multi-select |
| `components/features/new-feature-request-dialog.tsx` | High | Handle repository associations on create |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | High | Implement research step with selector |
| `lib/forms/form-hook.ts` | High | Register MultiSelectField component |

### Reference Pattern Files (12 files)

| File Path | Priority | Pattern Reference |
|-----------|----------|-------------------|
| `db/schema/feature-requests.schema.ts` | Medium | Schema structure, types |
| `db/schema/repositories.schema.ts` | Medium | Schema structure, foreign keys |
| `db/schema/repository-overviews.schema.ts` | Medium | Cascade delete pattern |
| `db/repositories/repositories.repository.ts` | Medium | Repository implementation |
| `db/repositories/feature-requests.repository.ts` | Medium | Repository implementation |
| `electron/ipc/repositories.handlers.ts` | Medium | Handler structure |
| `hooks/queries/use-repositories.ts` | Medium | Query hook patterns |
| `hooks/queries/use-feature-requests.ts` | Medium | Query hook patterns |
| `lib/queries/repositories.ts` | Medium | Query key factory |
| `components/features/workflow-steps.tsx` | Medium | WORKFLOW_STEPS definition |
| `components/ui/form/checkbox-field.tsx` | Low | Field component pattern |
| `components/ui/form/select-field.tsx` | Low | Selection field pattern |

## Key Patterns Discovered

### Schema Pattern
- `id` (integer primary key with autoIncrement)
- `createdAt`, `updatedAt` with SQL CURRENT_TIMESTAMP defaults
- Foreign keys use `references()` with `onDelete: 'cascade'`

### Repository Pattern
- Export interface and factory function (`create*Repository`)
- Standard CRUD: `create`, `getById`, `getByForeignKey`, `update`, `delete`
- Update method always includes `updatedAt: sql\`(CURRENT_TIMESTAMP)\``

### IPC Handler Pattern
- Registered via `registerAllHandlers` in `register-handlers.ts`
- Each handler exports `register*Handlers` function taking repository as parameter

### Query Hook Pattern
- Use `useQuery`/`useMutation` from TanStack Query
- Query keys from `@lukemorales/query-key-factory`
- Mutations invalidate relevant queries on success

### Form Field Pattern
- Base UI primitives wrapped with CVA variants
- Access field state via `useFieldContext` hook
- Use `TanStackFieldRoot` as wrapper

## Architecture Integration Points

1. **Database Layer**: New schema → `db/index.ts` + `drizzle.config.ts`
2. **IPC Layer**: Channels → handlers → preload → types
3. **Query Layer**: Query keys → hooks → merge in index
4. **UI Layer**: Field components → forms → registered in form-hook

## Validation Results

- Minimum Files: PASS (28 files discovered, requirement was 5)
- Categorization: PASS (Critical/High/Medium/Low priorities assigned)
- Coverage: PASS (All architectural layers covered)
- Patterns: PASS (Existing patterns identified for consistency)
