# Phase 9: Workflow Navigation & State - Implementation Plan

**Generated**: 2026-01-21
**Original Request**: Plan the implementation of Phase 9 of the feature request workflow from `docs/2026_01_20/plans/feature-request-workflow-implementation-order.md`
**Refined Request**: Implement Phase 9 (Workflow Navigation & State) to establish comprehensive workflow-level behaviors for the four-step AI orchestration pipeline (Describe, Clarify, Discover, Plan) in this Electron-based Next.js desktop application. The existing workflow-steps.tsx component already provides the stepper UI with checkmarks, stale warning icons (via AlertTriangle), click navigation to completed steps, and current step highlighting using the stale steps passed from the parent component. The use-stale-steps.ts hook provides markStale, clearStale, and isStale utilities that persist stale state as JSON in the feature request's staleSteps field. Building on this foundation, Phase 9 requires implementing step transition logic with soft validation that warns users about incomplete data (such as missing repository selection, empty feature description, or incomplete clarification answers) while still allowing them to proceed by acknowledging warnings through confirmation dialogs. A critical requirement is the leave warning system that detects when AI operations are running (streaming clarification, discovery, or plan generation) and prevents navigation away from the step by showing a confirmation dialog that integrates the existing cancel-ai-dialog.tsx component, which currently exists but is not wired into the navigation flow. This should also implement beforeunload handling to prevent browser/Electron window closure during active AI operations. The auto-save status indicators need standardization across all workflow steps, using the saveStatusText pattern already established in describe-step.tsx (showing "Saving...", "Last saved X ago", or "Not saved yet") for consistency. Save error handling must provide clear user feedback through Alert components with retry messaging, following the existing pattern in describe-step.tsx that displays "Failed to save changes. Your content is preserved locally and will be retried automatically." Finally, create a centralized stale detection utility in lib/workflow/stale-detection.ts that encapsulates the step dependency graph (Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan) and provides functions to determine which downstream steps should be marked stale when an upstream step's output changes, consolidating the scattered stale marking logic currently embedded in individual step components.

## Analysis Summary

- Feature request refined with project context
- Discovered 34 files across multiple directories
- Generated 21-step implementation plan with Codex review gates

## File Discovery Results

### Critical Priority (Core Implementation)
| File | Relevance |
|------|-----------|
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Primary workflow page orchestrator |
| `components/features/workflow-steps.tsx` | Stepper UI component |
| `hooks/use-stale-steps.ts` | Stale steps management hook |
| `components/features/workflow/cancel-ai-dialog.tsx` | Cancel AI dialog (needs navigation integration) |

### High Priority (Step Components)
| File | Relevance |
|------|-----------|
| `components/features/describe-step.tsx` | Reference for saveStatusText pattern |
| `components/features/clarify-step.tsx` | Needs auto-save standardization |
| `components/features/discover-step.tsx` | Needs auto-save standardization |
| `components/features/plan-step.tsx` | Needs auto-save standardization |

### High Priority (AI Hooks)
| File | Relevance |
|------|-----------|
| `hooks/use-clarification.ts` | isLoading, cancelClarification |
| `hooks/use-discovery.ts` | isLoading, cancelDiscovery |
| `hooks/use-plan.ts` | isLoading, cancelPlanGeneration |

### New File to Create
| File | Relevance |
|------|-----------|
| `lib/workflow/stale-detection.ts` | Centralized stale detection utility |

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

Implement workflow-level behaviors for the four-step AI orchestration pipeline including step transition validation with soft warnings, leave warning system for active AI operations, standardized auto-save status indicators across all steps, and a centralized stale detection utility to consolidate the step dependency graph logic.

## Prerequisites

- [ ] Phase 8 (Plan Step) implementation completed and functional
- [ ] Existing use-stale-steps.ts hook working correctly with database persistence
- [ ] CancelAiDialog component exists at `components/features/workflow/cancel-ai-dialog.tsx`
- [ ] All AI hooks (use-clarification, use-discovery, use-plan) expose `isLoading` and cancel functions

## Implementation Steps

### Step 1: Create Centralized Stale Detection Utility

**What**: Create `lib/workflow/stale-detection.ts` to encapsulate the step dependency graph and stale propagation logic.
**Why**: Consolidates scattered stale marking logic currently embedded in individual step components into a single source of truth for step dependencies.
**Confidence**: High

**Files to Create:**
- `lib/workflow/stale-detection.ts` - Stale detection utility with step dependency graph

**Changes:**
- Define `STEP_DEPENDENCY_GRAPH` constant mapping each step to its downstream dependent steps
- Create `getDownstreamSteps(step: StepId)` function that returns all steps that should be marked stale when the given step changes
- Create `getUpstreamSteps(step: StepId)` function that returns all steps that the given step depends on
- Create `shouldMarkStale(changedStep: StepId, targetStep: StepId)` function to check if a specific step should be marked stale
- Export `StepId` type consistent with existing `STEP_ORDER` in the feature workflow page

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New file created at `lib/workflow/stale-detection.ts`
- [ ] Step dependency graph correctly models: Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan
- [ ] All exported functions are properly typed with TypeScript
- [ ] All validation commands pass

---

### Step 2: Create Step Validation Utility

**What**: Create `lib/workflow/step-validation.ts` with soft validation functions for each workflow step.
**Why**: Centralizes validation logic to warn users about incomplete data while still allowing them to proceed with acknowledgment.
**Confidence**: High

**Files to Create:**
- `lib/workflow/step-validation.ts` - Step validation utility with soft warnings

**Changes:**
- Define `ValidationWarning` interface with `type`, `message`, and `severity` fields
- Create `validateDescribeStep(featureRequest)` function checking for missing repository selection and empty feature description
- Create `validateClarifyStep(featureRequest)` function checking for incomplete clarification answers
- Create `validateDiscoverStep(featureRequest)` function checking for empty discovery results
- Create `validatePlanStep(featureRequest)` function checking for prerequisite step completion
- Create `getStepWarnings(step: StepId, featureRequest)` function that aggregates all warnings for a given step

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New file created at `lib/workflow/step-validation.ts`
- [ ] Each validation function returns an array of `ValidationWarning` objects
- [ ] Validation is soft (returns warnings, not errors that block navigation)
- [ ] All validation commands pass

---

### Step 3: Create Step Transition Warning Dialog Component

**What**: Create `components/features/workflow/step-transition-warning-dialog.tsx` for displaying soft validation warnings before step navigation.
**Why**: Provides a user-friendly way to acknowledge incomplete data warnings while allowing users to proceed.
**Confidence**: High

**Files to Create:**
- `components/features/workflow/step-transition-warning-dialog.tsx` - Confirmation dialog for step transitions with warnings

**Changes:**
- Create dialog component using `@base-ui/react/alert-dialog` following the pattern in `discard-results-dialog.tsx`
- Accept `warnings: Array<ValidationWarning>` prop to display validation warnings
- Accept `targetStep: string` prop to indicate which step the user is navigating to
- Accept `onConfirm` callback to proceed with navigation despite warnings
- Accept `onCancel` callback to cancel navigation
- Display warnings in a bulleted list format using `AlertDescription`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New dialog component created following Base UI patterns
- [ ] Dialog displays validation warnings in a clear, readable format
- [ ] Dialog has "Proceed Anyway" and "Cancel" buttons
- [ ] All validation commands pass

---

### Step 4: Create Workflow Context for AI Operation State

**What**: Create `components/providers/workflow-provider.tsx` to manage workflow-level state including active AI operations.
**Why**: Provides a centralized place to track which AI operations are currently running, enabling the leave warning system and navigation blocking.
**Confidence**: High

**Files to Create:**
- `components/providers/workflow-provider.tsx` - Context provider for workflow state

**Changes:**
- Create `WorkflowContext` with `activeAiOperations: Array<StepId>` state
- Provide `registerAiOperation(step: StepId)` function to mark an AI operation as running
- Provide `unregisterAiOperation(step: StepId)` function to mark an AI operation as completed
- Provide `isAnyAiOperationRunning` computed boolean
- Provide `getActiveOperationStep()` function to get the currently running operation step name

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New context provider created at `components/providers/workflow-provider.tsx`
- [ ] Context properly tracks active AI operations by step
- [ ] All validation commands pass

---

### Step 5: Create Leave Warning Hook

**What**: Create `hooks/use-leave-warning.ts` hook to prevent navigation away from pages with active AI operations.
**Why**: Integrates with the workflow context to show the CancelAiDialog when users attempt to navigate away during active AI operations.
**Confidence**: High

**Files to Create:**
- `hooks/use-leave-warning.ts` - Hook for navigation blocking during AI operations

**Changes:**
- Accept `isActive: boolean` parameter indicating if an AI operation is running
- Accept `stepName: string` parameter for the dialog message
- Accept `onCancel: () => void` callback to cancel the AI operation
- Implement `beforeunload` event handler for browser/Electron window closure prevention
- Return `{ showWarning: boolean, handleNavigation: (proceed: boolean) => void }` for controlled navigation
- Expose state for parent components to render CancelAiDialog when navigation is blocked

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New hook created at `hooks/use-leave-warning.ts`
- [ ] Hook correctly sets up `beforeunload` event listener when AI operation is active
- [ ] Hook provides API for blocking and allowing navigation
- [ ] All validation commands pass

---

### Step 6: Create Auto-Save Status Component

**What**: Create `components/features/workflow/auto-save-status.tsx` component that standardizes the save status display pattern.
**Why**: Ensures consistent save status indicators ("Saving...", "Last saved X ago", "Not saved yet") across all workflow steps.
**Confidence**: High

**Files to Create:**
- `components/features/workflow/auto-save-status.tsx` - Standardized save status indicator component

**Changes:**
- Accept `isSaving: boolean` prop for showing "Saving..." state
- Accept `lastSavedAt: Date | null` prop for showing relative time
- Accept `hasUnsavedChanges: boolean` prop for showing "Not saved yet" state
- Use `formatDistanceToNow` from `date-fns` for relative time formatting (following describe-step.tsx pattern)
- Apply consistent styling with `text-xs text-muted-foreground` class

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New component created at `components/features/workflow/auto-save-status.tsx`
- [ ] Component displays "Saving..." when `isSaving` is true
- [ ] Component displays "Last saved X ago" when `lastSavedAt` is provided
- [ ] Component displays "Not saved yet" when no save has occurred
- [ ] All validation commands pass

---

### Step 7: Create Save Error Alert Component

**What**: Create `components/features/workflow/save-error-alert.tsx` component for standardized save error handling.
**Why**: Provides consistent save error feedback with retry messaging across all workflow steps.
**Confidence**: High

**Files to Create:**
- `components/features/workflow/save-error-alert.tsx` - Standardized save error alert component

**Changes:**
- Accept `error: Error | null` prop to conditionally render
- Accept `onRetry?: () => void` optional callback for manual retry
- Display error message with destructive variant Alert
- Include standard message: "Failed to save changes. Your content is preserved locally and will be retried automatically."
- Use existing Alert component with AlertCircle icon (following describe-step.tsx pattern)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New component created at `components/features/workflow/save-error-alert.tsx`
- [ ] Component only renders when error is present
- [ ] Component follows the existing error display pattern from describe-step.tsx
- [ ] All validation commands pass

---

### Step 8: Run Codex Code Review - Foundation Components

**What**: Run Codex code review on foundation components created in Steps 1-7.
**Why**: Ensures code quality and catches potential issues before integrating into the main workflow.
**Confidence**: High

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] /codex-review passes on all new files in `lib/workflow/` and `components/features/workflow/`
- [ ] All issues identified by Codex review are addressed
- [ ] All validation commands pass

---

### Step 9: Integrate Workflow Provider into App Layout

**What**: Add `WorkflowProvider` to the app layout to make workflow context available throughout the application.
**Why**: Enables all workflow components to access the centralized AI operation tracking state.
**Confidence**: High

**Files to Modify:**
- `app/(app)/layout.tsx` - Add WorkflowProvider to the provider hierarchy

**Changes:**
- Import `WorkflowProvider` from `@/components/providers/workflow-provider`
- Wrap existing content with `WorkflowProvider` component inside the existing provider hierarchy
- Maintain proper nesting order with QueryProvider and ThemeProvider

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] WorkflowProvider added to app layout
- [ ] Provider hierarchy maintained correctly
- [ ] All validation commands pass

---

### Step 10: Update Feature Workflow Page with Step Transition Logic

**What**: Enhance `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` with step transition validation and leave warning integration.
**Why**: Implements the soft validation and navigation blocking at the workflow orchestrator level.
**Confidence**: Medium

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Main workflow page

**Changes:**
- Import step validation utilities from `lib/workflow/step-validation`
- Import `useLeaveWarning` hook for navigation blocking
- Import `StepTransitionWarningDialog` component
- Add state for pending navigation and warnings
- Modify `handleGoNext` and `handleGoBack` to check for validation warnings before navigating
- Add state to track if CancelAiDialog should be shown for blocked navigation
- Integrate leave warning system with `beforeunload` handling

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Step navigation now checks for validation warnings
- [ ] Warning dialog shown when navigating with incomplete data
- [ ] Leave warning prevents navigation when AI operation is active
- [ ] All validation commands pass

---

### Step 11: Update WorkflowSteps Component with Navigation Blocking

**What**: Enhance `components/features/workflow-steps.tsx` to integrate with leave warning system and show CancelAiDialog when navigation is blocked.
**Why**: Connects the stepper UI to the navigation blocking system for consistent behavior across all navigation methods.
**Confidence**: Medium

**Files to Modify:**
- `components/features/workflow-steps.tsx` - Stepper UI component

**Changes:**
- Accept new `isAiOperationActive: boolean` prop
- Accept new `activeOperationStepName: string | null` prop
- Accept new `onCancelAiOperation: () => void` prop
- Integrate CancelAiDialog for blocked step navigation
- Show CancelAiDialog when user clicks on a step while AI operation is active
- Disable navigation buttons during active AI operations with visual indication

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] WorkflowSteps accepts new props for AI operation state
- [ ] CancelAiDialog integrated for navigation blocking
- [ ] Navigation buttons show disabled state during AI operations
- [ ] All validation commands pass

---

### Step 12: Update ClarifyStep with Auto-Save Status and Save Error Components

**What**: Refactor `components/features/clarify-step.tsx` to use standardized auto-save status and save error components.
**Why**: Standardizes the save status display across all workflow steps.
**Confidence**: High

**Files to Modify:**
- `components/features/clarify-step.tsx` - Clarify step component

**Changes:**
- Import `AutoSaveStatus` component from `components/features/workflow/auto-save-status`
- Import `SaveErrorAlert` component from `components/features/workflow/save-error-alert`
- Replace any custom save status display with `AutoSaveStatus` component
- Add save error handling using `SaveErrorAlert` component
- Track `lastSavedAt` state for clarification answers

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] ClarifyStep uses standardized AutoSaveStatus component
- [ ] Save error handling uses SaveErrorAlert component
- [ ] Save status pattern consistent with describe-step.tsx
- [ ] All validation commands pass

---

### Step 13: Update DiscoverStep with Auto-Save Status and AI Operation Registration

**What**: Refactor `components/features/discover-step.tsx` to use standardized components and register AI operations with workflow context.
**Why**: Ensures consistent UX across discovery step and enables leave warning system.
**Confidence**: High

**Files to Modify:**
- `components/features/discover-step.tsx` - Discover step component

**Changes:**
- Import and use `AutoSaveStatus` component for discovery results save status
- Import and use `SaveErrorAlert` component for error handling
- Import `useWorkflow` hook from workflow context
- Call `registerAiOperation('research')` when discovery starts
- Call `unregisterAiOperation('research')` when discovery completes or fails
- Track `lastSavedAt` state for discovery results

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] DiscoverStep uses standardized save status components
- [ ] AI operation registered with workflow context during discovery
- [ ] All validation commands pass

---

### Step 14: Update PlanStep with Auto-Save Status and AI Operation Registration

**What**: Refactor `components/features/plan-step.tsx` to use standardized components and register AI operations with workflow context.
**Why**: Ensures consistent UX across plan step and enables leave warning system.
**Confidence**: High

**Files to Modify:**
- `components/features/plan-step.tsx` - Plan step component

**Changes:**
- Import and use `AutoSaveStatus` component for plan save status
- Import and use `SaveErrorAlert` component for error handling
- Import `useWorkflow` hook from workflow context
- Call `registerAiOperation('plan')` when plan generation starts
- Call `unregisterAiOperation('plan')` when plan generation completes or fails
- Track `lastSavedAt` state for implementation plan

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] PlanStep uses standardized save status components
- [ ] AI operation registered with workflow context during plan generation
- [ ] All validation commands pass

---

### Step 15: Update DescribeStep to Use Centralized Stale Detection

**What**: Refactor `components/features/describe-step.tsx` to use the centralized stale detection utility instead of hardcoded step arrays.
**Why**: Consolidates stale marking logic and ensures consistency with the step dependency graph.
**Confidence**: High

**Files to Modify:**
- `components/features/describe-step.tsx` - Describe step component

**Changes:**
- Import `getDownstreamSteps` from `lib/workflow/stale-detection`
- Replace hardcoded `['refine']` array with `getDownstreamSteps('describe')`
- Update any other hardcoded step dependency references to use the centralized utility

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] DescribeStep uses centralized stale detection utility
- [ ] Hardcoded step arrays replaced with utility function calls
- [ ] All validation commands pass

---

### Step 16: Update ClarificationPanel with AI Operation Registration

**What**: Enhance `components/features/clarification/clarification-panel.tsx` to register AI operations with workflow context.
**Why**: Enables leave warning system during clarification AI operations.
**Confidence**: High

**Files to Modify:**
- `components/features/clarification/clarification-panel.tsx` - Clarification panel component

**Changes:**
- Import `useWorkflow` hook from workflow context
- Call `registerAiOperation('refine')` when clarification starts
- Call `unregisterAiOperation('refine')` when clarification completes, fails, or is cancelled
- Ensure cleanup happens in all code paths (success, error, cancel)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] ClarificationPanel registers AI operation with workflow context
- [ ] Proper cleanup in all termination scenarios
- [ ] All validation commands pass

---

### Step 17: Run Codex Code Review - Integration Changes

**What**: Run Codex code review on all modified step components and workflow integrations.
**Why**: Ensures code quality for the integration layer before final testing.
**Confidence**: High

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] /codex-review passes on all modified files
- [ ] All issues identified by Codex review are addressed
- [ ] All validation commands pass

---

### Step 18: Update useStaleSteps Hook to Use Centralized Detection

**What**: Enhance `hooks/use-stale-steps.ts` to optionally use the centralized stale detection utility for marking downstream steps.
**Why**: Provides a convenient API for marking all downstream steps as stale with a single call.
**Confidence**: High

**Files to Modify:**
- `hooks/use-stale-steps.ts` - Stale steps management hook

**Changes:**
- Import `getDownstreamSteps` from `lib/workflow/stale-detection`
- Add `markDownstreamStale(step: StepId)` function that automatically marks all downstream steps as stale
- Maintain backward compatibility with existing `markStale` function
- Document the new function in the hook's JSDoc

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] useStaleSteps hook has new `markDownstreamStale` function
- [ ] Existing `markStale` function remains unchanged for backward compatibility
- [ ] All validation commands pass

---

### Step 19: Add BeforeUnload Handler to Feature Workflow Page

**What**: Implement `beforeunload` event handling in the feature workflow page to prevent window closure during AI operations.
**Why**: Prevents accidental loss of data when users close the browser/Electron window during active AI operations.
**Confidence**: Medium

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Main workflow page

**Changes:**
- Use the `useLeaveWarning` hook configured with the workflow context's active operation state
- Ensure `beforeunload` event listener is added/removed based on AI operation state
- Display appropriate message in the browser's native confirmation dialog

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] BeforeUnload handler prevents window closure during active AI operations
- [ ] Handler is cleaned up when AI operations complete
- [ ] All validation commands pass

---

### Step 20: Create Integration Test Plan Document

**What**: Create a test plan document for manual verification of all Phase 9 features.
**Why**: Ensures comprehensive testing coverage for workflow navigation and state management features.
**Confidence**: High

**Files to Create:**
- `docs/2026_01_21/implementation/phase-9-workflow-navigation/test-plan.md` - Manual test plan

**Changes:**
- Document test scenarios for step transition validation warnings
- Document test scenarios for leave warning during AI operations
- Document test scenarios for auto-save status consistency
- Document test scenarios for stale detection propagation
- Document test scenarios for beforeunload handling

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Test plan document created with comprehensive coverage
- [ ] All critical user flows documented
- [ ] Edge cases and error scenarios included

---

### Step 21: Final Codex Code Review

**What**: Run comprehensive Codex code review on all Phase 9 changes.
**Why**: Final quality gate to ensure code meets project standards before completion.
**Confidence**: High

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] /codex-review passes on all Phase 9 files
- [ ] All issues identified by Codex review are addressed
- [ ] All validation commands pass
- [ ] No regressions in existing functionality

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Codex code review passes at checkpoints (Steps 8, 17, 21)
- [ ] Step transition validation warnings display correctly
- [ ] Leave warning system blocks navigation during active AI operations
- [ ] CancelAiDialog integrates correctly with navigation flow
- [ ] Auto-save status displays consistently across all steps
- [ ] Save error alerts follow established pattern
- [ ] Stale detection utility correctly models step dependencies
- [ ] BeforeUnload handling prevents accidental window closure

## Notes

1. **Backward Compatibility**: The useStaleSteps hook maintains backward compatibility - existing code using `markStale` will continue to work.

2. **Soft Validation**: All step validation is "soft" - it warns users but does not block them from proceeding if they acknowledge the warnings.

3. **AI Operation Tracking**: The workflow context tracks AI operations by step ID, allowing multiple operations to be tracked simultaneously if needed in the future.

4. **CancelAiDialog Integration**: The existing CancelAiDialog component is reused for both in-step cancellation and navigation blocking, ensuring consistent UX.

5. **BeforeUnload Limitation**: The `beforeunload` event in Electron may behave differently than in standard browsers. Testing in the actual Electron environment is essential.

6. **Step Dependency Graph**: The centralized utility defines: Describe -> [Clarify, Discover, Plan], Clarify -> [Discover, Plan], Discover -> [Plan]. This matches the existing scattered logic but provides a single source of truth.
