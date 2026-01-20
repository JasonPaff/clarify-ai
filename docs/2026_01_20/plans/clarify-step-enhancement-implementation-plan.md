# Implementation Plan: Phase 6 - Clarify Step Enhancement

**Generated**: 2026-01-20
**Original Request**: Implement Phase 6 of the feature request workflow - Clarify Step Enhancement
**Refined Request**: Implement Phase 6 of the feature request workflow to enhance the Clarify Step with comprehensive settings, flow improvements, run history integration, cost estimation, and stale state detection.

## Analysis Summary

- Feature request refined with project context
- Discovered 42 files across 15+ directories
- Generated 18-step implementation plan

## Overview

**Estimated Duration**: 5-7 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This phase enhances the Clarify step with comprehensive settings integration (migrating to StepSettingsPanel pattern), flow improvements (skip/request more buttons, streaming completion), run history integration, pre-run cost estimation using tokenlens, and stale state detection when the Describe step content changes after clarification.

## Prerequisites

- [ ] Phase 5 (Describe Step Enhancement) must be completed
- [ ] Verify tokenlens package is installed (already in package.json)
- [ ] Verify step_configurations and feature_request_runs tables exist with required fields
- [ ] Understand existing StepSettingsPanel, RunHistoryDropdown, and StaleWarningBanner patterns

## Implementation Steps

### Step 1: Rename 'Refine' to 'Clarify' in UI References

**What**: Update all UI-facing labels, titles, and descriptions from "Refine" to "Clarify" throughout the codebase.
**Why**: Ensures consistent terminology that better reflects the clarification workflow purpose.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Update WORKFLOW_STEPS array title from 'Refine' to 'Clarify'
- `components/features/workflow/step-settings-panel.tsx` - Update stepLabel case for 'refine' to return 'Clarify'
- `components/features/workflow/restore-run-dialog.tsx` - Update stepLabel logic for 'refine' to return 'Clarification'
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Update stepContent for 'refine' to use 'Clarify' terminology

**Changes:**

- Update `WORKFLOW_STEPS[1].title` from 'Refine' to 'Clarify'
- Update `WORKFLOW_STEPS[1].description` to 'Clarify and expand requirements'
- Update stepLabel switch case in step-settings-panel.tsx
- Update stepLabel ternary in restore-run-dialog.tsx
- Update stepContent['refine'].title to 'Clarify Requirements'

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All UI displays 'Clarify' instead of 'Refine' for the second workflow step
- [ ] Settings panel shows 'Clarify Settings' header
- [ ] Restore dialog shows 'Clarification' as step label
- [ ] All validation commands pass

---

### Step 2: Create ClarifyStep Component Shell

**What**: Create a new ClarifyStep component that wraps the existing ClarificationPanel with proper step-level structure.
**Why**: Provides a consistent step component structure matching DescribeStep and ResearchStep patterns.
**Confidence**: High

**Files to Create:**

- `components/features/clarify-step.tsx` - New step component wrapping clarification logic

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Import and render ClarifyStep for 'refine' step

**Changes:**

- Create ClarifyStep component accepting featureRequest and projectId props
- Structure component with sections for settings panel, main content, and actions
- Import and integrate StepSettingsPanel with step='refine'
- Wire up ClarifyStep in page.tsx stepContent rendering

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] ClarifyStep renders when navigating to the Clarify workflow step
- [ ] StepSettingsPanel appears at top of step (collapsed by default)
- [ ] Component structure follows DescribeStep pattern
- [ ] All validation commands pass

---

### Step 3: Integrate StepSettingsPanel with Clarification Flow

**What**: Connect StepSettingsPanel configuration to the clarification generation process, removing redundant ModelSelector and AdvancedSettings components.
**Why**: Unifies settings management under the established StepSettingsPanel pattern used by other steps.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Use step config for model selection
- `hooks/use-clarification.ts` - Accept step configuration parameters instead of inline selection
- `components/features/clarification/clarification-panel.tsx` - Remove ModelSelector and AdvancedSettings, accept config from parent

**Changes:**

- Add useStepConfig hook call in ClarifyStep to fetch 'refine' configuration
- Pass model config (modelId, temperature, maxTokens, thinkingEnabled, thinkingBudget) to useClarification
- Remove local state for selectedModel, customPrompt, thinkingOverride in clarification-panel
- Update startClarification signature to use config from step settings
- Remove ModelSelector and AdvancedSettings imports from clarification-panel

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Model selection persists in step_configurations table
- [ ] Temperature, max tokens, and thinking settings apply to clarification runs
- [ ] ModelSelector no longer appears inline in ClarificationPanel
- [ ] AdvancedSettings custom prompt moved to StepSettingsPanel
- [ ] All validation commands pass

---

### Step 4: Add Skip Clarification Button

**What**: Add a 'Skip clarification' button allowing users to bypass the clarification step when their request is already detailed.
**Why**: Respects user agency when they feel their feature request is sufficiently detailed without AI clarification.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Add Skip button in idle state
- `hooks/use-clarification.ts` - Add skipClarification function
- `db/schema/feature-requests.schema.ts` - Verify clarificationStatus supports 'skipped' value

**Changes:**

- Add 'Skip clarification' Button with SkipForward icon in idle state section
- Create skipClarification function that sets clarificationStatus to 'skipped_by_user'
- Update feature request status via mutation when skipping
- Navigate to next step after skip confirmation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skip button appears in idle state before starting clarification
- [ ] Clicking skip updates clarificationStatus appropriately
- [ ] User can proceed to next step after skipping
- [ ] All validation commands pass

---

### Step 5: Add Request More Clarification Button

**What**: Add a 'Request more clarification' button for additional clarification rounds after initial questions are answered.
**Why**: Allows users to get deeper clarification when AI's initial questions are insufficient.
**Confidence**: Medium

**Files to Modify:**

- `components/features/clarification/clarification-panel.tsx` - Add button in questions_ready and completed states
- `hooks/use-clarification.ts` - Add requestMoreClarification function

**Changes:**

- Add 'Request more clarification' Button with MessageCircle icon after questions are answered
- Create requestMoreClarification function that includes previous Q&A as context
- Modify startClarification to accept optional previousQuestionsContext parameter
- Append new questions to existing questions array

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Button appears after questions are answered
- [ ] Clicking generates additional clarification questions
- [ ] Previous Q&A context is included in new generation
- [ ] All validation commands pass

---

### Step 6: Handle 'No Clarification Needed' Scenario with Override

**What**: Improve the 'skipped' status display when AI determines request is detailed enough, adding an override option.
**Why**: Allows users to request clarification even when AI thinks it's unnecessary, respecting user autonomy.
**Confidence**: High

**Files to Modify:**

- `components/features/clarification/analysis-summary.tsx` - Add override button for high detail scores
- `components/features/clarification/clarification-panel.tsx` - Enhance skipped state with clear messaging

**Changes:**

- Add 'Request clarification anyway' button in skipped state
- Pass onRequestOverride callback to AnalysisSummary when detailScore >= 4
- Implement forceGenerateQuestions mode that ignores high detail score threshold
- Update AI prompt to always generate questions when override is requested

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Clear message explains why clarification was skipped
- [ ] Override button triggers question generation despite high score
- [ ] AnalysisSummary shows override option for high scores
- [ ] All validation commands pass

---

### Step 7: Implement Streaming Completion Wait Logic

**What**: Delay showing answer input fields until all streaming clarification questions have been received.
**Why**: Prevents users from answering incomplete question sets while streaming is still in progress.
**Confidence**: Medium

**Files to Modify:**

- `hooks/use-clarification.ts` - Add isQuestionsComplete flag
- `components/features/clarification/questions-list.tsx` - Accept isStreaming prop to show loading state
- `components/features/clarification/clarification-panel.tsx` - Pass streaming state to QuestionsList

**Changes:**

- Track when 'tool_result' event is received to mark questions as complete
- Add isQuestionsComplete boolean to useClarification return value
- Show skeleton/loading state in QuestionsList while streaming
- Disable answer inputs until isQuestionsComplete is true
- Add visual indicator showing questions are still being generated

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Answer fields are disabled/hidden during streaming
- [ ] Loading indicator shows while questions stream
- [ ] All questions appear before user can start answering
- [ ] All validation commands pass

---

### Step 8: Save Clarification Runs to Run History

**What**: Save each clarification run to the feature_request_runs table with step type 'refine'.
**Why**: Enables run history tracking, versioning, and restore functionality for clarification attempts.
**Confidence**: High

**Files to Modify:**

- `hooks/use-clarification.ts` - Add run creation and update logic
- `hooks/queries/use-feature-request-runs.ts` - Verify create mutation exists (already present)

**Changes:**

- Call useCreateRun mutation when startClarification begins
- Store run ID in local state for updates
- Call useUpdateRun mutation with output content when clarification completes
- Include inputContent (rawRequest), outputContent (stringified Q&A), modelId, parameters
- Set isCurrentRun=true for new runs

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New run record created when clarification starts
- [ ] Run updated with output when clarification completes
- [ ] Run includes model, parameters, input/output content
- [ ] isCurrentRun properly set for latest run
- [ ] All validation commands pass

---

### Step 9: Add RunHistoryDropdown to Clarify Step

**What**: Integrate RunHistoryDropdown component into the Clarify step interface for browsing previous attempts.
**Why**: Allows users to view and restore previous clarification runs.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Add RunHistoryDropdown in header area
- `components/features/clarification/clarification-panel.tsx` - Accept onRestoreRun callback prop

**Changes:**

- Import and render RunHistoryDropdown with featureRequestId and step='refine'
- Position dropdown in step header near settings panel
- Add onRunRestored callback to refresh clarification state from restored run

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] RunHistoryDropdown appears in Clarify step
- [ ] Dropdown shows previous clarification runs
- [ ] Selecting a run triggers restore dialog
- [ ] All validation commands pass

---

### Step 10: Implement Run Restore Functionality

**What**: Implement 'Use this version' restore functionality that loads previous run's questions and answers.
**Why**: Enables users to revert to a previous clarification attempt if current one is unsatisfactory.
**Confidence**: Medium

**Files to Modify:**

- `hooks/use-clarification.ts` - Add restoreFromRun function
- `components/features/clarify-step.tsx` - Handle restore completion

**Changes:**

- Create restoreFromRun function that parses run.outputContent for questions and answers
- Set local state (questions, answers, analysis, status) from restored run data
- Update feature_requests clarification fields with restored data
- Call setCurrentRun to mark restored run as current
- Trigger UI refresh after restore completes

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Restoring a run loads its questions and answers
- [ ] UI updates to show restored state
- [ ] Restored run becomes the current run
- [ ] All validation commands pass

---

### Step 11: Create Pre-Run Cost Estimation Component

**What**: Create a ClarificationCostEstimate component that calculates and displays estimated cost before running.
**Why**: Gives users visibility into the potential cost of their clarification request before committing.
**Confidence**: Medium

**Files to Create:**

- `components/features/clarification/cost-estimate.tsx` - Cost estimation display component

**Files to Modify:**

- `components/features/clarify-step.tsx` - Integrate cost estimate in pre-run section

**Changes:**

- Create ClarificationCostEstimate component following TokenEstimationWarning pattern
- Use tokenlens library to count tokens in feature request content
- Fetch model pricing from model info (input cost per token, output cost estimation)
- Display estimated input tokens and approximate cost
- Show warning if estimated cost exceeds threshold

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Cost estimate shows before running clarification
- [ ] Token count uses tokenlens for accuracy
- [ ] Pricing reflects selected model's rates
- [ ] All validation commands pass

---

### Step 12: Integrate Cost Estimation into Settings Panel Header

**What**: Display the cost estimation in the step's header or settings panel for visibility before running.
**Why**: Ensures users see cost impact upfront without needing to open separate panels.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Position cost estimate prominently
- `components/features/clarification/cost-estimate.tsx` - Add compact display variant

**Changes:**

- Add cost estimate summary in step header alongside RunHistoryDropdown
- Create compact variant of ClarificationCostEstimate for header display
- Show full breakdown on hover or click
- Update estimate when model selection changes in StepSettingsPanel

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Cost estimate visible in step header
- [ ] Estimate updates when model changes
- [ ] Full breakdown accessible on interaction
- [ ] All validation commands pass

---

### Step 13: Track Describe Step Content Changes for Stale Detection

**What**: Detect when Describe step content changes after a clarification run has completed.
**Why**: Enables warning users that their clarification may be outdated due to upstream changes.
**Confidence**: Medium

**Files to Modify:**

- `components/features/describe-step.tsx` - Track content changes and mark downstream steps stale
- `hooks/queries/use-feature-requests.ts` - Add useMarkStepsStale mutation

**Changes:**

- Create useMarkStepsStale hook that updates staleSteps JSON field
- After saving rawRequest changes in DescribeStep, check if clarification is completed
- If clarification exists and rawRequest changed, add 'refine' to staleSteps array
- Include timestamp of when step became stale

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Changing rawRequest after clarification marks 'refine' as stale
- [ ] staleSteps field updated in database
- [ ] Only triggers when clarification was previously completed
- [ ] All validation commands pass

---

### Step 14: Add StaleWarningBanner to Clarify Step

**What**: Display StaleWarningBanner when clarification is marked as stale due to upstream Describe changes.
**Why**: Informs users their clarification results may be outdated and offers option to re-run.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Add StaleWarningBanner conditionally
- `hooks/use-clarification.ts` - Add clearStaleState function

**Changes:**

- Check if 'refine' is in featureRequest.staleSteps array
- Render StaleWarningBanner with stepName='Clarification' when stale
- Implement onRerun callback that clears stale state and triggers new clarification
- Implement onDismiss callback that removes 'refine' from staleSteps

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Banner shows when clarification is stale
- [ ] Re-run button starts new clarification
- [ ] Dismiss removes stale state
- [ ] Banner disappears after re-running
- [ ] All validation commands pass

---

### Step 15: Create Helper Hook for Stale Steps Management

**What**: Create a reusable hook for managing stale steps across the workflow.
**Why**: Centralizes stale state logic for use in Clarify, Research, and Plan steps.
**Confidence**: High

**Files to Create:**

- `hooks/use-stale-steps.ts` - Stale steps management hook

**Files to Modify:**

- `components/features/clarify-step.tsx` - Use the new hook

**Changes:**

- Create useStaleSteps hook accepting featureRequestId
- Expose isStale(step), markStale(step), clearStale(step), staleSteps
- Parse staleSteps JSON from feature request
- Use useUpdateFeatureRequest for mutations
- Replace inline stale logic in ClarifyStep with hook

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Hook provides clean API for stale state management
- [ ] isStale returns correct boolean for each step
- [ ] markStale and clearStale update database
- [ ] All validation commands pass

---

### Step 16: Update WorkflowSteps to Display Stale Indicators

**What**: Pass staleSteps to WorkflowSteps component to show visual indicators on stale steps.
**Why**: Provides at-a-glance visibility of which steps need attention due to upstream changes.
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Pass staleSteps prop to WorkflowSteps

**Changes:**

- Parse staleSteps from featureRequest in page component
- Pass parsed array to WorkflowSteps staleSteps prop
- WorkflowSteps already handles display (amber warning icon, tooltip)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Workflow step indicators show amber warning for stale steps
- [ ] Tooltip explains step is outdated
- [ ] Indicator updates when stale state changes
- [ ] All validation commands pass

---

### Step 17: Cleanup Deprecated Clarification Components

**What**: Remove or deprecate ModelSelector and AdvancedSettings components if no longer used elsewhere.
**Why**: Reduces code maintenance burden and prevents confusion about which settings to use.
**Confidence**: High

**Files to Modify:**

- `components/features/clarification/model-selector.tsx` - Verify if still needed by StepSettingsPanel
- `components/features/clarification/advanced-settings.tsx` - Remove if fully migrated to StepSettingsPanel

**Changes:**

- Check if ModelSelector is imported by StepSettingsPanel (it is - keep it)
- Remove AdvancedSettings component if custom prompt is in StepSettingsPanel
- Remove unused imports from clarification-panel.tsx
- Update any remaining references

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] No unused components remain
- [ ] ModelSelector retained if used by StepSettingsPanel
- [ ] AdvancedSettings removed if fully migrated
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] All UI references show 'Clarify' instead of 'Refine'
- [ ] Settings persist in step_configurations table
- [ ] Run history saves and restores correctly
- [ ] Cost estimation displays before running
- [ ] Stale state detection works when Describe changes
- [ ] Manual testing confirms all user flows work

## Notes

- The database uses 'refine' as the internal step type value; only UI labels change to 'Clarify'
- ModelSelector component is shared with StepSettingsPanel - keep it, only remove from inline ClarificationPanel usage
- tokenlens library is already installed per package.json; use it for accurate token counting
- staleSteps is stored as JSON text in feature_requests table; parse/stringify as needed
- The existing RunHistoryDropdown and RestoreRunDialog components follow patterns that should be reused
- Consider performance: token counting should be debounced or cached to avoid excessive computation
- Cost estimation requires model pricing data - verify model info includes pricing or add it

## File Discovery Results

### Critical Priority Files

| File | Purpose |
|------|---------|
| `components/features/clarification/clarification-panel.tsx` | Main Clarify step component |
| `components/features/workflow-steps.tsx` | Workflow navigation with step labels |
| `components/features/workflow/step-settings-panel.tsx` | Reusable settings panel |
| `components/features/workflow/run-history-dropdown.tsx` | Run history selector |
| `components/features/workflow/stale-warning-banner.tsx` | Stale state warning |
| `hooks/use-clarification.ts` | Clarification state and streaming |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Feature workflow page |
| `components/features/describe-step.tsx` | Describe step (triggers stale) |

### Files to Create

| File | Purpose |
|------|---------|
| `components/features/clarify-step.tsx` | New step wrapper component |
| `components/features/clarification/cost-estimate.tsx` | Cost estimation display |
| `hooks/use-stale-steps.ts` | Stale steps management hook |
