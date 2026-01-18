# Implementation Setup & Routing Table

**Feature**: Favorite Projects
**Date**: 2026-01-18

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add isFavorited Column to Projects Schema | `database-schema` | `db/schema/projects.schema.ts` |
| 2 | Generate Database Migration | `general-purpose` | `drizzle/` |
| 3 | Add getFavorited Query Key | `tanstack-query` | `lib/queries/projects.ts` |
| 4 | Add Repository Method for getFavorited | `database-schema` | `db/repositories/projects.repository.ts` |
| 5 | Add IPC Channel and Handler for getFavorited | `ipc-handler` | `electron/ipc/channels.ts`, `electron/ipc/projects.handlers.ts` |
| 6 | Update Preload Script and Type Definitions | `ipc-handler` | `electron/preload.ts`, `types/electron.d.ts` |
| 7 | Update useElectronDb Hook | `tanstack-query` | `hooks/useElectron.ts` |
| 8 | Create useFavoritedProjects Query Hook | `tanstack-query` | `hooks/queries/use-projects.ts` |
| 9 | Create useFavoriteProject Mutation Hook | `tanstack-query` | `hooks/queries/use-projects.ts` |
| 10 | Create FavoriteButton Component | `frontend-component` | `components/projects/favorite-button.tsx` |
| 11 | Update ProjectCard with FavoriteButton | `frontend-component` | `components/projects/project-card.tsx` |
| 12 | Update Projects Page | `general-purpose` | `app/(app)/projects/page.tsx` |
| 13 | Create SidebarFavorites Component | `frontend-component` | `components/layout/sidebar-favorites.tsx` |
| 14 | Integrate SidebarFavorites into SidebarNav | `frontend-component` | `components/layout/sidebar-nav.tsx` |

## Step Groupings

### Database Layer (Steps 1-2)
- Schema modification
- Migration generation

### IPC Layer (Steps 4-6)
- Repository method
- IPC channels and handlers
- Preload script updates

### Query Layer (Steps 3, 7-9)
- Query key factory
- Hook updates
- Query and mutation hooks

### UI Layer (Steps 10-14)
- FavoriteButton component
- ProjectCard integration
- SidebarFavorites component
- SidebarNav integration

## Milestone

`MILESTONE:PHASE_2_COMPLETE`
