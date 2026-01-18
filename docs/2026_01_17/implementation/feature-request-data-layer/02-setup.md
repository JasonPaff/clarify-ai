# Setup and Routing Table

## Specialist Agent Routing

| Step | Title                                         | Specialist        | Files                                            |
| ---- | --------------------------------------------- | ----------------- | ------------------------------------------------ |
| 1    | Create Feature Requests Database Schema       | `database-schema` | `db/schema/feature-requests.schema.ts`           |
| 2    | Update Database Index                         | `database-schema` | `db/index.ts`                                    |
| 3    | Generate Database Migration                   | `database-schema` | `drizzle/*.sql`                                  |
| 4    | Create Feature Requests Repository            | `database-schema` | `db/repositories/feature-requests.repository.ts` |
| 5    | Add Feature Requests IPC Channel Constants    | `ipc-handler`     | `electron/ipc/channels.ts`                       |
| 6    | Create Feature Requests IPC Handlers          | `ipc-handler`     | `electron/ipc/feature-requests.handlers.ts`      |
| 7    | Register Feature Requests Handlers            | `ipc-handler`     | `electron/ipc/register-handlers.ts`              |
| 8    | Update Electron Preload Script                | `ipc-handler`     | `electron/preload.ts`                            |
| 9    | Update Electron Type Definitions              | `ipc-handler`     | `types/electron.d.ts`                            |
| 10   | Extend useElectronDb Hook                     | `ipc-handler`     | `hooks/useElectron.ts`                           |
| 11   | Create Feature Requests Query Key Factory     | `tanstack-query`  | `lib/queries/feature-requests.ts`                |
| 12   | Create Feature Requests TanStack Query Hooks  | `tanstack-query`  | `hooks/queries/use-feature-requests.ts`          |
| 13   | Create Feature Request Zod Validation Schemas | `tanstack-form`   | `lib/validations/feature-request.ts`             |

## Execution Plan

### Database Layer (Steps 1-4) - `database-schema` agent

Sequential execution required due to dependencies.

### IPC Layer (Steps 5-10) - `ipc-handler` agent

Steps 5-10 can be batched after database layer completes.

### Query Layer (Steps 11-12) - `tanstack-query` agent

Depends on IPC layer completion.

### Validation Layer (Step 13) - `tanstack-form` agent

Can run after query layer or in parallel with Step 12.

## Status

Routing table complete. Proceeding to Phase 3: Step Execution.
