# Step 2: File Discovery

## Metadata
- **Started**: 2026-01-17T00:01:00Z
- **Completed**: 2026-01-17T00:03:00Z
- **Status**: Success

## Input: Refined Feature Request
The repositories feature UI should provide a complete interface for managing code repositories associated with a project within the Clarify AI desktop application. This involves building out the repository management pages located at `app/(app)/projects/[projectId]/repositories/` to display a list of repositories linked to the current project, with each repository showing its name, local file path, and last analyzed timestamp. The UI should use Base UI primitives from `@base-ui/react` wrapped with CVA variants for consistent styling, including components for the repository list view, individual repository cards or rows, and empty state messaging when no repositories exist. A form for adding new repositories should utilize the `useAppForm` hook from `lib/forms/form-hook.ts` with the pre-built `TextField` component for the repository name and a path selector that integrates with the existing dialog IPC handlers in `electron/ipc/dialog.handlers.ts` to open a native folder picker for selecting the local repository directory. Data fetching should be implemented using TanStack Query hooks in `hooks/queries/` that communicate with the repository CRUD handlers in `electron/ipc/repositories.handlers.ts`, with proper query key definitions in `lib/queries/` for cache management and invalidation. The interface should support editing repository details through an inline edit mode or modal form, deletion with confirmation dialogs, and navigation to individual repository detail pages at `app/(app)/projects/[projectId]/repositories/[repositoryId]/` if needed for viewing analysis results or triggering re-analysis. Loading states should use skeleton components from `components/skeletons/`, and error handling should leverage `QueryErrorBoundary` from `components/data/`. The UI must follow the existing patterns for type-safe routing using `next-typesafe-url` with Zod schemas in `route-type.ts` files, and all styling should use Tailwind CSS v4 utility classes with the project's CSS custom properties for theming support.

## Discovery Summary
- **Directories Explored**: 12
- **Files Examined**: 65+
- **Relevant Files Found**: 24 highly relevant + 18 supporting
- **Pattern Files Identified**: Multiple project component patterns to follow

## Discovered Files by Priority

### Critical Priority (Core Implementation)

| File | Relevance |
|------|-----------|
| `app/(app)/projects/[projectId]/repositories/page.tsx` | Main page file to be updated with repository management UI |
| `app/(app)/projects/[projectId]/repositories/route-type.ts` | Route type schema with projectId parameter |
| `hooks/queries/use-repositories.ts` | TanStack Query hooks (fully implemented) |
| `lib/validations/repository.ts` | Zod validation schemas for forms |
| `lib/queries/repositories.ts` | Query key factory for cache management |

### High Priority (Data Layer)

| File | Relevance |
|------|-----------|
| `db/schema/repositories.schema.ts` | Database schema (id, name, path, projectId, lastScannedAt, fileCount, etc.) |
| `db/repositories/repositories.repository.ts` | Repository pattern with CRUD operations |
| `electron/ipc/repositories.handlers.ts` | IPC handlers for repository operations |
| `hooks/useElectron.ts` | Electron API hooks (useElectronDb, useElectronDialog) |

### Medium Priority (Pattern Files)

| File | Pattern For |
|------|-------------|
| `components/projects/project-card.tsx` | RepositoryCard component |
| `components/projects/new-project-dialog.tsx` | NewRepositoryDialog |
| `components/projects/create-project-form.tsx` | CreateRepositoryForm |
| `components/projects/edit-project-dialog.tsx` | EditRepositoryDialog |
| `components/projects/edit-project-form.tsx` | EditRepositoryForm |
| `components/projects/delete-project-dialog.tsx` | DeleteRepositoryDialog |
| `components/projects/index.ts` | Export barrel file pattern |
| `app/(app)/projects/page.tsx` | Page structure with QueryErrorBoundary |
| `components/skeletons/projects-skeleton.tsx` | RepositoriesSkeleton |

### Medium Priority (UI Primitives)

| File | Usage |
|------|-------|
| `components/ui/dialog.tsx` | Dialog components |
| `components/ui/button.tsx` | Button with variants |
| `components/ui/card.tsx` | Card components |
| `components/ui/empty-state.tsx` | Empty state component |
| `components/ui/icon-button.tsx` | Icon buttons for actions |
| `components/ui/form/text-field.tsx` | TextField for name input |
| `components/data/query-error-boundary.tsx` | Error handling |
| `components/layout/page-header.tsx` | Section headers |

### Low Priority (Supporting Infrastructure)

| File | Usage |
|------|-------|
| `electron/ipc/channels.ts` | IPC channel constants |
| `electron/ipc/dialog.handlers.ts` | Dialog handlers (openDirectory) |
| `electron/preload.ts` | Preload script exposures |
| `types/electron.d.ts` | ElectronAPI type definitions |
| `types/component-types.ts` | Global component types |
| `lib/forms/form-hook.ts` | useAppForm hook |
| `lib/utils.ts` | cn() utility |
| `db/types.ts` | Type re-exports |

## Architecture Insights

### Existing Patterns Discovered

1. **Component Structure**: Dialog + Form separation pattern (e.g., `NewProjectDialog` wraps `CreateProjectForm`)

2. **Form Handling**: Forms use `useAppForm` with Zod validators:
   ```tsx
   <form.AppField name={'name'}>
     {(field) => <field.TextField label={'Name'} />}
   </form.AppField>
   ```

3. **Query Hooks**: TanStack Query with query key factories and `useElectronDb()` hook

4. **Dialog Pattern**: Base UI Dialog primitives with CVA variants

5. **Empty State Pattern**: EmptyState component with icon, title, description, action

6. **List Rendering**: CSS Grid with responsive columns

7. **Type-Safe Routing**: next-typesafe-url with Zod schemas

### Integration Points

1. **Folder Picker**: `useElectronDialog().openDirectory()` available for path selection
2. **Project Context**: projectId from route params for filtering repositories
3. **Cache Invalidation**: Mutations invalidate `repositoryKeys.byProject._def`

## Files to Create

Based on pattern analysis, the following new files should be created:

1. `components/repositories/repository-card.tsx`
2. `components/repositories/new-repository-dialog.tsx`
3. `components/repositories/create-repository-form.tsx`
4. `components/repositories/edit-repository-dialog.tsx`
5. `components/repositories/edit-repository-form.tsx`
6. `components/repositories/delete-repository-dialog.tsx`
7. `components/repositories/index.ts`
8. `components/skeletons/repositories-skeleton.tsx`

## Validation Results
- **Minimum Files Check**: PASS (24+ files discovered, minimum was 3)
- **Critical Files Found**: PASS (page.tsx, hooks, validations all found)
- **Pattern Files Found**: PASS (project components provide clear templates)
- **Infrastructure Files Found**: PASS (all IPC and type files exist)

---
*Step 2 completed successfully*
