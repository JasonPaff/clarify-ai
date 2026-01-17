# Implementation Setup and Routing Table

**Feature**: Repositories Data Layer
**Date**: 2026-01-17

## Routing Table

| Step | Title                                        | Specialist Agent  | Files                                                                    |
| ---- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------ |
| 1    | Create Database Schema for Repositories      | `database-schema` | `db/schema/repositories.schema.ts`, `db/schema/index.ts`                 |
| 2    | Create Repository Pattern Implementation     | `database-schema` | `db/repositories/repositories.repository.ts`, `db/repositories/index.ts` |
| 3    | Create Database Types Re-export File         | `database-schema` | `db/types.ts`                                                            |
| 4    | Add IPC Channels for Repositories            | `general-purpose` | `electron/ipc/channels.ts`                                               |
| 5    | Create IPC Handlers for Repositories         | `general-purpose` | `electron/ipc/repositories.handlers.ts`, `electron/ipc/index.ts`         |
| 6    | Update Electron Preload Script               | `general-purpose` | `electron/preload.ts`                                                    |
| 7    | Update Electron Type Definitions             | `general-purpose` | `types/electron.d.ts`                                                    |
| 8    | Create Query Key Factory for Repositories    | `tanstack-query`  | `lib/queries/repositories.ts`, `lib/queries/index.ts`                    |
| 9    | Create Zod Validation Schemas                | `tanstack-form`   | `lib/validations/repository.ts`                                          |
| 10   | Extend useElectron Hook with Repositories    | `general-purpose` | `hooks/useElectron.ts`                                                   |
| 11   | Create TanStack Query Hooks for Repositories | `tanstack-query`  | `hooks/queries/use-repositories.ts`                                      |
| 12   | Generate and Run Database Migration          | `database-schema` | `drizzle/*.sql` (auto-generated)                                         |

## Specialist Distribution

- **database-schema**: Steps 1, 2, 3, 12 (4 steps)
- **general-purpose**: Steps 4, 5, 6, 7, 10 (5 steps)
- **tanstack-query**: Steps 8, 11 (2 steps)
- **tanstack-form**: Step 9 (1 step)

## Execution Order

Steps will be executed sequentially as they have dependencies:

- Steps 1-3: Database layer foundation
- Steps 4-7: IPC/Electron layer
- Steps 8-11: React hooks and queries
- Step 12: Database migration

## Status

**Phase 2 Complete**: Ready to begin step execution
