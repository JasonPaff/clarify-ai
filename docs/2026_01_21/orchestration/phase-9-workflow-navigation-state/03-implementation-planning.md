# Phase 9: Workflow Navigation & State - Implementation Planning

**Step**: 3 - Implementation Planning
**Start Time**: 2026-01-21T00:03:00.000Z
**End Time**: 2026-01-21T00:04:30.000Z
**Duration**: ~90 seconds
**Status**: Completed

## Refined Request Used

Implement Phase 9 (Workflow Navigation & State) to establish comprehensive workflow-level behaviors for the four-step AI orchestration pipeline (Describe, Clarify, Discover, Plan) in this Electron-based Next.js desktop application. The existing workflow-steps.tsx component already provides the stepper UI with checkmarks, stale warning icons (via AlertTriangle), click navigation to completed steps, and current step highlighting using the stale steps passed from the parent component. The use-stale-steps.ts hook provides markStale, clearStale, and isStale utilities that persist stale state as JSON in the feature request's staleSteps field. Building on this foundation, Phase 9 requires implementing step transition logic with soft validation that warns users about incomplete data (such as missing repository selection, empty feature description, or incomplete clarification answers) while still allowing them to proceed by acknowledging warnings through confirmation dialogs. A critical requirement is the leave warning system that detects when AI operations are running (streaming clarification, discovery, or plan generation) and prevents navigation away from the step by showing a confirmation dialog that integrates the existing cancel-ai-dialog.tsx component, which currently exists but is not wired into the navigation flow. This should also implement beforeunload handling to prevent browser/Electron window closure during active AI operations. The auto-save status indicators need standardization across all workflow steps, using the saveStatusText pattern already established in describe-step.tsx (showing "Saving...", "Last saved X ago", or "Not saved yet") for consistency. Save error handling must provide clear user feedback through Alert components with retry messaging, following the existing pattern in describe-step.tsx that displays "Failed to save changes. Your content is preserved locally and will be retried automatically." Finally, create a centralized stale detection utility in lib/workflow/stale-detection.ts that encapsulates the step dependency graph (Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan) and provides functions to determine which downstream steps should be marked stale when an upstream step's output changes, consolidating the scattered stale marking logic currently embedded in individual step components.

## File Discovery Summary

- Critical files: 4 (workflow page, stepper, stale hooks, cancel dialog)
- High priority files: 8 (step components, AI hooks)
- New file to create: 1 (`lib/workflow/stale-detection.ts`)
- Supporting files: 20+

## Agent Prompt Sent

Generate an implementation plan in MARKDOWN format following the template with:
- Overview, Quick Summary, Prerequisites
- Implementation Steps with What/Why/Confidence/Files/Changes/Validation Commands/Success Criteria
- Quality Gates, Notes
- Codex review checkpoints at logical points and as final step

## Agent Response Summary

Generated a 21-step implementation plan covering:

1. **Steps 1-7**: Foundation components
   - Centralized stale detection utility
   - Step validation utility
   - Step transition warning dialog
   - Workflow context provider
   - Leave warning hook
   - Auto-save status component
   - Save error alert component

2. **Step 8**: Codex review checkpoint for foundation

3. **Steps 9-16**: Integration work
   - Workflow provider into app layout
   - Feature workflow page with step transition logic
   - WorkflowSteps with navigation blocking
   - Update all step components (Clarify, Discover, Plan, Describe)
   - ClarificationPanel AI operation registration

4. **Step 17**: Codex review checkpoint for integration

5. **Steps 18-20**: Final enhancements
   - useStaleSteps hook enhancement
   - BeforeUnload handler
   - Integration test plan document

6. **Step 21**: Final Codex review

## Plan Format Validation

- Format: Markdown (not XML) ✓
- Sections: Overview, Quick Summary, Prerequisites, Implementation Steps, Quality Gates, Notes ✓
- Validation commands: `pnpm run lint:fix && pnpm run typecheck` included in each step ✓
- Codex review gates: Steps 8, 17, 21 ✓
- No code examples: Plan contains instructions only ✓
- Actionable steps: 21 concrete implementation steps ✓

## Complexity Assessment

**Estimated Duration**: 3-4 days
**Complexity**: Medium
**Risk Level**: Medium

## Quality Gate Results

- Template compliance: Pass
- Codex review gates included: Pass
- Validation commands included: Pass
- No code examples: Pass
