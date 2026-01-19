# Implementation Setup - Routing Table

**Feature**: Repository Overview Import
**Date**: 2026-01-19

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add IPC Channel | `ipc-handler` | `electron/ipc/channels.ts` |
| 2 | Implement IPC Handler | `ipc-handler` | `electron/ipc/repository-overviews.handlers.ts`, `electron/ipc/register-handlers.ts` |
| 3 | Update Type Definitions | `ipc-handler` | `types/electron.ts`, `electron/preload.ts` |
| 4 | Create Query Mutation | `tanstack-query` | `hooks/queries/use-repository-overviews.ts` |
| 5 | Create Confirmation Dialog | `frontend-component` | `components/repositories/import-confirmation-dialog.tsx` (NEW) |
| 6 | Create Import Dialog | `tanstack-form` | `components/repositories/import-repository-overview-dialog.tsx` (NEW) |
| 7 | Integrate Confirmation Flow | `tanstack-form` | `components/repositories/import-repository-overview-dialog.tsx` |
| 8 | Add Import Button | `frontend-component` | `app/(app)/projects/[projectId]/repositories/[repositoryId]/page.tsx` |
| 9 | Update Badge Logic | `frontend-component` | `components/repositories/repository-overview-viewer.tsx`, `components/repositories/repository-card.tsx` |
| 10 | Add Validation Schema | `general-purpose` | `lib/validations/import-repository-overview.ts` (NEW) |

## Dependency Chain

```
Step 1 (channel) → Step 2 (handler) → Step 3 (types) → Step 4 (mutation)
                                                              ↓
                                    Step 10 (schema) → Step 6 (dialog) → Step 7 (flow)
                                                              ↓
                                               Step 5 (confirm) → Step 8 (page)
                                                              ↓
                                                        Step 9 (badge)
```

## MILESTONE: PHASE_2_COMPLETE
