# Step 2: File Discovery

**Started**: 2026-01-20T12:02:00Z
**Completed**: 2026-01-20T12:03:30Z
**Duration**: ~90 seconds
**Status**: Completed

## Refined Request Used as Input

Implement Phase 1 of the feature request workflow by creating four new database schemas in the db/schema/ directory following the established Drizzle ORM patterns with SQLite. (Full text in Step 1 log)

## AI File Discovery Analysis

### Analysis Summary

- Explored 5 directories
- Examined 35 candidate files
- Found 14 highly relevant files
- Identified 10 supporting files

## Discovered Files

### Critical (Files that MUST be modified or serve as essential reference)

| File Path | Action | Reason for Relevance |
|-----------|--------|---------------------|
| `db/schema/feature-requests.schema.ts` | Modify | Existing schema that needs updating with `archivedAt`, `staleSteps` fields and expanded status enum |
| `db/index.ts` | Modify | Database initialization - must import and register new schemas |
| `drizzle.config.ts` | Modify | Must add new schema file paths for migration generation |
| `types/electron.ts` | Modify | Must export new types for renderer use (`FeatureRequestRun`, `StepConfiguration`, `FeatureRequestContextFile`) |

### High Priority (Files needed for implementation patterns)

| File Path | Action | Reason for Relevance |
|-----------|--------|---------------------|
| `db/schema/repositories.schema.ts` | Reference | Reference pattern for schema with foreign keys and indexes |
| `db/schema/repository-overviews.schema.ts` | Reference | Reference pattern for schema with unique constraints and model tracking |
| `db/schema/feature-request-repositories.schema.ts` | Reference | Reference pattern for junction table with composite indexes |
| `db/repositories/feature-requests.repository.ts` | Reference | Pattern for repository implementation - may need updates for new fields |
| `db/repositories/repository-overviews.repository.ts` | Reference | Advanced repository pattern with upsert operation |
| `electron/ipc/channels.ts` | Reference | IPC channel naming conventions (will need new channels for new schemas) |
| `electron/ipc/register-handlers.ts` | Reference | Pattern for registering new repository handlers |
| `electron/preload.ts` | Reference | Pattern for exposing new database operations to renderer |
| `lib/validations/feature-request.ts` | Modify | Must update status enum to include new workflow states |

### Medium Priority (Files for reference or context)

| File Path | Action | Reason for Relevance |
|-----------|--------|---------------------|
| `db/schema/projects.schema.ts` | Reference | Base schema pattern with indexes |
| `db/repositories/projects.repository.ts` | Reference | Simple repository pattern |
| `electron/ipc/feature-requests.handlers.ts` | Reference | Pattern for feature request IPC handlers |
| `hooks/useElectron.ts` | Reference | Pattern for useElectronDb hook (will need updates) |
| `hooks/queries/use-feature-requests.ts` | Reference | TanStack Query pattern for feature requests |
| `lib/queries/feature-requests.ts` | Reference | Query key pattern for feature requests |
| `lib/queries/index.ts` | Reference | Query key merging pattern |
| `drizzle/0005_white_night_thrasher.sql` | Reference | Latest migration showing SQL patterns |

### Low Priority (May need updates in Phase 2)

| File Path | Action | Reason for Relevance |
|-----------|--------|---------------------|
| `db/repositories/feature-request-repositories.repository.ts` | Reference | Junction table repository pattern |
| `db/repositories/repositories.repository.ts` | Reference | Basic repository pattern |
| `electron/ipc/feature-request-repositories.handlers.ts` | Reference | Junction table handler pattern |

## Architecture Insights

### Key Patterns Discovered

1. **Schema Pattern**: All schemas use:
   - `integer('id').primaryKey({ autoIncrement: true })` for primary key
   - `text('created_at').default(sql\`(CURRENT_TIMESTAMP)\`).notNull()` for timestamps
   - `text('updated_at').default(sql\`(CURRENT_TIMESTAMP)\`).notNull()` for updated timestamps
   - Foreign keys use `.references(() => table.id, { onDelete: 'cascade' })`
   - Type exports use `$inferSelect` and `$inferInsert`

2. **Repository Pattern**:
   - Interface defines method signatures
   - Factory function `createXxxRepository(db: DrizzleDatabase)` creates repository instance
   - Standard CRUD operations: `create`, `getById`, `update`, `delete`
   - Updates automatically set `updatedAt: sql\`(CURRENT_TIMESTAMP)\``

3. **IPC Integration**:
   - Channels defined in `electron/ipc/channels.ts` under `IpcChannels.db.*`
   - Handlers in `electron/ipc/*.handlers.ts` files
   - Registered in `register-handlers.ts`
   - Types exposed in `types/electron.ts` for renderer access
   - `preload.ts` exposes API via `contextBridge.exposeInMainWorld`

4. **Index Conventions**:
   - Foreign key columns always have indexes
   - Commonly queried fields (status, timestamps) have indexes
   - Unique constraints use `uniqueIndex()`
   - Index naming: `tablename_columnname_idx`

### Existing Similar Functionality

- `repository-overviews.schema.ts` stores model/prompt configuration similar to what `step-configurations` will need
- `feature-request-repositories.schema.ts` provides junction table pattern for `feature-request-context-files`
- Status field on `feature-requests` already uses text with default - needs expansion

### Integration Points Identified

1. **Database Index** (`db/index.ts`): New schemas must be imported and added to the combined schema object
2. **Drizzle Config**: New schema paths must be added for migration generation
3. **IPC Channels**: New channels needed under `IpcChannels.db.*` namespace
4. **Type Exports**: New types need export in `types/electron.ts`
5. **Validation Schemas**: Status enum in `lib/validations/feature-request.ts` needs update

## Files to Create

| File Path | Purpose |
|-----------|---------|
| `db/schema/feature-request-runs.schema.ts` | Track AI execution runs per workflow step |
| `db/schema/step-configurations.schema.ts` | Per-step model and prompt configuration overrides |
| `db/schema/feature-request-context-files.schema.ts` | File attachments for feature requests |
| `db/repositories/feature-request-runs.repository.ts` | Repository for run history CRUD |
| `db/repositories/step-configurations.repository.ts` | Repository for step config CRUD |
| `db/repositories/feature-request-context-files.repository.ts` | Repository for context files CRUD |

## File Path Validation Results

All discovered file paths validated to exist in the codebase:
- db/schema/feature-requests.schema.ts - EXISTS
- db/index.ts - EXISTS
- drizzle.config.ts - EXISTS
- types/electron.ts - EXISTS
- lib/validations/feature-request.ts - EXISTS
- All reference files verified to exist

## Discovery Statistics

- **Total files discovered**: 24
- **Critical files**: 4
- **High priority files**: 9
- **Medium priority files**: 8
- **Low priority files**: 3
- **New files to create**: 6 (3 schemas + 3 repositories)

---

**MILESTONE:STEP_2_COMPLETE**
