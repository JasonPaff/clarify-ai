# Feature Request Workflow - Implementation Order

This document outlines the recommended order for implementing the feature request workflow based on the design specification. Features are broken into small, manageable action items following a logical progression.

---

## Current State Summary

**Already Implemented:**

- Database schemas for feature requests and repository associations
- Feature request CRUD operations (IPC + hooks + dialogs)
- Entry step with auto-save
- Clarification step (AI streaming, questions, model selection)
- Research step (repository selector, placeholder for file discovery)
- Basic workflow stepper UI

**Needs Implementation:**

- Rename steps to match design spec (Entry→Describe, Refine→Clarify, Research→Discover)
- Run history system
- Stale state tracking
- Settings panel standardization across steps
- File discovery AI integration
- Implementation plan generation
- Export functionality
- Archive functionality
- Many UI enhancements

---

## Phase 1: Foundation & Data Layer

_Goal: Establish the data structures needed for the enhanced workflow_

### 1.1 Run History Schema

- [ ] Create `feature-request-runs.schema.ts` with fields:
  - `id`, `featureRequestId`, `stepType` (describe/clarify/discover/plan)
  - `inputData` (JSON), `outputData` (JSON)
  - `modelId`, `promptUsed`, `parameters` (JSON)
  - `tokenCount`, `estimatedCost`
  - `isCurrentRun` (boolean)
  - `createdAt`
- [ ] Create `feature-request-runs.repository.ts` with methods:
  - `create()`, `getByFeatureRequestAndStep()`, `setCurrentRun()`, `getRunHistory()`
- [ ] Generate and run database migration

### 1.2 Step Configuration Schema

- [ ] Create `step-configurations.schema.ts` with fields:
  - `id`, `projectId`, `stepType`
  - `modelId`, `customPrompt`, `temperature`, `maxTokens`, `thinkingBudget`
  - `createdAt`, `updatedAt`
- [ ] Create `step-configurations.repository.ts`
- [ ] Generate and run database migration

### 1.3 Feature Request Schema Updates

- [ ] Add `archivedAt` nullable timestamp field
- [ ] Add `staleSteps` JSON field (array of step names that are stale)
- [ ] Update status enum values to match spec: `describing`, `clarifying`, `researching`, `planning`, `completed`
- [ ] Generate and run database migration

### 1.4 Context Files Schema

- [ ] Create `feature-request-context-files.schema.ts` with fields:
  - `id`, `featureRequestId`, `filePath`, `fileName`
  - `createdAt`
- [ ] Create repository file
- [ ] Generate and run database migration

---

## Phase 2: IPC Layer Extensions

_Goal: Expose new database operations and AI capabilities to the renderer_

### 2.1 Run History IPC

- [ ] Add channels to `channels.ts`:
  - `db.featureRequestRuns.create`
  - `db.featureRequestRuns.getByStep`
  - `db.featureRequestRuns.getHistory`
  - `db.featureRequestRuns.setCurrentRun`
- [ ] Create `feature-request-runs.handlers.ts`
- [ ] Update `preload.ts` with new API methods
- [ ] Update `electron.d.ts` type definitions

### 2.2 Step Configuration IPC

- [ ] Add channels for step config CRUD
- [ ] Create `step-configurations.handlers.ts`
- [ ] Update preload and types

### 2.3 Context Files IPC

- [ ] Add channels for context file management
- [ ] Create `feature-request-context-files.handlers.ts`
- [ ] Update preload and types

### 2.4 File Discovery AI IPC

- [ ] Add channels:
  - `ai.discovery.stream`
  - `ai.discovery.cancel`
- [ ] Create `ai-discovery.handlers.ts` (placeholder implementation)
- [ ] Update preload and types

### 2.5 Plan Generation AI IPC

- [ ] Add channels:
  - `ai.plan.stream`
  - `ai.plan.cancel`
- [ ] Create `ai-plan.handlers.ts` (placeholder implementation)
- [ ] Update preload and types

---

## Phase 3: Query Hooks & State Management

_Goal: Create React hooks for accessing new data_

### 3.1 Run History Hooks

- [ ] Create `use-feature-request-runs.ts`:
  - `useRunHistory(featureRequestId, stepType)`
  - `useCurrentRun(featureRequestId, stepType)`
  - `useCreateRun()` mutation
  - `useSetCurrentRun()` mutation
- [ ] Add query keys to `lib/queries/`

### 3.2 Step Configuration Hooks

- [ ] Create `use-step-configurations.ts`:
  - `useStepConfig(projectId, stepType)`
  - `useUpdateStepConfig()` mutation
- [ ] Add query keys

### 3.3 Context Files Hooks

- [ ] Create `use-feature-request-context-files.ts`:
  - `useContextFiles(featureRequestId)`
  - `useAddContextFile()` mutation
  - `useRemoveContextFile()` mutation
- [ ] Add query keys

### 3.4 Feature Request Hook Updates

- [ ] Add `useArchiveFeatureRequest()` mutation
- [ ] Add `useUnarchiveFeatureRequest()` mutation
- [ ] Update existing hooks to handle new fields

---

## Phase 4: Core UI Components

_Goal: Build reusable components for the workflow_

### 4.1 Step Settings Panel

- [ ] Create `components/features/workflow/step-settings-panel.tsx`:
  - Collapsible panel component
  - Model selector (reuse existing)
  - Temperature slider
  - Max tokens input
  - Thinking budget control (toggle vs presets based on model)
  - Custom prompt textarea (advanced mode)
- [ ] Create `components/features/workflow/thinking-budget-control.tsx`
- [ ] Create `components/features/workflow/parameter-slider.tsx`

### 4.2 Run History Selector

- [ ] Create `components/features/workflow/run-history-dropdown.tsx`:
  - Dropdown showing timestamps
  - "Current" label for active run
  - "Use this version" action
- [ ] Create `components/features/workflow/run-history-item.tsx`

### 4.3 Stale State Indicator

- [ ] Create `components/features/workflow/stale-warning-banner.tsx`
- [ ] Update `workflow-steps.tsx` to show warning icons on stale steps
- [ ] Add stale step detection logic

### 4.4 Confirmation Dialogs

- [ ] Create `components/features/workflow/cancel-ai-dialog.tsx`
- [ ] Create `components/features/workflow/restore-run-dialog.tsx`
- [ ] Create `components/features/workflow/discard-results-dialog.tsx`

### 4.5 Context File Picker

- [ ] Create `components/features/workflow/context-file-picker.tsx`:
  - File browser dialog integration
  - Selected files list
  - Remove file action
- [ ] Create `components/features/workflow/context-file-list.tsx`

---

## Phase 5: Describe Step Enhancement

_Goal: Upgrade the entry step to match the design spec_

### 5.1 Rename & Restructure

- [ ] Rename `entry-step.tsx` to `describe-step.tsx`
- [ ] Update all imports and references
- [ ] Update workflow step labels (Entry → Describe)

### 5.2 Repository Selection Integration

- [ ] Move repository selector into Describe step
- [ ] Add "inherit with edit" behavior for repo selection
- [ ] Show repo selection alongside description input

### 5.3 Overview Integration

- [ ] Add per-repo overview status indicator
- [ ] Add per-repo "regenerate overview" button
- [ ] Show "overview recommended" warning if missing
- [ ] Integrate existing overview generation component

### 5.4 Context Files

- [ ] Integrate context file picker into Describe step
- [ ] Show list of added context files
- [ ] Implement context size warning (use token estimation)

### 5.5 Settings Panel Integration

- [ ] Add collapsible settings panel to Describe step
- [ ] Wire up model/prompt/params to step configuration
- [ ] Implement project-level persistence

---

## Phase 6: Clarify Step Enhancement

_Goal: Upgrade the existing clarification step_

### 6.1 Rename & Integrate Settings

- [ ] Rename references from "Refine" to "Clarify" in UI
- [ ] Migrate existing model selector to settings panel pattern
- [ ] Add temperature/max tokens/thinking controls

### 6.2 Flow Improvements

- [ ] Add "Skip clarification" button
- [ ] Add "Request more clarification" button for additional rounds
- [ ] Handle "no clarification needed" case with override option
- [ ] Implement "wait for all questions" before showing answer fields

### 6.3 Run History Integration

- [ ] Save each clarification run to history
- [ ] Add run history dropdown to Clarify step
- [ ] Implement "Use this version" restore functionality

### 6.4 Cost Estimation

- [ ] Calculate context size before running
- [ ] Display cost estimate
- [ ] Integrate pricing library

### 6.5 Stale State

- [ ] Track when Describe step changes
- [ ] Mark Clarify as stale when needed
- [ ] Show stale warning banner

---

## Phase 7: Discover Step Implementation

_Goal: Build the file discovery step from placeholder to full implementation_

### 7.1 Scope Selector UI

- [ ] Create `components/features/workflow/scope-selector.tsx`:
  - Folder tree view with checkboxes
  - Glob pattern input field
  - Per-repository scope configuration
- [ ] Create `components/features/workflow/folder-tree.tsx`
- [ ] Implement folder tree data fetching via IPC

### 7.2 Discovery AI Integration

- [ ] Create `lib/ai/prompts/discovery.ts` with prompt builder
- [ ] Create `lib/ai/tools/discovery-tool.ts` for AI output structure
- [ ] Implement `ai-discovery.handlers.ts` with:
  - Multi-repo parallel processing
  - Streaming progress updates
  - File analysis and categorization

### 7.3 Discovery Progress UI

- [ ] Create `components/features/workflow/discovery-progress.tsx`:
  - Per-repo progress bars
  - Status indicators (Pending/Scanning/Complete)
  - Cancel button

### 7.4 Discovery Results UI

- [ ] Create `components/features/workflow/discovery-results.tsx`
- [ ] Create `components/features/workflow/file-card.tsx`:
  - Summary view (path, action, risk)
  - Expandable details (dependencies, snippets, full reason)
  - Edit capability for all fields
  - "Edited" badge for modified cards
- [ ] Create `components/features/workflow/add-file-dialog.tsx`
- [ ] Create `components/features/workflow/file-card-editor.tsx`

### 7.5 Discovery Step Assembly

- [ ] Create `discover-step.tsx` (rename from research-step.tsx)
- [ ] Integrate scope selector
- [ ] Integrate settings panel
- [ ] Integrate progress UI
- [ ] Integrate results UI with editing
- [ ] Integrate run history dropdown
- [ ] Add cost estimation
- [ ] Handle "prompt to generate overview" if missing

### 7.6 Validation Schema

- [ ] Create `lib/validations/discovery.ts`:
  - `DiscoveryFileEntry` schema
  - `DiscoveryResults` schema
  - JSON serialization helpers

---

## Phase 8: Plan Step Implementation

_Goal: Build the implementation plan generation step_

### 8.1 Plan AI Integration

- [ ] Create `lib/ai/prompts/plan.ts` with prompt builder
- [ ] Create `lib/ai/tools/plan-tool.ts` for structured output
- [ ] Implement `ai-plan.handlers.ts` with:
  - Full context assembly (description, clarification, discovery)
  - Streaming plan generation
  - Quality gate generation

### 8.2 Plan Display UI

- [ ] Create `components/features/workflow/plan-display.tsx`:
  - Markdown rendering
  - Section navigation
  - Quality gate indicators
- [ ] Create `components/features/workflow/plan-editor.tsx`:
  - Inline editing capability
  - "Edited" badge tracking
- [ ] Create `components/features/workflow/quality-gate.tsx`:
  - Command display
  - Manual checkpoint display

### 8.3 Export Functionality

- [ ] Create `components/features/workflow/plan-export-menu.tsx`:
  - Copy to clipboard
  - Save as file (file picker)
  - Save to project docs folder
- [ ] Add project setting for docs folder path
- [ ] Implement export IPC handlers if needed

### 8.4 Plan Step Assembly

- [ ] Create `plan-step.tsx`
- [ ] Integrate settings panel
- [ ] Integrate plan display with editing
- [ ] Integrate export menu
- [ ] Add "Mark Complete" action (equal prominence with export)
- [ ] Integrate run history dropdown
- [ ] Add cost estimation

### 8.5 Validation Schema

- [ ] Create `lib/validations/plan.ts`:
  - `PlanStep` schema (with quality gates)
  - `ImplementationPlan` schema
  - JSON serialization helpers

---

## Phase 9: Workflow Navigation & State

_Goal: Implement the workflow-level behaviors_

### 9.1 Stepper Enhancement

- [ ] Update `workflow-steps.tsx`:
  - Add completion checkmarks
  - Add stale warning icons
  - Enable click navigation to any completed step
  - Highlight current step

### 9.2 Step Transition Logic

- [ ] Implement soft validation between steps
- [ ] Show warning dialogs for incomplete data
- [ ] Allow proceeding with warnings

### 9.3 Stale State Management

- [ ] Create `lib/workflow/stale-detection.ts`:
  - Track step dependencies
  - Detect when upstream changes invalidate downstream
- [ ] Update feature request on step completion
- [ ] Clear stale state when step is re-run

### 9.4 Leave Warning

- [ ] Implement "AI running" detection
- [ ] Show confirmation dialog when navigating away
- [ ] Handle cancel behavior

### 9.5 Auto-Save Enhancement

- [ ] Ensure all step inputs auto-save
- [ ] Show save status indicators
- [ ] Handle save errors gracefully

---

## Phase 10: Feature Request List & Management

_Goal: Enhance the feature request list view_

### 10.1 Status Filter

- [ ] Add status filter dropdown to list page
- [ ] Implement filter logic
- [ ] Persist filter preference

### 10.2 Search

- [ ] Add search input for title/description
- [ ] Implement search logic
- [ ] Debounce search input

### 10.3 Archive Toggle

- [ ] Add "Show archived" toggle/filter
- [ ] Update list query to filter by archived state
- [ ] Style archived items differently

### 10.4 Archive Actions

- [ ] Add "Archive" action to feature request cards/menu
- [ ] Add "Unarchive" action for archived items
- [ ] Implement archive mutations

### 10.5 Status Display

- [ ] Update status badges to show new step-based statuses
- [ ] Add visual distinction for stale feature requests

---

## Phase 11: Create Dialog Enhancement

_Goal: Update the creation flow_

### 11.1 Dialog Fields

- [ ] Verify dialog has: title (required), description (optional), repos (required)
- [ ] Add validation to block creation without repos
- [ ] Improve error messages

### 11.2 Repository Selection

- [ ] Ensure at least one repo is selected before allowing creation
- [ ] Show validation error if no repos selected

---

## Phase 12: Project Settings Extensions

_Goal: Add project-level configuration for the workflow_

### 12.1 Plan Export Folder Setting

- [ ] Add `planExportFolder` field to project settings
- [ ] Create folder picker UI in project settings page
- [ ] Implement setting persistence

### 12.2 Default Model Settings

- [ ] Display per-step default models in project settings
- [ ] Allow editing defaults from settings page
- [ ] Link to step configurations

---

## Phase 13: Polish & Edge Cases

_Goal: Handle remaining details and edge cases_

### 13.1 Empty States

- [ ] Add empty state for no run history
- [ ] Add empty state for no discovery results
- [ ] Add empty state for no context files

### 13.2 Error States

- [ ] Add retry button styling for all AI steps
- [ ] Improve error messages
- [ ] Add error boundaries around AI components

### 13.3 Loading States

- [ ] Add skeleton loaders for step content
- [ ] Add loading indicators for async operations
- [ ] Improve streaming state indicators

### 13.4 Accessibility

- [ ] Add ARIA labels to workflow stepper
- [ ] Ensure keyboard navigation works
- [ ] Add screen reader announcements for status changes

### 13.5 Responsive Considerations

- [ ] Ensure workflow works on smaller screens
- [ ] Test stepper at various widths
- [ ] Collapse settings panel on small screens

---

## Phase 14: Testing & Validation

_Goal: Ensure everything works correctly_

### 14.1 Database Testing

- [ ] Test migrations on fresh database
- [ ] Test run history queries
- [ ] Test step configuration persistence

### 14.2 IPC Testing

- [ ] Test all new IPC channels
- [ ] Test error handling
- [ ] Test cancellation behavior

### 14.3 Integration Testing

- [ ] Test full workflow end-to-end
- [ ] Test stale state detection
- [ ] Test run history restoration
- [ ] Test export functionality

### 14.4 Edge Case Testing

- [ ] Test with very large repositories
- [ ] Test with many context files
- [ ] Test cancellation mid-stream
- [ ] Test navigation during AI operations

---

## Implementation Notes

### Recommended Approach

1. **Complete each phase before moving to the next** - Dependencies are structured to minimize rework
2. **Test incrementally** - Verify each component works before building on it
3. **Use existing patterns** - Follow the established patterns for IPC, hooks, and components
4. **Leverage existing components** - The clarification step is a good reference for AI streaming patterns

### Key Dependencies

- Phase 1 (Data Layer) → Phase 2 (IPC) → Phase 3 (Hooks)
- Phase 4 (Core Components) can start after Phase 3
- Phases 5-8 (Individual Steps) can be done in parallel after Phase 4
- Phase 9 (Navigation) should follow step implementations
- Phases 10-12 are relatively independent
- Phases 13-14 are final polish

### Estimated Scope

| Phase | Size   | Notes                            |
| ----- | ------ | -------------------------------- |
| 1     | Medium | Database schemas and migrations  |
| 2     | Medium | IPC handlers                     |
| 3     | Small  | Query hooks (straightforward)    |
| 4     | Large  | Many new components              |
| 5     | Medium | Enhancing existing step          |
| 6     | Medium | Enhancing existing step          |
| 7     | Large  | New AI integration + complex UI  |
| 8     | Large  | New AI integration + rich editor |
| 9     | Medium | Workflow state logic             |
| 10-12 | Small  | Enhancements                     |
| 13-14 | Medium | Polish and testing               |

---

## Quick Wins (Can Do Anytime)

These items are relatively independent and can be tackled between phases:

- [ ] Rename "Entry" to "Describe" in UI
- [ ] Rename "Refine" to "Clarify" in UI
- [ ] Rename "Research" to "Discover" in UI
- [ ] Add "Skip clarification" button
- [ ] Add archive field to feature request schema
- [ ] Add status filter to feature request list
- [ ] Add search to feature request list
