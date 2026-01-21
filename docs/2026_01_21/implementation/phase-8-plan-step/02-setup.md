# Phase 8 Setup and Routing Table

**Created**: 2026-01-21

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Create Plan Validation Schemas | `general-purpose` | `lib/validations/plan.ts` |
| 2 | Create Plan Prompt Template | `general-purpose` | `lib/ai/prompts/plan.ts` |
| 3 | Create Plan Tool Definition | `general-purpose` | `lib/ai/tools/plan-tool.ts` |
| 4 | Update Plan IPC Handlers | `ipc-handler` | `electron/ipc/ai-plan.handlers.ts` |
| 5 | Create Plan Workflow Hook | `tanstack-query` | `hooks/use-plan.ts` |
| 6 | Create Plan Progress Component | `frontend-component` | `components/features/plan/plan-progress.tsx` |
| 7 | Create Plan Step Card Component | `frontend-component` | `components/features/plan/plan-step-card.tsx` |
| 8 | Create Quality Gate List Component | `frontend-component` | `components/features/plan/quality-gate-list.tsx` |
| 9 | Create Plan Cost Estimate Component | `frontend-component` | `components/features/plan/plan-cost-estimate.tsx` |
| 10 | Create Plan Results Component | `frontend-component` | `components/features/plan/plan-results.tsx` |
| 11 | Create Export Dialog Component | `frontend-component` | `components/features/plan/export-dialog.tsx` |
| 12 | Create Plan Panel Component | `frontend-component` | `components/features/plan/plan-panel.tsx` |
| 13 | Create Plan Step Wrapper Component | `frontend-component` | `components/features/plan-step.tsx` |
| 14 | Integrate Plan Step into Feature Workflow | `general-purpose` | `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` |
| 15 | Update Type Exports and Re-exports | `ipc-handler` | `electron/ipc/ai-plan.handlers.ts` |

## Agent Selection Rationale

- **Steps 1-3**: `general-purpose` - Validation schemas, prompts, and tool definitions are utility/library code
- **Step 4**: `ipc-handler` - IPC handler modification requires Electron IPC expertise
- **Step 5**: `tanstack-query` - Hook involves state management and data fetching patterns
- **Steps 6-13**: `frontend-component` - React components with CVA and Base UI patterns
- **Step 14**: `general-purpose` - Page integration is straightforward component usage
- **Step 15**: `ipc-handler` - Type exports related to IPC handlers

## Milestone

`MILESTONE:PHASE_2_COMPLETE`
