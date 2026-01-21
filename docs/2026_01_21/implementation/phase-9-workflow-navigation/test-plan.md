# Phase 9: Workflow Navigation & State - Test Plan

## Overview

This document outlines manual test scenarios for verifying the Phase 9 implementation of workflow navigation and state management features.

---

## 1. Step Transition Validation Warnings

### 1.1 Missing Repository Warning

**Preconditions:**
- Create a new feature request
- Do not link any repositories

**Steps:**
1. Enter a feature description
2. Click "Next" to move to Clarify step

**Expected Result:**
- StepTransitionWarningDialog appears with warning about missing repository
- Warning displays with caution severity (red styling)
- User can click "Proceed Anyway" to continue
- User can click "Cancel" to stay on Describe step

### 1.2 Empty Description Warning

**Preconditions:**
- Create a new feature request
- Leave description empty

**Steps:**
1. Click "Next" to move to Clarify step

**Expected Result:**
- StepTransitionWarningDialog appears with warning about empty description
- User can proceed or cancel

### 1.3 Incomplete Clarification Answers Warning

**Preconditions:**
- Complete the Describe step
- Start clarification but don't answer all questions

**Steps:**
1. Click "Next" to move to Discover step

**Expected Result:**
- Warning about incomplete clarification answers
- Shows which answers are missing

### 1.4 Multiple Warnings Display

**Preconditions:**
- Create feature with no repository and empty description

**Steps:**
1. Try to proceed to next step

**Expected Result:**
- Dialog shows all applicable warnings in a bulleted list
- Each warning shows appropriate severity icon

---

## 2. Leave Warning During AI Operations

### 2.1 Navigation Blocking During Clarification

**Preconditions:**
- Complete Describe step
- Start clarification AI operation

**Steps:**
1. While AI is generating questions, click on Describe step in sidebar

**Expected Result:**
- CancelAiDialog appears
- Dialog shows "Clarification" as the active operation
- User can confirm cancel or dismiss dialog

### 2.2 Navigation Blocking During Discovery

**Preconditions:**
- Complete Clarify step
- Start discovery AI operation

**Steps:**
1. While AI is discovering files, click on Clarify step in sidebar

**Expected Result:**
- CancelAiDialog appears
- Dialog shows "Discovery" as the active operation
- Confirming cancel stops the AI operation and navigates

### 2.3 Navigation Blocking During Plan Generation

**Preconditions:**
- Complete Discover step
- Start plan generation

**Steps:**
1. While AI is generating plan, click on Discover step in sidebar

**Expected Result:**
- CancelAiDialog appears
- Dialog shows "Planning" as the active operation

### 2.4 Visual Indication of Blocked Steps

**Preconditions:**
- Start any AI operation

**Steps:**
1. Observe the workflow steps sidebar

**Expected Result:**
- Steps show `cursor-not-allowed` and reduced opacity during AI operation
- Clicking blocked steps triggers cancel dialog

---

## 3. BeforeUnload Handler

### 3.1 Window Close During AI Operation

**Preconditions:**
- Start any AI operation (clarification, discovery, or plan)

**Steps:**
1. Try to close the Electron window (click X button)

**Expected Result:**
- Browser's native confirmation dialog appears
- Dialog asks to confirm leaving the page
- Confirming closes window, dismissing stays on page

### 3.2 No Warning When Idle

**Preconditions:**
- No AI operations running

**Steps:**
1. Try to close the Electron window

**Expected Result:**
- Window closes immediately without warning

---

## 4. Auto-Save Status Indicators

### 4.1 Describe Step Save Status

**Steps:**
1. Navigate to Describe step
2. Modify the feature description
3. Observe the save status text

**Expected Result:**
- Shows "Saving..." during save
- Shows "Last saved X ago" after save completes
- Time updates relative to current time

### 4.2 Clarify Step Save Status

**Preconditions:**
- Complete clarification

**Steps:**
1. Navigate to Clarify step
2. Observe save status

**Expected Result:**
- Shows "Last saved X ago" when clarification completed

### 4.3 Discover Step Save Status

**Preconditions:**
- Complete discovery

**Steps:**
1. Navigate to Discover step
2. Observe save status

**Expected Result:**
- Shows "Last saved X ago" after discovery completed

### 4.4 Plan Step Save Status

**Preconditions:**
- Complete plan generation

**Steps:**
1. Navigate to Plan step
2. Observe save status

**Expected Result:**
- Shows "Last saved X ago" after plan generation completed

---

## 5. Save Error Handling

### 5.1 Discovery Error Display

**Preconditions:**
- Configure a scenario that causes discovery to fail (e.g., invalid model config)

**Steps:**
1. Start discovery
2. Observe when error occurs

**Expected Result:**
- Alert displays with actual error message
- Error is descriptive (not generic "Failed to save")
- User can understand what went wrong

---

## 6. Stale Detection Propagation

### 6.1 Describe Changes Mark Downstream Stale

**Preconditions:**
- Complete all steps (Describe → Clarify → Discover → Plan)
- All steps show checkmarks

**Steps:**
1. Go back to Describe step
2. Modify the feature description

**Expected Result:**
- Clarify, Discover, and Plan steps marked as stale
- AlertTriangle icon appears on stale steps

### 6.2 Clarify Changes Mark Downstream Stale

**Preconditions:**
- Complete all steps

**Steps:**
1. Go to Clarify step
2. Run clarification again

**Expected Result:**
- Discover and Plan steps marked as stale
- Describe step remains unchanged

### 6.3 Discover Changes Mark Downstream Stale

**Preconditions:**
- Complete all steps

**Steps:**
1. Go to Discover step
2. Run discovery again

**Expected Result:**
- Only Plan step marked as stale
- Describe and Clarify steps remain unchanged

---

## 7. Edge Cases

### 7.1 Cancel AI Then Navigate

**Steps:**
1. Start an AI operation
2. Cancel it via the cancel button (not via navigation)
3. Try to navigate to another step

**Expected Result:**
- Navigation proceeds without cancel dialog
- No stale warning state left over

### 7.2 AI Completes During Warning Dialog

**Steps:**
1. Start an AI operation
2. Click another step (cancel dialog appears)
3. Wait for AI to complete before responding

**Expected Result:**
- Dialog should auto-dismiss when AI completes
- No stale warning state

### 7.3 Rapid Step Navigation

**Steps:**
1. Click quickly through multiple steps

**Expected Result:**
- Navigation is responsive
- No UI glitches or stuck states

---

## Quality Gate Checklist

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Step transition validation warnings display correctly
- [ ] Leave warning system blocks navigation during active AI operations
- [ ] CancelAiDialog integrates correctly with navigation flow
- [ ] Auto-save status displays consistently across all steps
- [ ] Save error alerts show actual error messages
- [ ] Stale detection utility correctly models step dependencies
- [ ] BeforeUnload handling prevents accidental window closure
