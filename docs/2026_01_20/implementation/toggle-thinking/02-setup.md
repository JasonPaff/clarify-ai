# Routing Table and Setup

**Created**: 2026-01-20

## Step-to-Specialist Routing Table

| Step | Title                                                | Specialist         | Files                                                                                                           |
| ---- | ---------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1    | Create thinking preference constants and provider    | frontend-component | `lib/ai/thinking-preference/constants.ts`, `components/providers/thinking-preference-provider.tsx`              |
| 2    | Integrate ThinkingPreferenceProvider into app layout | general-purpose    | `app/(app)/layout.tsx`                                                                                          |
| 3    | Add thinking toggle to settings page                 | frontend-component | `app/(app)/settings/page.tsx`                                                                                   |
| 4    | Extend AI request interfaces with thinking parameter | ipc-handler        | `electron/ipc/ai-overview.handlers.ts`, `electron/ipc/ai-clarification.handlers.ts`                             |
| 5    | Update AI overview handler to use thinking parameter | ipc-handler        | `electron/ipc/ai-overview.handlers.ts`                                                                          |
| 6    | Update AI clarification handler to support thinking  | ipc-handler        | `electron/ipc/ai-clarification.handlers.ts`                                                                     |
| 7    | Extract shared thinking provider options builder     | ipc-handler        | `electron/lib/ai-utils.ts`, `electron/ipc/ai-overview.handlers.ts`, `electron/ipc/ai-clarification.handlers.ts` |
| 8    | Update preload script and type definitions           | ipc-handler        | `types/electron.ts`                                                                                             |
| 9    | Update repository overview generator component       | frontend-component | `components/repositories/repository-overview-generator.tsx`                                                     |
| 10   | Update clarification hook and panel                  | frontend-component | `hooks/use-clarification.ts`, `components/features/clarification/clarification-panel.tsx`                       |
| 11   | Update useElectron hook type exports                 | general-purpose    | `hooks/useElectron.ts`                                                                                          |

## Specialist Summary

- **frontend-component**: Steps 1, 3, 9, 10 (4 steps)
- **ipc-handler**: Steps 4, 5, 6, 7, 8 (5 steps)
- **general-purpose**: Steps 2, 11 (2 steps)

## Execution Order

Steps will be executed sequentially as there are dependencies between them:

1. Steps 1-2: Provider infrastructure
2. Step 3: Settings UI
3. Steps 4-8: Backend/IPC layer
4. Steps 9-11: Frontend components consuming the new APIs

## Ready for Implementation

Proceeding to Step 1...
