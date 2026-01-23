# AI Debug Logging - Setup and Routing Table

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create AI Log Type Definitions | `general-purpose` | `types/ai-log.ts` |
| 2 | Create Database Schema for AI Logs | `database-schema` | `db/schema/ai-logs.schema.ts` |
| 3 | Update Database Index to Include AI Logs Schema | `database-schema` | `db/index.ts` |
| 4 | Generate Database Migration | `database-schema` | (migration generation) |
| 5 | Create AI Logs Repository | `database-schema` | `db/repositories/ai-logs.repository.ts` |
| 6 | Create Debug Logging Constants and Configuration | `general-purpose` | `lib/ai/debug-logging/constants.ts` |
| 7 | Add IPC Channel Definitions for AI Logs | `ipc-handler` | `electron/ipc/channels.ts` |
| 8 | Create AI Logs IPC Handlers | `ipc-handler` | `electron/ipc/ai-logs.handlers.ts` |
| 9 | Register AI Logs Handlers and Update Preload | `ipc-handler` | `electron/ipc/register-handlers.ts`, `electron/preload.ts`, `types/electron.ts` |
| 10 | Create AI Logging Service | `general-purpose` | `electron/ipc/lib/ai-logging-service.ts` |
| 11 | Integrate Logging Service into AI Handlers | `general-purpose` | `electron/ipc/ai-*.handlers.ts` |
| 12 | Create Zod Validation Schemas for AI Logs | `tanstack-form` | `lib/validations/ai-log.ts` |
| 13 | Create Query Key Definitions for AI Logs | `tanstack-query` | `lib/queries/ai-logs.ts` |
| 14 | Create React Query Hooks for AI Logs | `tanstack-query` | `hooks/queries/use-ai-logs.ts` |
| 15 | Add useElectronAiLogs Hook | `general-purpose` | `hooks/useElectron.ts` |
| 16 | Create AI Debug Logging Context Provider | `frontend-component` | `components/providers/ai-debug-logging-provider.tsx` |
| 17 | Create Log Entry Component | `frontend-component` | `components/ai-devtools/log-entry.tsx` |
| 18 | Create Log Filter Toolbar Component | `frontend-component` | `components/ai-devtools/log-filter-toolbar.tsx` |
| 19 | Create Log Detail View Component | `frontend-component` | `components/ai-devtools/log-detail-view.tsx` |
| 20 | Create Export Controls Component | `frontend-component` | `components/ai-devtools/export-controls.tsx` |
| 21 | Create Main DevTools Window Component | `frontend-component` | `components/ai-devtools/ai-devtools-window.tsx` |
| 22 | Add DevTools Window to Electron Main Process | `ipc-handler` | `electron/main.ts` |
| 23 | Create DevTools Page Route | `general-purpose` | `app/devtools/page.tsx`, `app/devtools/layout.tsx` |
| 25 | Add Debug Logging Settings to Settings Page | `frontend-component` | `app/(app)/settings/page.tsx` |
| 26 | Wrap App with Debug Logging Provider | `general-purpose` | `app/layout.tsx` |

## Step Dependencies

- Steps 1-6: Foundation (types, schema, repository, constants)
- Steps 7-11: IPC layer (channels, handlers, service, integration)
- Steps 12-15: Data layer (validations, query keys, hooks)
- Steps 16-21: UI Components (provider, DevTools components)
- Steps 22-23: Electron window setup
- Steps 25-26: Integration into app

## Notes

- Step 24 was skipped in the plan (numbering goes 23 -> 25)
- All steps will validate with `pnpm lint && pnpm typecheck`
