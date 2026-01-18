# Implementation Plan: Project Favorites Feature

**Generated**: 2026-01-18
**Original Request**: As a user I would like to be able to tag my favorite projects so they are available on the sidebar for easy access

## Analysis Summary

- Feature request refined with project context and user clarifications
- Discovered 20 files across database, IPC, query, and component layers
- Generated 15-step implementation plan

## Refined Feature Request

Users should be able to mark their favorite projects with a star icon displayed next to each project name in the projects list page, and favorited projects should appear in a dedicated "Favorites" section in the sidebar navigation positioned above the main "Projects" link, showing all starred projects without any display limit. To implement this feature, the projects database schema in `db/schema/projects.schema.ts` needs to be extended with an `isFavorited` boolean column (defaulting to false) to persist the favorite state for each project. The sidebar navigation component (`components/layout/sidebar-nav.tsx`) requires a new "Favorites" section that displays all projects where `isFavorited` is true, positioned before the "Projects" link. The projects list page needs an interactive star icon (from lucide-react) next to each project name that toggles the favorite state when clicked, with the toggle action implemented as a TanStack Query mutation that updates the project's `isFavorited` status via an IPC handler. The existing repository pattern for database operations should be extended to include methods for updating a project's favorite status. TanStack Query's cache should be invalidated appropriately when the favorite state changes to ensure both the projects list and sidebar reflect the updated favorite status immediately. The star icon styling should use conditional Tailwind classes to visually distinguish between favorited (filled star) and non-favorited (outline star) states, maintaining consistency with the application's existing Base UI primitives and CVA-based component patterns. This feature allows users to quickly access their most-used projects from the sidebar without scrolling through the full projects list, improving navigation efficiency within the desktop application.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

- Add `isFavorited` boolean column to the projects database schema with a default value of false
- Create a new `useFavoriteProject` mutation hook that leverages the existing `update` IPC method
- Add a dedicated "Favorites" section to the sidebar navigation that displays all favorited projects above the main "Projects" link
- Implement an interactive star icon toggle in the ProjectCard component with optimistic updates
- No new IPC channels required since the existing `db:projects:update` handler supports partial updates including the new `isFavorited` field

## Prerequisites

- [ ] Ensure development environment is running (`pnpm electron:dev`)
- [ ] Verify database is accessible and migrations are working
- [ ] Confirm lucide-react is installed (already in dependencies with `Star` icon available)

## Implementation Steps

### Step 1: Add isFavorited Column to Projects Schema

**What**: Extend the projects database schema with a new `isFavorited` boolean column defaulting to false
**Why**: Persists the favorite state for each project in the database, allowing the UI to reflect favorites across sessions
**Confidence**: High

**Files to Modify:**
- `db/schema/projects.schema.ts` - Add isFavorited integer column (SQLite boolean)

**Changes:**
- Add `isFavorited` column using `integer('is_favorited')` with default value of 0 and notNull constraint
- Add index on `isFavorited` column for efficient querying of favorited projects

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Schema file compiles without TypeScript errors
- [ ] `isFavorited` field is present in `Project` and `NewProject` types via `$inferSelect`/`$inferInsert`
- [ ] All validation commands pass

---

### Step 2: Generate Database Migration

**What**: Generate a Drizzle migration for the new isFavorited column
**Why**: Creates the actual database column so the application can persist favorite states
**Confidence**: High

**Files Affected:**
- `drizzle/` - New migration file will be generated

**Changes:**
- Run Drizzle Kit to generate migration from schema changes

**Validation Commands:**
```bash
pnpm db:generate
```

**Success Criteria:**
- [ ] Migration file is generated in `drizzle/` directory

---

### Step 3: Add getFavorited Query Key to Projects Query Factory

**What**: Add a new query key definition for fetching favorited projects
**Why**: Enables TanStack Query to properly cache and invalidate favorited projects queries separately from the main list
**Confidence**: High

**Files to Modify:**
- `lib/queries/projects.ts` - Add `favorited` query key

**Changes:**
- Add `favorited` key to the `createQueryKeys` definition for favorited projects queries

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `projectKeys.favorited` is available and type-safe
- [ ] All validation commands pass

---

### Step 4: Add Repository Method for Fetching Favorited Projects

**What**: Add a `getFavorited` method to the projects repository for querying only favorited projects
**Why**: Provides an efficient way to fetch only favorited projects for the sidebar, avoiding filtering in the renderer
**Confidence**: High

**Files to Modify:**
- `db/repositories/projects.repository.ts` - Add getFavorited method

**Changes:**
- Add `getFavorited(): Array<Project>` to the `ProjectsRepository` interface
- Implement the method to query projects where `isFavorited` equals 1 (true)

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `getFavorited` method is available on the repository interface
- [ ] Method returns only projects where isFavorited is true
- [ ] All validation commands pass

---

### Step 5: Add IPC Channel and Handler for getFavorited

**What**: Add a new IPC channel and handler to expose the getFavorited repository method to the renderer
**Why**: Allows the frontend to efficiently query only favorited projects via IPC
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add getFavorited channel constant
- `electron/ipc/projects.handlers.ts` - Add getFavorited handler

**Changes:**
- Add `getFavorited: 'db:projects:getFavorited'` to IpcChannels.db.projects
- Add ipcMain.handle for the getFavorited channel that calls projectsRepository.getFavorited()

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] IpcChannels.db.projects.getFavorited constant exists
- [ ] Handler is registered in registerProjectsHandlers function
- [ ] All validation commands pass

---

### Step 6: Update Preload Script and Type Definitions

**What**: Expose the new getFavorited method through the Electron preload script and update TypeScript type definitions
**Why**: Makes the new IPC method accessible to the renderer process with proper typing
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Add getFavorited to db.projects object
- `types/electron.d.ts` - Add getFavorited type definition

**Changes:**
- Add `getFavorited: () => ipcRenderer.invoke(IpcChannels.db.projects.getFavorited)` to preload electronAPI.db.projects
- Add `getFavorited(): Promise<Array<Project>>` to ElectronAPI.db.projects interface in both files

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Preload script exposes getFavorited method
- [ ] Type definitions include getFavorited with correct return type
- [ ] All validation commands pass

---

### Step 7: Update useElectronDb Hook with getFavorited Method

**What**: Add the getFavorited method to the useElectronDb hook's projects object
**Why**: Provides a React-friendly way to access the new IPC method with proper error handling
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Add getFavorited to projects useMemo

**Changes:**
- Add `getFavorited` method to the projects object that calls `api.db.projects.getFavorited()`
- Handle the case when api is not available by returning empty array promise

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] useElectronDb().projects.getFavorited() is available
- [ ] Method handles missing API gracefully
- [ ] All validation commands pass

---

### Step 8: Create useFavoritedProjects Query Hook

**What**: Create a new TanStack Query hook for fetching favorited projects
**Why**: Enables efficient data fetching with caching for the sidebar favorites section
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-projects.ts` - Add useFavoritedProjects hook

**Changes:**
- Add `useFavoritedProjects` function that uses `useQuery` with `projectKeys.favorited`
- Configure the query to use `projects.getFavorited()` as the query function
- Enable query only when isElectron is true

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `useFavoritedProjects` hook is exported and usable
- [ ] Hook returns correct data shape with loading/error states
- [ ] All validation commands pass

---

### Step 9: Create useFavoriteProject Mutation Hook

**What**: Create a TanStack Query mutation hook for toggling the favorite state of a project
**Why**: Provides optimistic updates and proper cache invalidation when favoriting/unfavoriting projects
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-projects.ts` - Add useFavoriteProject mutation hook

**Changes:**
- Add `useFavoriteProject` function that uses `useMutation` to update project's `isFavorited` field
- Mutation function should accept `{ id: number; isFavorited: boolean }` and call `projects.update(id, { isFavorited })`
- On success, invalidate both `projectKeys.list` and `projectKeys.favorited` query keys
- Update the project detail cache with the new favorite state

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] `useFavoriteProject` hook is exported and usable
- [ ] Mutation properly invalidates list and favorited queries on success
- [ ] All validation commands pass

---

### Step 10: Create FavoriteButton Component

**What**: Create a reusable star icon button component for toggling project favorite state
**Why**: Encapsulates the favorite toggle UI and interaction logic in a reusable component
**Confidence**: High

**Files to Create:**
- `components/projects/favorite-button.tsx` - New favorite button component

**Changes:**
- Create FavoriteButton component accepting `id`, `isFavorited`, and optional className props
- Use lucide-react `Star` icon with filled variant when favorited
- Handle click event to call useFavoriteProject mutation with toggled state
- Prevent click propagation to avoid triggering parent link navigation
- Apply appropriate hover and active states using Tailwind classes
- Use CVA pattern if variants are needed for different sizes

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] FavoriteButton component renders Star icon correctly
- [ ] Filled star appears when isFavorited is true
- [ ] Click toggles favorite state via mutation
- [ ] Click does not propagate to parent elements
- [ ] All validation commands pass

---

### Step 11: Update ProjectCard to Include FavoriteButton

**What**: Integrate the FavoriteButton component into the ProjectCard component
**Why**: Allows users to favorite/unfavorite projects directly from the projects list
**Confidence**: High

**Files to Modify:**
- `components/projects/project-card.tsx` - Add FavoriteButton

**Changes:**
- Add `isFavorited` boolean prop to ProjectCardProps interface
- Import and render FavoriteButton in the card header area (replace or alongside ChevronRight)
- Position the button appropriately within the existing layout
- Pass id and isFavorited props to FavoriteButton

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] ProjectCard accepts isFavorited prop
- [ ] FavoriteButton renders in the card header
- [ ] Clicking star toggles favorite without navigating
- [ ] All validation commands pass

---

### Step 12: Update Projects Page to Pass isFavorited to Cards

**What**: Update the projects list page to pass the isFavorited prop to each ProjectCard
**Why**: Ensures the favorite state is displayed correctly on each project card
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/page.tsx` - Pass isFavorited prop

**Changes:**
- Add `isFavorited={project.isFavorited ?? false}` prop to ProjectCard in the map function

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Each ProjectCard receives correct isFavorited value
- [ ] Favorite state persists across page refreshes
- [ ] All validation commands pass

---

### Step 13: Create SidebarFavorites Component

**What**: Create a new component to display favorited projects in the sidebar
**Why**: Shows favorited projects prominently in the navigation for quick access
**Confidence**: High

**Files to Create:**
- `components/layout/sidebar-favorites.tsx` - New favorites section component

**Changes:**
- Create SidebarFavorites component that uses useFavoritedProjects hook
- Display "Favorites" section header with Star icon
- Render list of favorited project links with proper styling matching existing nav items
- Use useSidebar context to handle collapsed state (show only icons when collapsed)
- Wrap links in Tooltip when sidebar is collapsed (matching NavItemLink pattern)
- Handle empty state gracefully (render nothing if no favorites)
- Use $path for type-safe navigation to project routes

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Component renders favorited projects list
- [ ] Links navigate to correct project pages
- [ ] Collapsed state shows icons only with tooltips
- [ ] Empty state renders nothing
- [ ] All validation commands pass

---

### Step 14: Integrate SidebarFavorites into SidebarNav

**What**: Add the SidebarFavorites component to the main sidebar navigation
**Why**: Makes favorited projects visible and accessible in the sidebar above the main Projects link
**Confidence**: High

**Files to Modify:**
- `components/layout/sidebar-nav.tsx` - Add SidebarFavorites

**Changes:**
- Import SidebarFavorites component
- Render SidebarFavorites above the mainNavItems section
- Ensure proper spacing between Favorites section and main navigation items

**Validation Commands:**
```bash
pnpm lint --fix && pnpm typecheck
```

**Success Criteria:**
- [ ] Favorites section appears above Projects link in sidebar
- [ ] Favorited projects are clickable and navigate correctly
- [ ] Section disappears when no projects are favorited
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint --fix`
- [ ] Database migration applied successfully with `pnpm db:generate && pnpm db:migrate`
- [ ] Application starts without errors with `pnpm electron:dev`
- [ ] Favorite toggle works from projects list page
- [ ] Favorited projects display in sidebar
- [ ] Feature works in both expanded and collapsed sidebar states
- [ ] Favorite state persists across application restarts

## Notes

- The implementation leverages the existing `update` IPC handler for toggling favorites, minimizing changes to the IPC layer
- SQLite does not have a native boolean type, so `isFavorited` uses integer (0/1) with TypeScript treating it as a number - this is standard Drizzle ORM pattern
- A dedicated `getFavorited` query method is added for efficiency, but could alternatively filter the full list in the renderer if preferred
- The SidebarFavorites component should handle the case where the favorites query is still loading gracefully
- Consider adding a subtle animation when toggling favorite state for better UX feedback
- The Star icon from lucide-react supports both outline (unfavorited) and filled (favorited) states via the `fill` prop
