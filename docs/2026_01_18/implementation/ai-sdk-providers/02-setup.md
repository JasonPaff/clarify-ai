# Setup and Routing Table

## Step Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Centralized Provider Type Definitions | ipc-handler | `electron/ipc/lib/provider-types.ts` (create), `electron/ipc/api-keys.handlers.ts`, `electron/ipc/ai-clarification.handlers.ts`, `electron/ipc/ai-overview.handlers.ts`, `lib/validations/api-key.ts`, `lib/ai/models.ts`, `types/electron.d.ts` |
| 2 | Create Centralized Provider Factory | ipc-handler | `electron/ipc/lib/provider-factory.ts` (create), `electron/ipc/ai-clarification.handlers.ts`, `electron/ipc/ai-overview.handlers.ts` |
| 3 | Extend API Key Storage Schema | ipc-handler | `electron/ipc/lib/provider-types.ts`, `electron/ipc/api-keys.handlers.ts`, `types/electron.d.ts` |
| 4 | Install New AI SDK Provider Packages | general-purpose | `package.json` |
| 5 | Implement Provider Factory Cases for New Providers | ipc-handler | `electron/ipc/lib/provider-factory.ts` |
| 6 | Implement API Key Test Functions for New Providers | ipc-handler | `electron/ipc/api-keys.handlers.ts` |
| 7 | Add Model Definitions for New Providers | general-purpose | `lib/ai/models.ts`, `hooks/use-available-models.ts` |
| 8 | Update Zod Validation Schema | tanstack-form | `lib/validations/api-key.ts` |
| 9 | Add Badge Variants for New Providers | frontend-component | `components/ui/badge.tsx` |
| 10 | Update API Key Form with Provider-Specific Fields | tanstack-form | `components/settings/api-key-form.tsx` |
| 11 | Update API Keys Section with Provider Categories | frontend-component | `components/settings/api-keys-section.tsx`, `components/settings/api-key-table.tsx` |
| 12 | Update Preload Script and Type Definitions | ipc-handler | `electron/preload.ts`, `types/electron.d.ts` |
| 13 | Integration Testing and Validation | general-purpose | N/A (testing only) |

## Specialist Summary

- **ipc-handler**: Steps 1, 2, 3, 5, 6, 12 (6 steps)
- **general-purpose**: Steps 4, 7, 13 (3 steps)
- **tanstack-form**: Steps 8, 10 (2 steps)
- **frontend-component**: Steps 9, 11 (2 steps)

## Working Directory

All implementation happens in: `C:\Users\jasonpaff\dev\clarify-ai\.worktrees\ai-sdk-providers`
