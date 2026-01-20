# Implementation Plan: Phase 4 - Core UI Components for Feature Request Workflow

**Generated**: 2026-01-20
**Original Request**: Implement Phase 4 of the feature request workflow from docs/2026_01_20/plans/feature-request-workflow-implementation-order.md

## Overview

**Complexity**: Medium
**Risk Level**: Low

This phase implements five component groups for the workflow UI: Step Settings Panel with model selection and parameter controls, Run History Selector for version management, Stale State Indicator for alerting users to outdated steps, Confirmation Dialogs for destructive actions, and Context File Picker for managing input files. All components will follow established patterns using Base UI primitives with CVA variants.

## Quick Summary

| Component Group       | Files | Description                                  |
| --------------------- | ----- | -------------------------------------------- |
| Step Settings Panel   | 3     | Collapsible panel with model, params, prompt |
| Run History Selector  | 2     | Dropdown for viewing/restoring past runs     |
| Stale State Indicator | 2     | Banner + stepper icons for stale steps       |
| Confirmation Dialogs  | 3     | Cancel AI, Restore Run, Discard Results      |
| Context File Picker   | 2     | File browser + selected files list           |

**Total**: 11 new files, 1 modified file

## Prerequisites

- [ ] Verify existing hooks are functional: `useStepConfig`, `useRunsByStep`, `useSetCurrentRun`, `useContextFiles`, `useAddContextFile`, `useRemoveContextFile`
- [ ] Ensure `components/features/workflow/` directory exists (create if needed)
- [ ] Confirm Base UI Slider component is available in `@base-ui/react` for parameter controls

## Implementation Steps

### Step 1: Create Parameter Slider Component

**What**: Create a reusable slider component for temperature, max tokens, and thinking budget controls
**Why**: Provides consistent parameter input across the Step Settings Panel with proper styling and accessibility
**Confidence**: High

**Files to Create:**

- `components/features/workflow/parameter-slider.tsx` - Reusable slider with label, value display, and min/max configuration

**Changes:**

- Add `'use client'` directive
- Import `Slider` from `@base-ui/react/slider`
- Create CVA variants for slider track, indicator, and thumb styling matching project theme
- Define `ParameterSliderProps` type with `label`, `value`, `onChange`, `min`, `max`, `step`, `disabled`, `formatValue` props
- Implement component with label, current value display, and Base UI Slider parts (Root, Control, Track, Indicator, Thumb)
- Use `cn()` for class merging
- Add optional `description` prop for helper text

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders slider with label and value display
- [ ] Value changes trigger `onChange` callback
- [ ] Styling matches project theme using CVA variants
- [ ] All validation commands pass

---

### Step 2: Create Thinking Budget Control Component

**What**: Create a specialized control combining an enable/disable switch with a token budget slider
**Why**: Models supporting extended thinking need a toggle plus budget control; this component handles the model-awareness logic
**Confidence**: High

**Files to Create:**

- `components/features/workflow/thinking-budget-control.tsx` - Switch + slider combo for thinking budget management

**Changes:**

- Add `'use client'` directive
- Import `Switch` from `@/components/ui/switch`
- Import `ParameterSlider` from `./parameter-slider`
- Define `ThinkingBudgetControlProps` with `enabled`, `budget`, `onEnabledChange`, `onBudgetChange`, `disabled`, `supportsThinking` props
- Implement conditional rendering: when `supportsThinking` is false, show disabled state with tooltip explaining why
- When enabled, show slider for budget selection (min: 1024, max: 128000, step: 1024)
- Add label "Extended Thinking" with description text

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Switch toggles thinking enabled state
- [ ] Slider only appears when thinking is enabled
- [ ] Component disables appropriately when model doesn't support thinking
- [ ] All validation commands pass

---

### Step 3: Create Step Settings Panel Component

**What**: Create the main collapsible settings panel combining model selection, parameters, and custom prompt
**Why**: Provides unified configuration UI for each workflow step (refine, research, plan)
**Confidence**: High

**Files to Create:**

- `components/features/workflow/step-settings-panel.tsx` - Main collapsible settings panel

**Changes:**

- Add `'use client'` directive
- Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
- Import `ModelSelector` from `@/components/features/clarification/model-selector`
- Import `ParameterSlider` from `./parameter-slider`
- Import `ThinkingBudgetControl` from `./thinking-budget-control`
- Import `Textarea` from `@/components/ui/textarea`
- Import `useStepConfig`, `useUpsertStepConfig` from `@/hooks/queries/use-step-configurations`
- Import `getModelInfo` from `@/lib/ai/models`
- Define `StepSettingsPanelProps` with `featureRequestId`, `step`, `className` props
- Implement collapsible panel with Settings2 icon (follow `advanced-settings.tsx` pattern)
- Add sections: Model Selection (using ModelSelector), Temperature slider (0-2, step 0.1), Max Tokens slider (100-16000, step 100), Thinking Budget Control, Custom System Prompt textarea
- Use mutation hooks to persist changes on blur/change
- Show "Customized" badge when settings differ from defaults

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Panel expands/collapses correctly
- [ ] Model selection updates configuration
- [ ] Parameter sliders persist values
- [ ] Custom prompt saves on blur
- [ ] All validation commands pass

---

### Step 4: Create Run History Item Component

**What**: Create a list item component for displaying individual run entries in the history dropdown
**Why**: Separates presentation logic for run history items, enabling consistent formatting and actions
**Confidence**: High

**Files to Create:**

- `components/features/workflow/run-history-item.tsx` - Individual run entry display

**Changes:**

- Add `'use client'` directive
- Import `FeatureRequestRun` type from `@/db/types`
- Import `formatDistanceToNow` from `date-fns`
- Define `RunHistoryItemProps` with `run`, `isCurrentRun`, `onSelect` props
- Implement component showing: run timestamp (relative format), status badge (completed/failed/running), "Current" label if `isCurrentRun` is true
- Add "Use this version" button that triggers `onSelect`
- Use CVA for status badge variants (success/error/warning colors)

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component displays run timestamp in human-readable format
- [ ] Status badge shows correct color for each status
- [ ] Current run is visually distinguished
- [ ] "Use this version" button triggers callback
- [ ] All validation commands pass

---

### Step 5: Create Run History Dropdown Component

**What**: Create a dropdown showing previous executions for a specific step
**Why**: Allows users to view and restore previous run outputs for any workflow step
**Confidence**: High

**Files to Create:**

- `components/features/workflow/run-history-dropdown.tsx` - Dropdown selector for run history

**Changes:**

- Add `'use client'` directive
- Import `SelectRoot`, `SelectTrigger`, `SelectValue`, `SelectPortal`, `SelectPositioner`, `SelectPopup`, `SelectList` from `@/components/ui/select`
- Import `RunHistoryItem` from `./run-history-item`
- Import `useRunsByStep`, `useCurrentRun`, `useSetCurrentRun` from `@/hooks/queries/use-feature-request-runs`
- Import `RestoreRunDialog` from `./restore-run-dialog`
- Define `RunHistoryDropdownProps` with `featureRequestId`, `step`, `className` props
- Fetch runs using `useRunsByStep` hook
- Display current run in trigger, show list of all runs in dropdown
- Integrate `RestoreRunDialog` for confirmation before switching runs
- Handle empty state when no runs exist

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dropdown displays all runs for the step
- [ ] Current run is clearly marked
- [ ] Selecting a different run triggers confirmation dialog
- [ ] Empty state displays appropriate message
- [ ] All validation commands pass

---

### Step 6: Create Stale Warning Banner Component

**What**: Create a warning banner that appears when a step's inputs have changed since last execution
**Why**: Alerts users that previous step outputs may no longer be relevant, prompting re-execution
**Confidence**: Medium

**Files to Create:**

- `components/features/workflow/stale-warning-banner.tsx` - Warning banner for stale steps

**Changes:**

- Add `'use client'` directive
- Import `Alert`, `AlertTitle`, `AlertDescription` from `@/components/ui/alert`
- Import `AlertTriangle`, `RefreshCw` icons from `lucide-react`
- Import `Button` from `@/components/ui/button`
- Define `StaleWarningBannerProps` with `stepName`, `reason`, `onRerun`, `className` props
- Use Alert component with `warning` variant
- Display message explaining why step is stale (e.g., "Previous step output changed")
- Add "Re-run" action button

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Banner displays with warning styling
- [ ] Reason for staleness is clearly communicated
- [ ] Re-run button triggers callback
- [ ] Component is dismissible
- [ ] All validation commands pass

---

### Step 7: Modify Workflow Steps Component for Stale Indicators

**What**: Enhance existing workflow stepper to show stale warning icons on affected steps
**Why**: Provides visual indication in the stepper that downstream steps need attention
**Confidence**: High

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Add stale state visual indicator

**Changes:**

- Import `AlertTriangle` icon from `lucide-react`
- Extend `Step` interface to include optional `isStale` boolean
- Extend `WorkflowStepsProps` to accept `staleSteps` array of step IDs
- Modify step indicator rendering to show warning icon overlay when step is stale
- Add tooltip explaining stale status using existing Tooltip component
- Style stale indicator with amber/warning color

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Stale steps show warning icon overlay
- [ ] Tooltip explains stale status
- [ ] Non-stale steps render normally
- [ ] All validation commands pass

---

### Step 8: Create Cancel AI Dialog Component

**What**: Create a confirmation dialog for canceling an in-progress AI operation
**Why**: Prevents accidental cancellation of expensive/long-running operations
**Confidence**: High

**Files to Create:**

- `components/features/workflow/cancel-ai-dialog.tsx` - Cancel confirmation dialog

**Changes:**

- Add `'use client'` directive
- Import `AlertDialog` from `@base-ui/react/alert-dialog`
- Import `Button` from `@/components/ui/button`
- Import `useControllableState` from `@/hooks/use-controllable-state`
- Follow exact pattern from `delete-feature-request-dialog.tsx`
- Define `CancelAiDialogProps` with `open`, `onOpenChange`, `onConfirm`, `stepName`, `children` props
- Display warning about losing progress
- Include Cancel and "Stop Generation" buttons
- Use destructive button variant for confirm action

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog opens/closes correctly
- [ ] Confirm button triggers callback and closes dialog
- [ ] Cancel button closes without action
- [ ] Warning message is clear
- [ ] All validation commands pass

---

### Step 9: Create Restore Run Dialog Component

**What**: Create a confirmation dialog for restoring a previous run version
**Why**: Warns users that restoring will replace current outputs
**Confidence**: High

**Files to Create:**

- `components/features/workflow/restore-run-dialog.tsx` - Restore confirmation dialog

**Changes:**

- Add `'use client'` directive
- Import `AlertDialog` from `@base-ui/react/alert-dialog`
- Import `Button` from `@/components/ui/button`
- Import `useControllableState` from `@/hooks/use-controllable-state`
- Import `FeatureRequestRun` type from `@/db/types`
- Follow pattern from `delete-feature-request-dialog.tsx`
- Define `RestoreRunDialogProps` with `open`, `onOpenChange`, `onConfirm`, `run`, `children` props
- Display info about the run being restored (timestamp, status)
- Warn that current run will be replaced
- Include Cancel and "Restore" buttons

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog displays run details
- [ ] Confirm triggers restore and closes
- [ ] Cancel closes without action
- [ ] All validation commands pass

---

### Step 10: Create Discard Results Dialog Component

**What**: Create a confirmation dialog for discarding unsaved AI results
**Why**: Prevents accidental loss of generated content before saving
**Confidence**: High

**Files to Create:**

- `components/features/workflow/discard-results-dialog.tsx` - Discard confirmation dialog

**Changes:**

- Add `'use client'` directive
- Import `AlertDialog` from `@base-ui/react/alert-dialog`
- Import `Button` from `@/components/ui/button`
- Import `useControllableState` from `@/hooks/use-controllable-state`
- Follow pattern from `delete-feature-request-dialog.tsx`
- Define `DiscardResultsDialogProps` with `open`, `onOpenChange`, `onConfirm`, `stepName`, `children` props
- Display warning about losing generated content
- Include Cancel and "Discard" buttons with destructive variant

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog opens/closes correctly
- [ ] Destructive action is clearly indicated
- [ ] All validation commands pass

---

### Step 11: Create Context File List Component

**What**: Create a component displaying selected context files with remove actions
**Why**: Shows users which files are included in the context and allows removal
**Confidence**: High

**Files to Create:**

- `components/features/workflow/context-file-list.tsx` - List of selected context files

**Changes:**

- Add `'use client'` directive
- Import `FeatureRequestContextFile` type from `@/db/types`
- Import `File`, `X`, `FileText`, `Image` icons from `lucide-react`
- Import `IconButton` from `@/components/ui/icon-button`
- Define `ContextFileListProps` with `files`, `onRemove`, `className` props
- Render list of files with appropriate icon based on `fileType`
- Display file name and truncated path
- Add remove button (X icon) for each file
- Handle empty state

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Files display with correct icons by type
- [ ] Remove button triggers callback with file ID
- [ ] Empty state is handled
- [ ] All validation commands pass

---

### Step 12: Create Context File Picker Component

**What**: Create the main context file picker with file browser integration and file list
**Why**: Provides complete UI for adding and managing context files for a feature request
**Confidence**: High

**Files to Create:**

- `components/features/workflow/context-file-picker.tsx` - Main file picker component

**Changes:**

- Add `'use client'` directive
- Import `useElectronDialog` from `@/hooks/useElectron`
- Import `useElectronFs` from `@/hooks/useElectron`
- Import `useContextFiles`, `useAddContextFile`, `useRemoveContextFile` from `@/hooks/queries/use-feature-request-context-files`
- Import `ContextFileList` from `./context-file-list`
- Import `Button` from `@/components/ui/button`
- Import `Plus`, `FolderOpen` icons from `lucide-react`
- Define `ContextFilePickerProps` with `featureRequestId`, `className` props
- Implement "Add File" button that opens file dialog using `useElectronDialog().openFile()`
- On file selection, get file stats using `useElectronFs().stat()`, then add using mutation
- Render `ContextFileList` with loaded files
- Handle loading and error states

**Validation Commands:**

```bash
pnpm run lint && pnpm run typecheck
```

**Success Criteria:**

- [ ] Add File button opens native file dialog
- [ ] Selected files are added to context
- [ ] Files list displays correctly
- [ ] Remove action works
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint`
- [ ] All 11 new components follow Base UI + CVA pattern
- [ ] All components use `'use client'` directive
- [ ] All components use `cn()` for class merging
- [ ] Imports are sorted alphabetically (ESLint perfectionist)
- [ ] No `any` types used
- [ ] All mutation hooks properly invalidate caches

## Notes

- The `components/features/workflow/` directory needs to be created before starting implementation
- Each component should be imported directly by path (no barrel exports per project rules)
- The thinking budget control depends on model metadata (`supportsThinking`); ensure `getModelInfo()` is used to check capability
- Run history dropdown should handle the case where a step has never been executed
- Context file picker file type detection should use file extension mapping to determine `ContextFileType` enum value
- All dialogs follow the controlled/uncontrolled pattern using `useControllableState` hook

## File Reference Summary

### Files to Create (11)

| File                                                       | Component Group       |
| ---------------------------------------------------------- | --------------------- |
| `components/features/workflow/parameter-slider.tsx`        | Step Settings Panel   |
| `components/features/workflow/thinking-budget-control.tsx` | Step Settings Panel   |
| `components/features/workflow/step-settings-panel.tsx`     | Step Settings Panel   |
| `components/features/workflow/run-history-item.tsx`        | Run History Selector  |
| `components/features/workflow/run-history-dropdown.tsx`    | Run History Selector  |
| `components/features/workflow/stale-warning-banner.tsx`    | Stale State Indicator |
| `components/features/workflow/cancel-ai-dialog.tsx`        | Confirmation Dialogs  |
| `components/features/workflow/restore-run-dialog.tsx`      | Confirmation Dialogs  |
| `components/features/workflow/discard-results-dialog.tsx`  | Confirmation Dialogs  |
| `components/features/workflow/context-file-list.tsx`       | Context File Picker   |
| `components/features/workflow/context-file-picker.tsx`     | Context File Picker   |

### Files to Modify (1)

| File                                     | Change                       |
| ---------------------------------------- | ---------------------------- |
| `components/features/workflow-steps.tsx` | Add stale step warning icons |

### Key Reference Files

| File                                                      | Purpose                          |
| --------------------------------------------------------- | -------------------------------- |
| `components/features/clarification/advanced-settings.tsx` | Pattern for collapsible settings |
| `components/features/clarification/model-selector.tsx`    | Pattern for model selection      |
| `components/features/delete-feature-request-dialog.tsx`   | Pattern for confirmation dialogs |
| `components/ui/dialog.tsx`                                | Base dialog primitives           |
| `components/ui/collapsible.tsx`                           | Collapsible primitives           |
| `components/ui/select.tsx`                                | Select dropdown primitives       |
| `components/ui/alert.tsx`                                 | Alert/warning banner             |
