# Step 2: File Discovery

**Status**: Completed
**Start Time**: 2026-01-18T00:00:45.000Z
**Duration**: ~45 seconds

## Input

### Refined Feature Request

Users should be able to mark their favorite projects with a star icon displayed next to each project name in the projects list page, and favorited projects should appear in a dedicated "Favorites" section in the sidebar navigation positioned above the main "Projects" link, showing all starred projects without any display limit. [Full refined request from Step 1]

## Discovery Statistics

| Priority | Count | Description |
|----------|-------|-------------|
| Critical | 10 | Must be modified to implement the feature |
| High | 2 | Likely need modification |
| Medium | 6 | May need reference or minor updates |
| Low | 2 | For context only |
| **Total** | **20** | Files identified |

## Discovered Files

### Critical Priority (Must Modify)

#### 1. db/schema/projects.schema.ts
**Reason**: Must add `isFavorited` boolean column to the projects table to persist favorite state
**Key Contents**: Defines SQLite table with columns: id, name, description, createdAt, updatedAt. Exports Project and NewProject types.

#### 2. db/repositories/projects.repository.ts
**Reason**: May need a dedicated method like `getFavorited()` to fetch only favorited projects for the sidebar
**Key Contents**: Repository pattern with methods: create, delete, getAll, getById, update. Returns Project types.

#### 3. electron/ipc/channels.ts
**Reason**: May need new channel like `db:projects:getFavorited` if adding a dedicated endpoint
**Key Contents**: Defines all IPC channel constants for db.projects, app, dialog, fs, store, apiKeys, ai.

#### 4. electron/ipc/projects.handlers.ts
**Reason**: May need new handler for `getFavorited` endpoint
**Key Contents**: Registers IPC handlers for projects CRUD operations using ProjectsRepository.

#### 5. electron/preload.ts
**Reason**: Must update ElectronAPI interface and implementation if adding new getFavorited method
**Key Contents**: Defines ElectronAPI interface with db.projects methods. Uses contextBridge.

#### 6. types/electron.d.ts
**Reason**: Must update ElectronAPI type definition to match preload.ts
**Key Contents**: Re-exports database types. Declares global Window.electronAPI type.

#### 7. hooks/queries/use-projects.ts
**Reason**: Must add useFavoriteProject mutation hook; may add useFavoritedProjects query hook
**Key Contents**: TanStack Query hooks: useProjects, useProject, useCreateProject, useUpdateProject, useDeleteProject.

#### 8. components/layout/sidebar-nav.tsx
**Reason**: Must add "Favorites" section above the "Projects" link
**Key Contents**: Renders main nav items and bottom nav items. Uses NavItemLink component.

#### 9. components/projects/project-card.tsx
**Reason**: Must add interactive star icon to toggle favorite state
**Key Contents**: Renders project card with folder icon, name, description, feature count.

#### 10. app/(app)/projects/page.tsx
**Reason**: Must pass favorite-related props and handlers to ProjectCard components
**Key Contents**: Projects list page with useProjects hook, ProjectCard grid, NewProjectDialog.

### High Priority (Likely Modify)

#### 11. lib/queries/projects.ts
**Reason**: May need additional query key for favorited projects list
**Key Contents**: Query key factory with list and detail keys.

#### 12. hooks/useElectron.ts
**Reason**: useElectronDb hook may need update if adding new project method
**Key Contents**: Hooks for accessing Electron API.

### Medium Priority (May Reference)

#### 13. db/index.ts
**Reason**: Context on database initialization
**Key Contents**: Initializes SQLite database with better-sqlite3 and Drizzle ORM.

#### 14. electron/ipc/register-handlers.ts
**Reason**: Context on handler registration
**Key Contents**: Registers all IPC handlers.

#### 15. components/layout/sidebar.tsx
**Reason**: Contains SidebarNav which will be modified
**Key Contents**: Main Sidebar component.

#### 16. components/layout/sidebar-context.tsx
**Reason**: Context on sidebar collapsed state
**Key Contents**: Context provider for sidebar state.

#### 17. lib/validations/project.ts
**Reason**: Reference for validation patterns
**Key Contents**: Zod schemas for project validation.

#### 18. components/ui/icon-button.tsx
**Reason**: Will be used for star toggle button
**Key Contents**: IconButton component.

### Low Priority (For Context)

#### 19. lib/queries/index.ts
**Reason**: Merges all query keys
**Key Contents**: Merges query keys using mergeQueryKeys.

#### 20. components/ui/tooltip.tsx
**Reason**: May be used for star icon tooltip
**Key Contents**: Tooltip component using Base UI primitives.

## Architecture Insights

### Key Patterns Discovered

1. **Database Layer**: Drizzle ORM with SQLite. Schema files define tables and export types via `$inferSelect`/`$inferInsert`. Repositories follow a factory pattern.

2. **IPC Communication**: Three-layer architecture:
   - `channels.ts` - channel constants
   - `*.handlers.ts` - handlers using repositories
   - `preload.ts` - API exposure via contextBridge

3. **Type Safety**: Types flow from schema -> repository -> IPC -> preload -> types/electron.d.ts -> hooks

4. **TanStack Query**: Query hooks use query key factories. Mutations invalidate keys on success.

5. **Sidebar Navigation**: Uses context for collapsed state. Nav items as arrays with icon, href, label.

### Integration Points

1. **Schema Change**: Adding `isFavorited` column requires migration (`pnpm db:generate`)
2. **Favorite Toggle**: Can use existing `update` method with `{ isFavorited: !current }`
3. **Sidebar Favorites**: Needs dedicated query for favorited projects
4. **Star Icon**: lucide-react has `Star` icon with fill support
