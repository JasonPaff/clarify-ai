# Setup and Routing Table

**Phase**: 2 - Setup
**Date**: 2026-01-17

## Step-to-Specialist Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Repository Card Component | `general-purpose` | `components/repositories/repository-card.tsx` |
| 2 | Create Repositories Skeleton Component | `general-purpose` | `components/skeletons/repositories-skeleton.tsx` |
| 3 | Create Path Selector Field Component | `tanstack-form` | `components/repositories/path-selector-field.tsx` |
| 4 | Create Repository Form Component | `tanstack-form` | `components/repositories/create-repository-form.tsx` |
| 5 | Create New Repository Dialog Component | `general-purpose` | `components/repositories/new-repository-dialog.tsx` |
| 6 | Create Edit Repository Form Component | `tanstack-form` | `components/repositories/edit-repository-form.tsx` |
| 7 | Create Edit Repository Dialog Component | `general-purpose` | `components/repositories/edit-repository-dialog.tsx` |
| 8 | Create Delete Repository Dialog Component | `general-purpose` | `components/repositories/delete-repository-dialog.tsx` |
| 9 | Create Repositories Index Barrel Export | `general-purpose` | `components/repositories/index.ts` |
| 10 | Update Repositories Page | `general-purpose` | `app/(app)/projects/[projectId]/repositories/page.tsx` |

## Routing Logic Applied

- Steps 3, 4, 6: `tanstack-form` - These create form components with TanStack Form integration and validation schemas
- Steps 1, 2, 5, 7, 8, 9, 10: `general-purpose` - React components, dialogs, and page composition

## Status

✅ Phase 2 complete - Routing table created
