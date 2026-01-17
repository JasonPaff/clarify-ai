# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| **Step** | 2 - AI-Powered File Discovery |
| **Status** | Completed |
| **Started** | 2026-01-17 |
| **Duration** | ~45 seconds |

## Input: Refined Feature Request

The repositories feature data layer requires implementing the complete database-to-UI data flow for managing code repository associations within projects, enabling users to link local filesystem directories to their Clarify AI projects for context-aware AI analysis. This implementation should follow the established patterns already present in the codebase, starting with a new Drizzle schema file at `db/schema/repositories.schema.ts` that defines a repositories table with the standard fields (id as integer primary key, createdAt and updatedAt as text timestamps), plus project-specific fields including a foreign key reference to the projects table, the local filesystem path to the repository, a display name, and potentially metadata fields for tracking repository state such as last scanned timestamp or file count. The schema should include appropriate indexes for efficient querying by projectId since repositories will primarily be fetched in the context of a specific project. A corresponding repository class should be created at `db/repositories/repositories.repository.ts` following the existing repository pattern, providing methods for CRUD operations (create, findById, findByProjectId, update, delete) with proper TypeScript types inferred from the Drizzle schema using `$inferSelect` and `$inferInsert`. The Electron IPC layer needs a new `repositories.handlers.ts` file in `electron/ipc/` that exposes these repository operations to the renderer process, with corresponding channel constants added to `electron/ipc/channels.ts` following the existing naming conventions. On the renderer side, TanStack Query hooks should be created using the query key factory pattern from `@lukemorales/query-key-factory` to provide reactive data fetching with proper cache invalidation, enabling components to easily fetch repositories for a project, create new associations via file system dialogs, update repository metadata, and remove associations while maintaining UI consistency through automatic query invalidation on mutations.

## Discovery Prompt Sent

```
I need to discover all files relevant to implementing a "repositories feature data layer" for the Clarify AI project.

[Refined feature request as shown above]

## Discovery Requirements

1. **Reference Files (Critical)** - Existing implementations to follow as patterns
2. **Integration Points (High)** - Files that need modification
3. **Type Definitions (Medium)** - Type files that may need updates
4. **UI Components (Medium)** - Existing components to reference

For each file discovered, provide: Full file path, Why it's relevant, Priority level
Use "very thorough" exploration to ensure comprehensive coverage.
```

## Full Agent Response

### Comprehensive Discovery Report: Repositories Feature Data Layer

---

## DISCOVERED FILES BY CATEGORY

### 1. REFERENCE FILES (Critical) - Existing Patterns to Follow

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `db/schema/projects.schema.ts` | Critical | Template for creating repositories.schema.ts. Shows Drizzle sqliteTable definition pattern, field structure, index creation, type exports |
| `db/repositories/projects.repository.ts` | Critical | Template for creating repositories.repository.ts. Shows repository interface pattern with CRUD methods, function factory pattern |
| `db/repositories/index.ts` | Critical | Must export repositories types and factory |
| `db/schema/index.ts` | Critical | Must be updated to export repositories.schema for Drizzle |

### 2. ELECTRON IPC LAYER (Critical)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `electron/ipc/channels.ts` | Critical | Central IPC channel registry. Must add `db.repositories` object |
| `electron/ipc/projects.handlers.ts` | Critical | Template for repositories.handlers.ts |
| `electron/ipc/index.ts` | Critical | Central handler registration hub. Must register repositories handlers |
| `electron/ipc/fs.handlers.ts` | High | Shows secure file system operations with path validation |
| `electron/ipc/dialog.handlers.ts` | High | Shows `openDirectory()` handler pattern for repository path selection |

### 3. ELECTRON PRELOAD & TYPE DEFINITIONS (Critical)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `electron/preload.ts` | Critical | Exposes IPC APIs to renderer. Must add repositories to db property |
| `types/electron.d.ts` | Critical | TypeScript global definition for window.electronAPI. Must mirror preload |

### 4. HOOKS & REACT QUERY (High)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `hooks/queries/use-projects.ts` | High | Template for repositories query hooks. Shows TanStack React Query patterns |
| `lib/queries/projects.ts` | High | Query key factory pattern to follow |
| `lib/queries/index.ts` | High | Must merge repositoryKeys into queries export |
| `hooks/useElectron.ts` | High | Shows useElectronDb() pattern. Must extend with repositories |

### 5. DATABASE INITIALIZATION (High)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `db/index.ts` | High | Database initialization and connection reference |
| `drizzle.config.ts` | High | Configuration for Drizzle Kit migrations |
| `drizzle/0000_flippant_ted_forrester.sql` | Medium | Shows generated SQL format reference |

### 6. VALIDATION & FORMS (Medium)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `lib/validations/project.ts` | Medium | Zod schema validation patterns reference |
| `lib/forms/form-hook.ts` | Medium | TanStack React Form setup reference |

### 7. UI COMPONENTS (Medium)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `components/projects/project-tabs.tsx` | Medium | Routes to repositories page, shows tab navigation |
| `components/projects/delete-project-dialog.tsx` | Medium | AlertDialog pattern for destructive actions reference |
| `components/projects/new-project-dialog.tsx` | Medium | Dialog pattern with form submission reference |
| `components/projects/create-project-form.tsx` | Medium | Form implementation reference |

### 8. PAGES & ROUTING (High)

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `app/(app)/projects/[projectId]/repositories/page.tsx` | High | Implementation target - currently placeholder |
| `app/(app)/projects/[projectId]/repositories/route-type.ts` | Medium | Type-safe route definition already set up |
| `app/(app)/projects/[projectId]/features/page.tsx` | Medium | Similar placeholder structure reference |
| `app/(app)/projects/page.tsx` | Medium | Full list page implementation reference |

### 9. OTHER REFERENCES

| File Path | Priority | Relevance |
|-----------|----------|-----------|
| `types/component-types.ts` | Medium | Global type declarations reference |
| `lib/utils.ts` | Low | Class name merging utility |
| `components/providers/query-provider.tsx` | Medium | TanStack React Query client setup |
| `electron/main.ts` | High | App initialization flow reference |

---

## FILE VALIDATION RESULTS

All discovered files exist in the codebase:

| File | Exists | Accessible |
|------|--------|------------|
| db/schema/projects.schema.ts | ✅ | ✅ |
| db/repositories/projects.repository.ts | ✅ | ✅ |
| db/repositories/index.ts | ✅ | ✅ |
| db/schema/index.ts | ✅ | ✅ |
| electron/ipc/channels.ts | ✅ | ✅ |
| electron/ipc/projects.handlers.ts | ✅ | ✅ |
| electron/ipc/index.ts | ✅ | ✅ |
| electron/preload.ts | ✅ | ✅ |
| types/electron.d.ts | ✅ | ✅ |
| hooks/queries/use-projects.ts | ✅ | ✅ |
| lib/queries/projects.ts | ✅ | ✅ |
| lib/queries/index.ts | ✅ | ✅ |
| hooks/useElectron.ts | ✅ | ✅ |
| db/index.ts | ✅ | ✅ |
| lib/validations/project.ts | ✅ | ✅ |
| app/(app)/projects/[projectId]/repositories/page.tsx | ✅ | ✅ |

---

## DISCOVERY STATISTICS

| Metric | Value |
|--------|-------|
| **Total Files Discovered** | 26 |
| **Critical Priority** | 9 |
| **High Priority** | 9 |
| **Medium Priority** | 7 |
| **Low Priority** | 1 |
| **Files to Create** | 4 (new schema, repository, handlers, hooks) |
| **Files to Modify** | 8 (channels, indexes, preload, types, etc.) |
| **Reference Files** | 14 |

---

## IMPLEMENTATION ORDER RECOMMENDATION

1. **Database Layer** (Foundation):
   - Create `db/schema/repositories.schema.ts`
   - Update `db/schema/index.ts`
   - Run `pnpm db:generate`
   - Create `db/repositories/repositories.repository.ts`
   - Update `db/repositories/index.ts`

2. **Electron IPC Layer**:
   - Update `electron/ipc/channels.ts`
   - Create `electron/ipc/repositories.handlers.ts`
   - Update `electron/ipc/index.ts`

3. **Type & Preload Layer**:
   - Update `electron/preload.ts`
   - Update `types/electron.d.ts`

4. **React Query & Hooks**:
   - Create `lib/queries/repositories.ts`
   - Update `lib/queries/index.ts`
   - Create `hooks/queries/use-repositories.ts`
   - Extend `hooks/useElectron.ts`

5. **Validation**:
   - Create `lib/validations/repository.ts`

6. **UI Implementation**:
   - Implement `app/(app)/projects/[projectId]/repositories/page.tsx`
   - Create repository components

7. **Migration**:
   - Run `pnpm db:migrate`

---

**MILESTONE:STEP_2_COMPLETE**
