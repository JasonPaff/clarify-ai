# Step 2: File Discovery

## Metadata

- **Step**: 2 - File Discovery
- **Started**: 2026-01-17T12:02:00Z
- **Completed**: 2026-01-17T12:04:00Z
- **Status**: Completed
- **Duration**: ~120 seconds

## Input

### Refined Request

Implement a complete data layer for the feature requests functionality, which currently has routing infrastructure at `app/(app)/projects/[projectId]/features/` but lacks any database persistence or data access mechanisms. This implementation requires creating a new Drizzle ORM schema file at `db/schema/feature-requests.schema.ts` that defines a feature_requests table following the established conventions with integer primary key id, createdAt and updatedAt text timestamps, a foreign key reference to the projects table via projectId, and fields to capture the feature request content including title, description, status (to track progression through the Refine, Research, Plan workflow stages), and any AI-generated outputs from each orchestration step. The schema should include appropriate indexes for projectId since feature requests will frequently be queried by their parent project. A repository implementation at `db/repositories/feature-requests.repository.ts` must provide the data access abstraction following the patterns established by the existing projects and repositories implementations, exposing methods for create, findById, findByProjectId, update, and delete operations. New IPC handlers need to be created at `electron/ipc/feature-requests.handlers.ts` to expose these repository methods to the renderer process, with corresponding channel constants added to `electron/ipc/channels.ts` and handler registration in the index file. The renderer-side integration requires TanStack Query hooks at `hooks/queries/use-feature-requests.ts` that leverage the IPC database methods via `useElectronDb()`, with query keys defined using `createQueryKeys` in `lib/queries/` to enable proper cache invalidation when mutations occur. Finally, Zod validation schemas should be added at `lib/validations/feature-request.validations.ts` to validate form inputs for creating and updating feature requests, ensuring type safety throughout the entire data flow from user input through IPC to database persistence and back.

## Discovery Results

### Summary

- **Directories Explored**: 8
- **Candidate Files Examined**: 35
- **Highly Relevant Files**: 18
- **Supporting Files**: 10

## Discovered Files

### Critical Priority (Must Modify or Use as Template)

#### Files to Modify

| File Path | Relevance |
|-----------|-----------|
| `electron/ipc/channels.ts` | Must add `db.featureRequests` channel constants for all CRUD operations |
| `electron/ipc/register-handlers.ts` | Must import and register feature-requests handlers |
| `electron/preload.ts` | Must expose featureRequests API to renderer via contextBridge |
| `types/electron.d.ts` | Must add featureRequests types to ElectronAPI interface |
| `hooks/useElectron.ts` | Must extend useElectronDb() to include featureRequests operations |
| `db/index.ts` | Must import feature-requests schema for Drizzle schema composition |

#### Template/Reference Files (Critical Patterns)

| File Path | Relevance |
|-----------|-----------|
| `db/schema/repositories.schema.ts` | Template for feature-requests.schema.ts - shows foreign key pattern, indexes, type exports |
| `db/repositories/repositories.repository.ts` | Template for feature-requests.repository.ts - shows getByProjectId, CRUD methods |
| `electron/ipc/repositories.handlers.ts` | Template for feature-requests.handlers.ts - shows IPC handler registration pattern |
| `hooks/queries/use-repositories.ts` | Template for use-feature-requests.ts - shows TanStack Query hooks with cache invalidation |
| `lib/queries/repositories.ts` | Template for feature-requests query keys using createQueryKeys factory |
| `lib/validations/repository.ts` | Template for Zod validation schemas |

### High Priority (Supporting/Integration)

| File Path | Relevance |
|-----------|-----------|
| `db/schema/projects.schema.ts` | Reference for foreign key target table (projectId references projects.id) |
| `db/repositories/projects.repository.ts` | Additional repository pattern reference |
| `electron/ipc/projects.handlers.ts` | Additional IPC handler pattern reference |
| `hooks/queries/use-projects.ts` | Additional TanStack Query hooks reference |
| `lib/queries/projects.ts` | Additional query key factory reference |
| `lib/validations/project.ts` | Additional Zod schema reference |
| `drizzle.config.ts` | Drizzle Kit config - references db/schema/index.ts |
| `electron/main.ts` | App initialization flow - shows handler registration sequence |

### Medium Priority (Context/Related Files)

| File Path | Relevance |
|-----------|-----------|
| `app/(app)/projects/[projectId]/features/page.tsx` | UI page that will consume feature request data |
| `app/(app)/projects/[projectId]/features/route-type.ts` | Route type definition with projectId param |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Individual feature workflow page |
| `app/(app)/projects/[projectId]/features/[featureId]/route-type.ts` | Route type with featureId and projectId params |
| `components/features/workflow-steps.tsx` | Workflow step definitions (Entry, Refine, Research, Plan) |
| `lib/forms/form-hook.ts` | TanStack Form hook configuration |
| `drizzle/0000_faulty_madripoor.sql` | Existing migration file - shows SQL generation format |

### Low Priority (Nice to Have Context)

| File Path | Relevance |
|-----------|-----------|
| `app/(app)/projects/[projectId]/layout.tsx` | Project layout using useProject hook |
| `components/ui/form/text-field.tsx` | Form field component reference |
| `components/ui/form/textarea-field.tsx` | Form field component reference |
| `components/ui/form/select-field.tsx` | Form field component for status dropdown |

## Architecture Insights

### Key Patterns Discovered

1. **Schema Pattern**: Tables use integer primary key with autoIncrement, text timestamps with `CURRENT_TIMESTAMP` default, and the `$inferInsert`/`$inferSelect` pattern for type inference

2. **Repository Pattern**: Factory function that takes `DrizzleDatabase` and returns object with CRUD methods. Updates always set `updatedAt: sql\`(CURRENT_TIMESTAMP)\``

3. **IPC Pattern**:
   - Channels defined as nested const object in `channels.ts`
   - Handlers use `ipcMain.handle()` with typed event parameter
   - Preload exposes via `ipcRenderer.invoke()` with contextBridge

4. **Query Pattern**:
   - Query keys use `@lukemorales/query-key-factory`
   - Hooks use `useElectronDb()` to get API access
   - Mutations invalidate using `queryKey._def` for partial matches

5. **Validation Pattern**: Shared field schemas for DRY, separate create/update schemas

### Existing Similar Functionality

The repositories data layer provides an exact template - it has:
- Foreign key to projects (projectId)
- getByProjectId query method
- Full CRUD operations
- TanStack Query hooks with cache invalidation
- Zod validation schemas

### Integration Points Identified

1. **db/index.ts**: Must add `import * as featureRequestsSchema from './schema/feature-requests.schema'` and merge into schema object

2. **drizzle.config.ts**: References `./db/schema/index.ts` which doesn't exist - may need to create a barrel export

3. **electron/ipc/register-handlers.ts**: Must add:
   - Import for `createFeatureRequestsRepository`
   - Import for `registerFeatureRequestsHandlers`
   - Call to register handlers

4. **hooks/useElectron.ts**: Must add `featureRequests` object to `useElectronDb()` return

## Validation Results

- **Minimum Files Requirement**: 28 files discovered (exceeds minimum of 3)
- **AI Analysis Quality**: Comprehensive reasoning provided for each file
- **File Path Validation**: All paths verified to exist
- **Smart Categorization**: Files properly categorized by priority
- **Comprehensive Coverage**: All major components covered (schema, repository, IPC, hooks, validations)

---

**MILESTONE:STEP_2_COMPLETE**
