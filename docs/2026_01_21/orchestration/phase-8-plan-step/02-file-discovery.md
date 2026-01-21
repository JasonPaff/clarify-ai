# Step 2: AI-Powered File Discovery

## Metadata

| Field | Value |
|-------|-------|
| Step | 2 - File Discovery |
| Status | Completed |
| Start Time | 2026-01-21T00:02:00.000Z |
| End Time | 2026-01-21T00:03:00.000Z |
| Duration | ~60 seconds |

## Input

### Refined Feature Request

Implement Phase 8 of the feature request workflow, which constitutes the final Plan step that generates implementation plans from the context gathered in previous steps (Describe, Clarify, and Discover). This phase encompasses five sub-components that must integrate seamlessly with the existing architecture.

## Discovery Statistics

| Metric | Count |
|--------|-------|
| Directories Explored | 7 |
| Candidate Files Examined | 45+ |
| Highly Relevant Files | 38 |
| Files to Modify | 25 |
| Files to Create | 13 |

## Files to Reference (Templates/Patterns)

### AI Integration Templates

| File | Purpose |
|------|---------|
| `lib/ai/prompts/clarification.ts` | Template for creating plan prompt builder function with template variable replacement |
| `lib/ai/prompts/discovery.ts` | Template for building complex prompts with multiple context sections |
| `lib/ai/tools/clarification-tool.ts` | Template for creating AI tool with Zod schema validation |
| `lib/ai/tools/discovery-tool.ts` | Template for tool result structure with completion metadata |
| `electron/ipc/ai-clarification.handlers.ts` | Template for streaming AI handler with Vercel AI SDK |
| `electron/ipc/ai-discovery.handlers.ts` | Template for AI handler with progress updates |
| `electron/ipc/ai-plan.handlers.ts` | **EXISTING PLACEHOLDER** - Contains stub to be replaced |

### Workflow Component Templates

| File | Purpose |
|------|---------|
| `components/features/clarify-step.tsx` | Template for step wrapper with settings panel, run history |
| `components/features/discover-step.tsx` | Template for step with progress states |
| `components/features/clarification/clarification-panel.tsx` | Template for AI panel with status-based rendering |
| `components/features/discovery/discovery-results.tsx` | Template for results display with filtering, editing |

### Hook Templates

| File | Purpose |
|------|---------|
| `hooks/use-clarification.ts` | Template for AI workflow hook with streaming |
| `hooks/use-discovery.ts` | Template for discovery hook with progress tracking |

### Validation Schema Templates

| File | Purpose |
|------|---------|
| `lib/validations/clarification.ts` | Template for status enum, structured data schemas |
| `lib/validations/discovery.ts` | Template for complex validation schemas |

## Files to Modify

### Critical - IPC Infrastructure

| File | Changes Needed |
|------|----------------|
| `electron/ipc/ai-plan.handlers.ts` | Replace placeholder with real AI integration |
| `electron/ipc/channels.ts` | Already has plan channels (no changes needed) |
| `electron/preload.ts` | Already has plan API (no changes needed) |
| `types/electron.ts` | May need updates if types change |

### High Priority - Feature Page

| File | Changes Needed |
|------|----------------|
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Add PlanStep component |

## Files to Create

### Critical - AI Integration (8.1)

| File | Purpose |
|------|---------|
| `lib/ai/prompts/plan.ts` | Plan prompt template |
| `lib/ai/tools/plan-tool.ts` | Plan tool definition with Zod schema |

### Critical - Validation Schemas (8.5)

| File | Purpose |
|------|---------|
| `lib/validations/plan.ts` | Zod schemas for plan data structures |

### High Priority - Hook and Step

| File | Purpose |
|------|---------|
| `hooks/use-plan.ts` | Plan workflow hook |
| `components/features/plan-step.tsx` | Main plan step wrapper |

### High Priority - Plan Display Components (8.2)

| File | Purpose |
|------|---------|
| `components/features/plan/plan-panel.tsx` | Main plan generation panel |
| `components/features/plan/plan-progress.tsx` | Progress display |
| `components/features/plan/plan-results.tsx` | Complete plan display |
| `components/features/plan/plan-step-card.tsx` | Individual step display |
| `components/features/plan/quality-gate-list.tsx` | Quality gates checklist |

### Medium Priority - Export (8.3)

| File | Purpose |
|------|---------|
| `components/features/plan/export-dialog.tsx` | Export options dialog |
| `components/features/plan/plan-cost-estimate.tsx` | Cost estimation display |

## File Categorization by Priority

### Critical (Blocks other work)

1. `lib/validations/plan.ts` - Core types
2. `lib/ai/prompts/plan.ts` - Prompt template
3. `lib/ai/tools/plan-tool.ts` - AI tool
4. `electron/ipc/ai-plan.handlers.ts` - **MODIFY** - Real AI

### High (Core functionality)

5. `hooks/use-plan.ts` - State management
6. `components/features/plan-step.tsx` - Step wrapper
7. `components/features/plan/plan-panel.tsx` - Main panel
8. `components/features/plan/plan-results.tsx` - Results
9. `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - **MODIFY**

### Medium (After core)

10. `components/features/plan/plan-progress.tsx`
11. `components/features/plan/plan-step-card.tsx`
12. `components/features/plan/quality-gate-list.tsx`
13. `components/features/plan/plan-cost-estimate.tsx`

### Low (Polish)

14. `components/features/plan/export-dialog.tsx`
15. `lib/queries/plan.ts` (if needed)

## Architecture Insights

### Existing Patterns

1. **AI Step Pattern**: Prompt builder + Tool definition + IPC handler + Hook + Step component + Panel component
2. **Streaming Architecture**: IPC channels with `onStream` pattern, abort controller for cancellation
3. **Run Management**: `FeatureRequestRun` records with serialized JSON
4. **State Restoration**: `restoreFromRun` and `currentRun` tracking
5. **Thinking Mode**: `enableThinking` flag and `thinkingBudget` parameter

### Integration Points

1. **Plan receives context from**: Feature request, clarification, discovered files, repository overviews
2. **Plan outputs to**: `featureRequests.implementationPlan` field, `featureRequestRuns` table, export
3. **Existing IPC channels**: `ai:plan:generate`, `ai:plan:stream`, `ai:plan:cancel`

## File Path Validation

All discovered files validated to exist or are new files to be created.

---

**Progress Marker**: `MILESTONE:STEP_2_COMPLETE`
