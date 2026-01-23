# Fast File Discovery - Setup and Routing Table

**Created**: 2026-01-22

## Routing Table

The following table maps each implementation step to the appropriate specialist subagent.

| Step | Title | Specialist Agent | Key Files |
|------|-------|-----------------|-----------|
| 1 | Define IPC Channels | `ipc-handler` | `electron/ipc/channels.ts` |
| 2 | Create Validation Schemas | `general-purpose` | `lib/validations/file-search.ts` |
| 3 | Create File Search IPC Handlers | `ipc-handler` | `electron/ipc/file-search.handlers.ts` |
| 4 | Register Handlers and Update Preload | `ipc-handler` | `electron/ipc/register-handlers.ts`, `electron/preload.ts` |
| 5 | Update ElectronAPI Types | `ipc-handler` | `types/electron.ts` |
| 6 | Create useElectronFileSearch Hook | `general-purpose` | `hooks/useElectron.ts` |
| 7 | IPC Infrastructure Code Review | `quality-gate` | N/A - Codex review |
| 8 | Create Query Key Factory | `tanstack-query` | `lib/queries/file-search.ts`, `lib/queries/index.ts` |
| 9 | Create TanStack Query Hooks | `tanstack-query` | `hooks/queries/use-file-search.ts` |
| 10 | Create File Search Dialog | `frontend-component` | `components/features/workflow/file-search-dialog.tsx` |
| 11 | Integrate into Clarify Step | `frontend-component` | `components/features/clarify-step.tsx` |
| 12 | Search Dialog UI Code Review | `quality-gate` | N/A - Codex review |
| 13 | End-to-End Testing | `manual` | N/A - Manual testing |
| 14 | Final Code Review | `quality-gate` | N/A - Codex review |

## Step-Type Detection Applied

- Steps 1, 3, 4, 5: `ipc-handler` - Files in `electron/ipc/`, `electron/preload.ts`, IPC types
- Steps 2, 6: `general-purpose` - Validation schemas and React hooks (non-TanStack specific)
- Steps 8, 9: `tanstack-query` - Query keys and TanStack Query hooks
- Steps 10, 11: `frontend-component` - UI components in `components/features/`
- Steps 7, 12, 14: `quality-gate` - Codex code review
- Step 13: `manual` - User-driven end-to-end testing

## Execution Plan

1. Execute steps 1-6 sequentially (IPC infrastructure)
2. Run quality gate (step 7)
3. Execute steps 8-9 (data fetching layer)
4. Execute steps 10-11 (UI layer)
5. Run quality gate (step 12)
6. Pause for manual testing (step 13)
7. Run final quality gate (step 14)
8. Offer git commit
