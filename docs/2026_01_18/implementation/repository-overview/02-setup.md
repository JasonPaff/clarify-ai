# Implementation Setup - Routing Table

## Step-to-Specialist Routing

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create repository_overviews table schema | database-schema | db/schema/repository-overviews.schema.ts |
| 2 | Create repository pattern for overviews | database-schema | db/repositories/repository-overviews.repository.ts |
| 3 | Add IPC handlers for overview CRUD | ipc-handler | electron/ipc/repository-overviews.handlers.ts, electron/ipc/channels.ts, electron/preload.ts |
| 4 | Add query hooks for overview data | tanstack-query | hooks/queries/use-repository-overviews.ts, lib/queries/repository-overviews.ts |
| 5 | Update repository queries to include overview | tanstack-query | hooks/queries/use-repositories.ts |
| 6 | Implement repository data collection | ipc-handler | electron/ipc/repository-overview-generation.handlers.ts |
| 7 | Create overview generation prompt template | general-purpose | lib/ai/prompts/repository-overview.ts |
| 8 | Implement streaming generation handler | ipc-handler | electron/ipc/ai-overview.handlers.ts |
| 9 | Create generation dialog component | frontend-component | components/repositories/RepositoryOverviewDialog.tsx |
| 10 | Update repository card with overview actions | frontend-component | components/repositories/RepositoryCard.tsx |
| 11 | Quality gates | orchestrator | N/A |

## Implementation Order Rationale

1. **Database schema first** - Other layers depend on the data model
2. **Repository pattern** - Required for IPC handlers
3. **IPC handlers** - Required for React hooks
4. **Query hooks** - Required for UI components
5. **Data collection** - Required for generation
6. **Prompt template** - Required for AI generation
7. **Streaming handler** - Required for dialog
8. **Dialog component** - Required for card integration
9. **Card updates** - Final integration point

## Milestone Tracking

- PHASE_1_COMPLETE: After Step 5
- PHASE_2_COMPLETE: After Step 10
- QUALITY_GATES_PASSED: After Step 11
