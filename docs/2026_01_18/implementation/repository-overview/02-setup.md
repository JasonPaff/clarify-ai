# Phase 2: Setup and Routing Table

**Timestamp**: 2026-01-19

## Plan Analysis

The implementation plan describes 5 phases with multiple steps in each phase. This orchestrator will delegate each step to the appropriate specialist subagent.

## Routing Table

### Phase 1: Database & Core Infrastructure

| Step | Description                                          | Specialist          | Files                                                                                              |
| ---- | ---------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| 1.1  | Create `repository_overviews` table schema           | **database-schema** | `db/schema/repository-overviews.schema.ts`                                                         |
| 1.2  | Create repository pattern for overviews              | **database-schema** | `db/repositories/repository-overviews.repository.ts`                                               |
| 1.3  | Add IPC handlers for overview CRUD                   | **ipc-handler**     | `electron/ipc/channels.ts`, `electron/ipc/repository-overviews.handlers.ts`, `electron/preload.ts` |
| 1.4  | Add query hooks for overview data                    | **tanstack-query**  | `hooks/queries/use-repository-overviews.ts`, `lib/queries/repository-overviews.ts`                 |
| 1.5  | Update repository queries to include overview status | **tanstack-query**  | `hooks/queries/use-repositories.ts`                                                                |

### Phase 2: Overview Generation

| Step | Description                                               | Specialist             | Files                                                    |
| ---- | --------------------------------------------------------- | ---------------------- | -------------------------------------------------------- |
| 2.1  | Implement repository data collection (file tree, configs) | **general-purpose**    | `electron/lib/repository-data-collector.ts`              |
| 2.2  | Create overview generation prompt template                | **general-purpose**    | `lib/ai/prompts/repository-overview.ts`                  |
| 2.3  | Implement streaming generation handler                    | **ipc-handler**        | `electron/ipc/ai-repository-overview.handlers.ts`        |
| 2.4  | Create generation dialog component                        | **frontend-component** | `components/repositories/repository-overview-dialog.tsx` |
| 2.5  | Add generation action to repository card                  | **frontend-component** | `components/repositories/repository-card.tsx`            |

### Phase 3: Overview Management UI

| Step | Description                                 | Specialist             | Files                                                     |
| ---- | ------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| 3.1  | Create overview viewer modal                | **frontend-component** | `components/repositories/repository-overview-preview.tsx` |
| 3.2  | Create overview editor component            | **frontend-component** | `components/repositories/repository-overview-editor.tsx`  |
| 3.3  | Add regenerate functionality                | **general-purpose**    | Update dialog/hooks                                       |
| 3.4  | Add export to markdown                      | **general-purpose**    | Add export function                                       |
| 3.5  | Update repository card with overview status | **frontend-component** | `components/repositories/repository-card.tsx`             |

### Phase 4: Clarification Integration

| Step | Description                                            | Specialist             | Files                                                               |
| ---- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------- |
| 4.1  | Add repository context selector to clarification panel | **frontend-component** | `components/features/clarification/repository-context-selector.tsx` |
| 4.2  | Update clarification prompt builder                    | **general-purpose**    | `lib/ai/prompts/clarification.ts`                                   |
| 4.3  | Update feature request schema for context tracking     | **database-schema**    | `db/schema/feature-requests.schema.ts`                              |
| 4.4  | Wire up context selection to clarification flow        | **general-purpose**    | Update clarification components                                     |

### Phase 5: Additional Context Files

| Step | Description                              | Specialist             | Files                                                               |
| ---- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------------- |
| 5.1  | Create file picker component             | **frontend-component** | `components/features/clarification/additional-context-selector.tsx` |
| 5.2  | Implement file reading and validation    | **general-purpose**    | `electron/lib/context-file-reader.ts`                               |
| 5.3  | Add storage for selected file references | **database-schema**    | Update feature requests schema (part of 4.3)                        |
| 5.4  | Integrate into clarification prompt      | **general-purpose**    | Update prompt builder (part of 4.2)                                 |

## Total Steps

- **27 implementation steps** across 5 phases
- **Specialist distribution**:
  - database-schema: 4 steps
  - ipc-handler: 2 steps
  - tanstack-query: 2 steps
  - frontend-component: 9 steps
  - general-purpose: 10 steps

## Next Actions

1. Begin Phase 1 with database schema creation
2. Work through phases sequentially
3. Validate each step before proceeding

**Status**: ✅ Routing table complete

**Output**: `MILESTONE:PHASE_2_COMPLETE`
