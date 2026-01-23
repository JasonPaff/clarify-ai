# Implementation Setup and Routing Table

**Phase**: 2 - Setup and Routing Table
**Created**: 2026-01-22

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Define AI Discovery Settings Schema Extension | `database-schema` | `db/schema/step-configurations.schema.ts` |
| 2 | Generate Database Migration | `general-purpose` | `drizzle/XXXX_migration.sql` |
| 3 | Create AI Discovery Validation Schemas | `general-purpose` | `lib/validations/ai-discovery.ts` |
| 4 | Implement File Tree Pruning Utility | `general-purpose` | `lib/ai/utils/file-tree-pruner.ts` |
| 5 | Create AI Discovery Prompt Template | `general-purpose` | `lib/ai/prompts/ai-discovery.ts` |
| 6 | Create AI Discovery Tool Definition | `general-purpose` | `lib/ai/tools/ai-discovery-tool.ts` |
| 7 | Implement AI Discovery IPC Handler | `ipc-handler` | `electron/ipc/ai-discovery-assisted.handlers.ts`, `electron/ipc/channels.ts`, `electron/ipc/index.ts` |
| 8 | Update Electron Preload with AI Discovery API | `ipc-handler` | `electron/preload.ts` |
| 9 | Create useAiDiscovery Hook | `tanstack-query` | `hooks/use-ai-discovery.ts` |
| 10 | Gemini Code Review Checkpoint (Backend) | `gemini-review` | N/A |
| 11 | Create AiDiscoveryProgress Component | `frontend-component` | `components/features/discovery/ai-discovery-progress.tsx` |
| 12 | Create AiDiscoveryResults Component | `frontend-component` | `components/features/discovery/ai-discovery-results.tsx` |
| 13 | Create AiDiscoveryCostWarning Component | `frontend-component` | `components/features/discovery/ai-discovery-cost-warning.tsx` |
| 14 | Create AiDiscoveryPanel Component | `frontend-component` | `components/features/discovery/ai-discovery-panel.tsx` |
| 15 | Integrate AI Discovery into Discover Step | `frontend-component` | `components/features/discover-step.tsx` |
| 16 | Add AI Discovery Settings to Step Settings Panel | `frontend-component` | `components/features/workflow/step-settings-panel.tsx` |
| 17 | Implement Batch Context File Addition | `tanstack-query` | `hooks/use-ai-discovery.ts` |
| 18 | Add Error Handling with QueryErrorBoundary | `frontend-component` | `components/features/discovery/ai-discovery-panel.tsx` |
| 19 | Update Electron Types Definition | `ipc-handler` | `types/electron.d.ts` |
| 20 | Final Gemini Code Review (Quality Gate) | `gemini-review` | N/A |

## Agent Distribution Summary

| Agent | Steps |
|-------|-------|
| `database-schema` | 1 |
| `general-purpose` | 2, 3, 4, 5, 6 |
| `ipc-handler` | 7, 8, 19 |
| `tanstack-query` | 9, 17 |
| `gemini-review` | 10, 20 |
| `frontend-component` | 11, 12, 13, 14, 15, 16, 18 |

## Implementation Order

Steps will be executed sequentially as they have dependencies:
- Steps 1-2: Database schema foundation
- Steps 3-6: Backend utilities and AI components
- Steps 7-8: IPC communication layer
- Step 9: React hook for state management
- Step 10: Backend quality gate
- Steps 11-14: UI components
- Steps 15-16: Integration with existing UI
- Steps 17-18: Final backend + error handling
- Step 19: Type definitions
- Step 20: Final quality gate

---

MILESTONE:PHASE_2_COMPLETE
