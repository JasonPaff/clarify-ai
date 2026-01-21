# Step 17: Codex Code Review - Integration Changes

**Status**: ⚠️ ISSUES FOUND - ADDRESSING

## Review Mode
Uncommitted changes (integration changes from Steps 9-16)

## Issues Found

### [P2] Wire cancel action for running AI operations
**File**: `app/(app)/projects/[projectId]/features/[featureId]/page.tsx:309-318`
**Severity**: P2 - User-visible behavior bug

**Problem**: When an AI operation is running and the user clicks another step, the cancel dialog appears but no cancel callback is provided. Confirmation just navigates away without stopping the ongoing run, leaving the background AI generation running.

**Fix Required**: Pass `onCancelAiOperation` and `activeOperationStepName` props to WorkflowSteps.

### [P3] Preserve discovery error details instead of save alert
**File**: `components/features/discover-step.tsx:330`
**Severity**: P3 - UX regression

**Problem**: Discovery failures are surfaced via `SaveErrorAlert`, which shows a generic "Failed to save changes" message and hides the actual error. This is misleading.

**Fix Required**: Keep the original error display or include the real error text so users can see why discovery failed.

## Fixes Applied

### P2 Fix - Wire cancel action
Implemented ref-based pattern to wire cancel functionality:
- Feature page creates `cancelCallbackRef` holding current step's cancel function
- Each step component registers their cancel function when AI operation starts
- `handleCancelAiOperation` invokes the registered cancel function
- Passed `activeOperationStepName` and `onCancelAiOperation` to WorkflowSteps

Files modified:
- `page.tsx` - Added cancel callback ref and handler
- `clarify-step.tsx` - Added cancel registration
- `clarification-panel.tsx` - Register cancelClarification
- `discover-step.tsx` - Register cancelDiscovery
- `plan-step.tsx` - Added cancel registration
- `plan-panel.tsx` - Register cancelPlanGeneration

### P3 Fix - Preserve discovery error details
- Removed SaveErrorAlert (showed generic message)
- Added proper Alert component with actual error message
- Users now see the real error (e.g., missing model config)

## Final Status
✅ All issues addressed and validation passing
