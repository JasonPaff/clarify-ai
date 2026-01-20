# Implementation Setup and Routing Table

**Feature**: Token Usage and Cost Tracking
**Date**: 2026-01-19

## Step Routing Table

| Step | Title                                                 | Specialist           | Files                                                                                     |
| ---- | ----------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| 1    | Create AI Usage Logs Database Schema                  | `database-schema`    | `db/schema/ai-usage-logs.schema.ts`                                                       |
| 2    | Update Database Index and Generate Migration          | `database-schema`    | `db/index.ts`                                                                             |
| 3    | Create AI Usage Logs Repository                       | `database-schema`    | `db/repositories/ai-usage-logs.repository.ts`                                             |
| 4    | Add IPC Channel Constants                             | `ipc-handler`        | `electron/ipc/channels.ts`                                                                |
| 5    | Create AI Usage Logs IPC Handlers                     | `ipc-handler`        | `electron/ipc/ai-usage-logs.handlers.ts`                                                  |
| 6    | Register AI Usage Logs Handlers                       | `ipc-handler`        | `electron/ipc/register-handlers.ts`                                                       |
| 7    | Update Preload Script and Type Definitions            | `ipc-handler`        | `electron/preload.ts`, `types/electron.d.ts`                                              |
| 8    | Update useElectronDb Hook                             | `ipc-handler`        | `hooks/useElectron.ts`                                                                    |
| 9    | Create Model Pricing Data                             | `general-purpose`    | `lib/ai/pricing.ts`, `lib/ai/models.ts`                                                   |
| 10   | Create TokenLens Integration Utility                  | `general-purpose`    | `lib/ai/token-counting.ts`                                                                |
| 11   | Update AI Clarification Handler with Token Capture    | `ipc-handler`        | `electron/ipc/ai-clarification.handlers.ts`                                               |
| 12   | Update AI Overview Handler with Token Capture         | `ipc-handler`        | `electron/ipc/ai-overview.handlers.ts`                                                    |
| 13   | Update Handler Registration with Repository Injection | `ipc-handler`        | `electron/ipc/register-handlers.ts`                                                       |
| 14   | Create Query Key Factory for AI Usage Logs            | `tanstack-query`     | `lib/queries/ai-usage-logs.ts`, `lib/queries/index.ts`                                    |
| 15   | Create TanStack Query Hooks for AI Usage Logs         | `tanstack-query`     | `hooks/queries/use-ai-usage-logs.ts`                                                      |
| 16   | Create Zod Validation Schema                          | `tanstack-form`      | `lib/validations/ai-usage-log.ts`                                                         |
| 17   | Update Model Selector with Cost Tier Indicators       | `frontend-component` | `components/features/clarification/model-selector.tsx`, `hooks/use-available-models.ts`   |
| 18   | Create Cost Confirmation Dialog Component             | `frontend-component` | `components/ui/cost-confirmation-dialog.tsx`                                              |
| 19   | Create Usage Footer Component                         | `frontend-component` | `components/ui/usage-footer.tsx`                                                          |
| 20   | Integrate UI into Repository Overview Generator       | `frontend-component` | `components/repositories/repository-overview-generator.tsx`                               |
| 21   | Integrate UI into Clarification Panel                 | `frontend-component` | `components/features/clarification/clarification-panel.tsx`, `hooks/use-clarification.ts` |
| 22   | Create Usage Page Route Type                          | `general-purpose`    | `app/(app)/projects/[projectId]/usage/route-type.ts`                                      |
| 23   | Create Usage Dashboard Page                           | `frontend-component` | `app/(app)/projects/[projectId]/usage/page.tsx`                                           |
| 24   | Add Usage Tab to Project Navigation                   | `frontend-component` | `components/projects/project-tabs.tsx`                                                    |
| 25   | Run Database Migration                                | `general-purpose`    | (migration command)                                                                       |
| 26   | End-to-End Testing and Validation                     | `general-purpose`    | (testing)                                                                                 |

## Specialist Distribution

- `database-schema`: Steps 1, 2, 3
- `ipc-handler`: Steps 4, 5, 6, 7, 8, 11, 12, 13
- `tanstack-query`: Steps 14, 15
- `tanstack-form`: Step 16
- `frontend-component`: Steps 17, 18, 19, 20, 21, 23, 24
- `general-purpose`: Steps 9, 10, 22, 25, 26

## Phase 2 Complete

Ready to begin step-by-step implementation.
