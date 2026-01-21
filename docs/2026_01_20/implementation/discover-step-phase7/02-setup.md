# Setup and Routing Table

**Phase**: 2 - Setup and Routing

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Discovery Validation Schemas | `general-purpose` | `lib/validations/discovery.ts` |
| 2 | Create Discovery AI Prompt Builder | `general-purpose` | `lib/ai/prompts/discovery.ts` |
| 3 | Create Discovery AI Tool Schema | `general-purpose` | `lib/ai/tools/discovery-tool.ts` |
| 4 | Implement Discovery IPC Handler | `ipc-handler` | `electron/ipc/ai-discovery.handlers.ts` |
| 5 | Create Discovery Query Key Factory | `tanstack-query` | `lib/queries/discovery.ts` |
| 6 | Create useDiscovery Hook | `tanstack-query` | `hooks/use-discovery.ts` |
| 7 | Create Discovery Progress Component | `frontend-component` | `components/features/discovery/discovery-progress.tsx` |
| 8 | Create File Card Component | `frontend-component` | `components/features/discovery/file-card.tsx` |
| 9 | Create File Card Editor Component | `frontend-component` | `components/features/discovery/file-card-editor.tsx` |
| 10 | Create Add File Dialog Component | `tanstack-form` | `components/features/discovery/add-file-dialog.tsx` |
| 11 | Create Discovery Results Component | `frontend-component` | `components/features/discovery/discovery-results.tsx` |
| 12 | Create Discovery Cost Estimate Component | `frontend-component` | `components/features/discovery/discovery-cost-estimate.tsx` |
| 13 | Create Scope Selector Component | `frontend-component` | `components/features/discovery/scope-selector.tsx` |
| 14 | Create Discover Step Main Component | `frontend-component` | `components/features/discover-step.tsx` |
| 15 | Integrate Discover Step into Feature Page | `general-purpose` | `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` |
| 16 | Remove Legacy Discover Step Component | `general-purpose` | `components/features/research-step.tsx` |

## Specialist Distribution

- **general-purpose**: 5 steps (1, 2, 3, 15, 16)
- **ipc-handler**: 1 step (4)
- **tanstack-query**: 2 steps (5, 6)
- **frontend-component**: 7 steps (7, 8, 9, 11, 12, 13, 14)
- **tanstack-form**: 1 step (10)

---

**MILESTONE:PHASE_2_COMPLETE**
