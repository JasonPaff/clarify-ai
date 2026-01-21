# Step 2 - File Discovery

**Status**: Completed
**Timestamp Start**: 2026-01-20T00:01:00Z
**Timestamp End**: 2026-01-20T00:02:30Z
**Duration**: ~90 seconds

## Input

The refined feature request for Phase 7: Discover Step Implementation.

## AI-Powered Discovery Analysis

### Exploration Summary
- Explored 15+ directories
- Examined 60+ candidate files
- Found 25 highly relevant files (Critical/High priority)
- Identified 30+ supporting files (Medium/Low priority)

## Discovered Files by Priority

### Critical Priority (Primary Implementation Targets)

| # | File Path | Relevance | Action |
|---|-----------|-----------|--------|
| 1 | `components/features/research-step.tsx` | Current placeholder - will be replaced | Modify |
| 2 | `components/features/clarify-step.tsx` | Primary reference pattern | Reference |
| 3 | `electron/ipc/ai-discovery.handlers.ts` | Placeholder handler - needs full implementation | Modify |
| 4 | `electron/ipc/channels.ts` | IPC channels (already defined) | Reference |
| 5 | `electron/preload.ts` | Discovery API exposure (already configured) | May Modify |
| 6 | `types/electron.ts` | Discovery type re-exports | May Modify |

### High Priority (Will Need Changes)

| # | File Path | Relevance | Action |
|---|-----------|-----------|--------|
| 7 | `components/features/workflow/step-settings-panel.tsx` | Reusable settings panel | Use |
| 8 | `components/features/workflow/run-history-dropdown.tsx` | Run history selector | Use |
| 9 | `components/features/workflow/stale-warning-banner.tsx` | Stale warning component | Use |
| 10 | `components/features/workflow/repository-overview-status-panel.tsx` | Overview status check | Use |
| 11 | `hooks/use-clarification.ts` | Reference pattern (~890 lines) | Reference |
| 12 | `lib/validations/clarification.ts` | Validation schema pattern | Reference |
| 13 | `db/schema/feature-request-runs.schema.ts` | Run storage (supports 'research') | Reference |
| 14 | `db/schema/feature-requests.schema.ts` | researchFindings field | May Modify |
| 15 | `hooks/queries/use-feature-request-runs.ts` | Run query hooks | Use |
| 16 | `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Feature page (renders step) | Modify |

### Medium Priority (Reference/Supporting Files)

| # | File Path | Relevance | Action |
|---|-----------|-----------|--------|
| 17 | `components/features/describe-step.tsx` | Repository context patterns | Reference |
| 18 | `components/features/workflow-steps.tsx` | Step indicator | Reference |
| 19 | `components/features/clarification/clarification-panel.tsx` | AI panel structure | Reference |
| 20 | `components/features/clarification/streaming-analysis.tsx` | Streaming display | May Reuse |
| 21 | `components/features/clarification/cost-estimate.tsx` | Cost estimation pattern | Reference |
| 22 | `electron/ipc/ai-clarification.handlers.ts` | AI handler pattern | Reference |
| 23 | `lib/ai/tools/clarification-tool.ts` | Tool definition pattern | Reference |
| 24 | `lib/ai/prompts/clarification.ts` | Prompt builder pattern | Reference |
| 25 | `lib/ai/models.ts` | Model utilities | Use |
| 26 | `hooks/useElectron.ts` | Electron API hooks | Use |
| 27 | `hooks/use-stale-steps.ts` | Stale step management | Use |
| 28 | `hooks/queries/use-repository-overviews.ts` | Overview status queries | Use |
| 29 | `lib/queries/feature-request-runs.ts` | Query key factory | Reference |
| 30 | `db/schema/step-configurations.schema.ts` | Step config (supports 'research') | Reference |

### Low Priority (Context Files)

| # | File Path | Relevance | Action |
|---|-----------|-----------|--------|
| 31 | `electron/ipc/fs.handlers.ts` | File system handlers | Reference |
| 32 | `electron/ipc/lib/provider-factory.ts` | AI provider creation | Reference |
| 33 | `electron/ipc/lib/repository-scanner.ts` | Repo scanning utilities | May Use |
| 34 | `components/ui/badge.tsx` | Badge component | Use |
| 35 | `components/ui/collapsible.tsx` | Collapsible component | Use |
| 36 | `components/ui/alert.tsx` | Alert component | Use |
| 37 | `components/ui/button.tsx` | Button component | Use |
| 38 | `components/ui/card.tsx` | Card component | Use |
| 39 | `types/component-types.ts` | Global component types | Reference |
| 40 | `lib/validations/feature-request.ts` | Feature request validation | Reference |

## Architecture Insights Discovered

### Key Patterns

1. **Step Component Pattern**: Each step component follows consistent structure:
   - Accept featureRequest and projectId props
   - Use useStepConfig for model configuration
   - Use useCurrentRun for run state
   - Use useStaleSteps for stale detection
   - Integrate StepSettingsPanel and RunHistoryDropdown
   - Include cost estimation component

2. **AI Handler Pattern**: Handlers in electron/ipc:
   - Define request/response/stream chunk types
   - Use AbortController for cancellation
   - Stream via webContents.send with chunk types
   - Support tool calling via Vercel AI SDK

3. **Streaming Hook Pattern**: useClarification provides template:
   - State for status, analysis, results, streamingText, reasoningText
   - Callbacks for start, cancel, save, reset
   - Run creation/update via mutations
   - Stream subscription/cleanup

4. **Validation Pattern**: Zod schemas with parse/stringify helpers for JSON serialization.

5. **IPC Channel Pattern**: Channels defined, handlers registered, preload exposes to renderer.

### Existing Discovery Infrastructure

The discovery step already has:
- IPC channels defined (ai.discovery.cancel, generate, stream)
- Handler file with placeholder implementation
- Type exports in types/electron.ts
- Basic ResearchStep component (needs replacement)

## Components to Create

### New Components
1. `components/features/discover-step.tsx` (rename/replace research-step.tsx)
2. `components/features/discovery/scope-selector.tsx`
3. `components/features/discovery/folder-tree.tsx`
4. `components/features/discovery/discovery-progress.tsx`
5. `components/features/discovery/discovery-results.tsx`
6. `components/features/discovery/file-card.tsx`
7. `components/features/discovery/file-card-editor.tsx`
8. `components/features/discovery/add-file-dialog.tsx`
9. `components/features/discovery/discovery-cost-estimate.tsx`

### New AI Integration Files
1. `lib/ai/prompts/discovery.ts`
2. `lib/ai/tools/discovery-tool.ts`
3. Full implementation in `electron/ipc/ai-discovery.handlers.ts`

### New Validation File
1. `lib/validations/discovery.ts`

### New Hook
1. `hooks/use-discovery.ts`

## File Validation Results

All discovered file paths were validated to exist in the codebase:
- 40 files discovered
- 40 files validated as existing
- 0 files missing

## Discovery Statistics

| Category | Count |
|----------|-------|
| Critical Priority | 6 |
| High Priority | 10 |
| Medium Priority | 14 |
| Low Priority | 10 |
| **Total Files** | **40** |
| Files to Create | ~12 |
| Files to Modify | ~5 |
