# Phase 9: Workflow Navigation & State - File Discovery

**Step**: 2 - File Discovery
**Start Time**: 2026-01-21T00:02:00.000Z
**End Time**: 2026-01-21T00:02:45.000Z
**Duration**: ~45 seconds
**Status**: Completed

## Refined Request Used

Implement Phase 9 (Workflow Navigation & State) to establish comprehensive workflow-level behaviors for the four-step AI orchestration pipeline (Describe, Clarify, Discover, Plan) in this Electron-based Next.js desktop application. The existing workflow-steps.tsx component already provides the stepper UI with checkmarks, stale warning icons (via AlertTriangle), click navigation to completed steps, and current step highlighting using the stale steps passed from the parent component. The use-stale-steps.ts hook provides markStale, clearStale, and isStale utilities that persist stale state as JSON in the feature request's staleSteps field. Building on this foundation, Phase 9 requires implementing step transition logic with soft validation that warns users about incomplete data (such as missing repository selection, empty feature description, or incomplete clarification answers) while still allowing them to proceed by acknowledging warnings through confirmation dialogs. A critical requirement is the leave warning system that detects when AI operations are running (streaming clarification, discovery, or plan generation) and prevents navigation away from the step by showing a confirmation dialog that integrates the existing cancel-ai-dialog.tsx component, which currently exists but is not wired into the navigation flow. This should also implement beforeunload handling to prevent browser/Electron window closure during active AI operations. The auto-save status indicators need standardization across all workflow steps, using the saveStatusText pattern already established in describe-step.tsx (showing "Saving...", "Last saved X ago", or "Not saved yet") for consistency. Save error handling must provide clear user feedback through Alert components with retry messaging, following the existing pattern in describe-step.tsx that displays "Failed to save changes. Your content is preserved locally and will be retried automatically." Finally, create a centralized stale detection utility in lib/workflow/stale-detection.ts that encapsulates the step dependency graph (Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan) and provides functions to determine which downstream steps should be marked stale when an upstream step's output changes, consolidating the scattered stale marking logic currently embedded in individual step components.

## AI File Discovery Analysis

### Summary Statistics
- Explored: 12+ directories
- Examined: 45+ candidate files
- Found: 18 highly relevant files + 16 supporting files

## Discovered Files

### Critical Priority (Core Implementation)

| File | Exists | Relevance |
|------|--------|-----------|
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Yes | Primary workflow page orchestrator - step navigation, leave warnings, navigation guards |
| `components/features/workflow-steps.tsx` | Yes | Stepper UI component - checkmarks, stale icons, click navigation |
| `hooks/use-stale-steps.ts` | Yes | Stale steps management hook - markStale, clearStale, isStale |
| `components/features/workflow/cancel-ai-dialog.tsx` | Yes | Cancel AI confirmation dialog - needs integration into navigation |

### High Priority (Step Components)

| File | Exists | Relevance |
|------|--------|-----------|
| `components/features/describe-step.tsx` | Yes | Reference implementation for saveStatusText and save error handling |
| `components/features/clarify-step.tsx` | Yes | Needs auto-save status standardization |
| `components/features/discover-step.tsx` | Yes | Needs auto-save status standardization |
| `components/features/plan-step.tsx` | Yes | Needs auto-save status standardization |

### High Priority (AI Hooks - Running State Detection)

| File | Exists | Relevance |
|------|--------|-----------|
| `hooks/use-clarification.ts` | Yes | isLoading state, cancelClarification method |
| `hooks/use-discovery.ts` | Yes | isLoading state, cancelDiscovery method |
| `hooks/use-plan.ts` | Yes | isLoading state, cancelPlanGeneration method |

### High Priority (New File)

| File | Exists | Relevance |
|------|--------|-----------|
| `lib/workflow/stale-detection.ts` | **TO CREATE** | Centralized stale detection with step dependency graph |

### Medium Priority (Supporting Components)

| File | Exists | Relevance |
|------|--------|-----------|
| `components/features/workflow/stale-warning-banner.tsx` | Yes | Alert-based warning with Re-run/Dismiss actions |
| `components/ui/alert.tsx` | Yes | CVA-based alert for save error handling |
| `components/ui/dialog.tsx` | Yes | Base dialog wrapper |
| `components/features/workflow/discard-results-dialog.tsx` | Yes | Reference for confirmation dialogs |
| `components/features/workflow/restore-run-dialog.tsx` | Yes | Reference for confirmation dialogs |
| `components/features/clarification/clarification-panel.tsx` | Yes | Uses CancelAiDialog - reference for integration |
| `components/features/plan/plan-panel.tsx` | Yes | Cancel handler reference |

### Medium Priority (Query Hooks)

| File | Exists | Relevance |
|------|--------|-----------|
| `hooks/queries/use-feature-requests.ts` | Yes | useMarkStepsStale, useClearStepsStale mutations |
| `hooks/useElectron.ts` | Yes | Electron IPC access |

### Medium Priority (Validation)

| File | Exists | Relevance |
|------|--------|-----------|
| `lib/validations/feature-request.ts` | Yes | Form schemas for soft validation |
| `lib/validations/clarification.ts` | Yes | Clarification validation patterns |

### Low Priority (Utilities)

| File | Exists | Relevance |
|------|--------|-----------|
| `hooks/use-debounced-callback.ts` | Yes | Auto-save debouncing |
| `hooks/use-controllable-state.ts` | Yes | Dialog state management |
| `components/ui/button.tsx` | Yes | Actions |
| `hooks/use-toast.ts` | Yes | Save status feedback option |
| `lib/utils.ts` | Yes | cn() utility |
| `db/schema/feature-requests.schema.ts` | Yes | staleSteps field reference |
| `types/electron.ts` | Yes | Type definitions |

### Reference Documentation

| File | Relevance |
|------|-----------|
| `docs/2026_01_20/plans/feature-request-workflow-design-spec.md` | Complete requirements |
| `docs/2026_01_20/plans/feature-request-workflow-implementation-order.md` | Phase 9 requirements |

## Architecture Insights

### Key Patterns Discovered

1. **Stale State Management**: `use-stale-steps.ts` provides `markStale`, `clearStale`, `isStale` utilities that persist to `staleSteps` JSON field

2. **AI Running Detection**: Each AI hook exposes `isLoading` boolean:
   - `use-clarification.ts` - `isLoading`, `cancelClarification()`
   - `use-discovery.ts` - `isLoading`, `cancelDiscovery()`
   - `use-plan.ts` - `isLoading`, `cancelPlanGeneration()`

3. **Cancel Dialog Pattern**: `cancel-ai-dialog.tsx` exists with `stepName` and `onConfirm` props, used in clarification-panel but NOT in navigation

4. **Auto-Save Pattern** (describe-step.tsx):
   - `saveStatusText` derived from `isSaving`, `lastSavedAt`, mutation state
   - `useDebouncedCallback` for debouncing
   - Alert component for error display

5. **Step Dependencies**:
   - Describe -> marks Clarify, Discover, Plan stale
   - Clarify -> marks Discover, Plan stale
   - Discover -> marks Plan stale

### Missing Implementations Identified

1. **beforeunload handling**: NOT implemented
2. **Navigation interception**: `setCurrentStep()` used directly without validation
3. **Centralized stale marking**: Scattered in individual step components

## File Path Validation

All discovered files validated to exist in the codebase.

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Critical files | 4 |
| High priority files | 7 + 1 to create |
| Medium priority files | 13 |
| Low priority files | 7 |
| Reference docs | 2 |
| **Total** | 34 files |
