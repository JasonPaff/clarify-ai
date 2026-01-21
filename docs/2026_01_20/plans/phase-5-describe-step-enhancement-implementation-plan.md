# Phase 5: Describe Step Enhancement - Implementation Plan

Generated: 2026-01-20
Original Request: Plan the implementation of Phase 5 (Describe Step Enhancement) of the feature request workflow

## Analysis Summary

- Feature request refined with project context
- Discovered 41 files across 12 directories
- Generated 17-step implementation plan

## File Discovery Results

### Critical Priority (Must Modify)

1. `components/features/entry-step.tsx` - Core file to rename to describe-step.tsx
2. `components/features/workflow-steps.tsx` - Update 'entry' to 'describe' in step definitions
3. `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Update import to DescribeStep

### High Priority (Core Integration)

4. `components/features/repository-selector.tsx` - Enhance for "inherit with edit" behavior
5. `components/features/workflow/step-settings-panel.tsx` - Integrate into describe step
6. `components/features/workflow/context-file-picker.tsx` - Add token estimation warnings
7. `components/features/workflow/context-file-list.tsx` - Used by ContextFilePicker
8. `components/repositories/repository-overview-generator.tsx` - Reference for overview regeneration
9. `hooks/queries/use-feature-request-repositories.ts` - Has useSetFeatureRequestRepositories
10. `hooks/queries/use-step-configurations.ts` - Has useUpsertStepConfig
11. `hooks/queries/use-repository-overviews.ts` - Has useRepositoryOverviewStatuses
12. `hooks/queries/use-feature-request-context-files.ts` - Context file management hooks

### Medium Priority (Reference)

13. `components/features/research-step.tsx` - Pattern for step with repository selection
14. `components/features/clarification/clarification-panel.tsx` - Complex step UI reference
15. `hooks/queries/use-repositories.ts` - useRepositoriesWithOverviewStatus
16. `lib/forms/form-hook.ts` - useAppForm configuration
17. `lib/validations/feature-request.ts` - entryStepFormSchema

### Low Priority (Schema)

18. `db/schema/step-configurations.schema.ts` - May need 'describe' step type

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This phase transforms the current entry-step into a comprehensive Describe Step component that serves as the first step in the orchestration workflow. The enhanced step will integrate repository selection with "inherit with edit" behavior, repository overview display with regeneration capabilities, context file management with token estimation warnings, and step-level configuration persistence through StepSettingsPanel integration.

## Prerequisites

- [ ] Phase 4 Core UI Components must be complete (StepSettingsPanel, ContextFilePicker, ContextFileList exist)
- [ ] TanStack Query hooks for repositories, step configurations, and context files are implemented
- [ ] Database schema supports step configurations (will need 'describe' step type added)
- [ ] tokenlens package is installed (confirmed in package.json)

## Implementation Steps

### Step 1: Update Step Configuration Schema for 'describe' Step Type

**What**: Add 'describe' as a valid step type in the step configuration schema to support persistence of Describe Step settings.
**Why**: The current schema only supports 'refine', 'research', and 'plan' steps. The new Describe step requires database persistence for model selection, temperature, and other AI configuration options.
**Confidence**: High

**Files to Modify:**

- `db/schema/step-configurations.schema.ts` - Add 'describe' to StepConfigurationStep type union
- `db/schema/feature-request-runs.schema.ts` - Add 'describe' to FeatureRequestRunStep type union for consistency

**Changes:**

- Update the StepConfigurationStep type to include 'describe' as the first option in the union
- Update the FeatureRequestRunStep type to include 'describe' in the union
- Update the JSDoc comments to document the new 'describe' step

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] StepConfigurationStep type includes 'describe' option
- [ ] FeatureRequestRunStep type includes 'describe' option
- [ ] TypeScript compilation succeeds with no errors
- [ ] All validation commands pass

---

### Step 2: Update StepSettingsPanel to Support 'describe' Step Label

**What**: Add the 'describe' step label mapping to the StepSettingsPanel component so it displays properly when used in the Describe Step.
**Why**: The StepSettingsPanel uses a switch statement to map step identifiers to human-readable labels. Without adding 'describe', the step label will display as the raw identifier.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow/step-settings-panel.tsx` - Add 'describe' case to stepLabel switch

**Changes:**

- Add 'describe' case to the stepLabel useMemo switch statement that returns 'Describe'
- Ensure the component properly handles the new step type in all conditional logic

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] StepSettingsPanel displays "Describe Settings" as the label when step is 'describe'
- [ ] No TypeScript errors for the new step type
- [ ] All validation commands pass

---

### Step 3: Update Workflow Steps Definition and Page Constants

**What**: Rename the 'entry' step to 'describe' in the workflow steps definition and update the page's step order constant.
**Why**: The workflow step definitions drive the UI display and navigation. Renaming ensures consistency between the component name, step identifiers, and user-facing labels throughout the application.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Change 'entry' to 'describe' in WORKFLOW_STEPS array
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Update STEP_ORDER constant and StepId type

**Changes:**

- In workflow-steps.tsx: Change id from 'entry' to 'describe', title from 'Entry' to 'Describe'
- In page.tsx: Update STEP_ORDER array first element from 'entry' to 'describe'
- Update stepContent object key from 'entry' to 'describe'
- Update the conditional render check from 'entry' to 'describe'
- Update all references to currentStep comparisons

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] WORKFLOW_STEPS array shows 'describe' step with proper title and description
- [ ] STEP_ORDER correctly lists 'describe' as the first step
- [ ] Step navigation works correctly with the renamed step
- [ ] All validation commands pass

---

### Step 4: Rename entry-step.tsx to describe-step.tsx and Update Exports

**What**: Rename the entry-step file to describe-step and update the component name and export.
**Why**: File and component naming should reflect the step's purpose. The rename ensures consistency with the workflow terminology.
**Confidence**: High

**Files to Create:**

- `components/features/describe-step.tsx` - New file (renamed from entry-step)

**Files to Delete:**

- `components/features/entry-step.tsx` - Will be replaced

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Update import path and component reference

**Changes:**

- Create describe-step.tsx with DescribeStep component (copy and rename from entry-step)
- Rename EntryStepProps interface to DescribeStepProps
- Rename EntryStep component to DescribeStep
- Update page.tsx import from EntryStep to DescribeStep
- Update JSX render from EntryStep to DescribeStep
- Delete entry-step.tsx after migration

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] describe-step.tsx exists with DescribeStep component exported
- [ ] entry-step.tsx is removed
- [ ] Page correctly imports and renders DescribeStep
- [ ] All validation commands pass

---

### Step 5: Update DescribeStep Props to Include projectId

**What**: Extend DescribeStepProps to include projectId, which is needed for repository selection and fetching project-level data.
**Why**: The component needs projectId to fetch project repositories for the "inherit with edit" behavior and to enable repository selection functionality.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Add projectId to props interface
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Pass projectId prop to DescribeStep

**Changes:**

- Add projectId: number to DescribeStepProps interface
- Add projectId to the component destructuring
- Update the page.tsx to pass projectId prop when rendering DescribeStep

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] DescribeStep accepts projectId as a required prop
- [ ] Page passes projectId correctly to DescribeStep
- [ ] All validation commands pass

---

### Step 6: Integrate Repository Selection with "Inherit with Edit" Behavior

**What**: Add repository selection to the DescribeStep that pre-populates with project repositories and allows feature-level customization.
**Why**: Users need to select which repositories are relevant for this specific feature request. The "inherit with edit" pattern allows inheriting project defaults while enabling per-feature customization that persists at the feature level.
**Confidence**: Medium

**Files to Modify:**

- `components/features/describe-step.tsx` - Add repository selection section with TanStack Form integration

**Changes:**

- Import useAppForm from lib/forms/form-hook
- Import useRepositories hook for fetching project repositories
- Import useFeatureRequestRepositories and useSetFeatureRequestRepositories hooks
- Import RepositorySelector component
- Add form instance with repositoryIds field and appropriate validation schema
- Add useEffect to sync form state with fetched feature request repositories OR initialize with project repositories if empty
- Add form.AppField with onChange listener that triggers useSetFeatureRequestRepositories mutation
- Render RepositorySelector component within the form field
- Add description text explaining the inherit behavior ("Based on project defaults. Changes apply only to this feature.")

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Repository selector displays project repositories
- [ ] Pre-selects repositories from feature request if previously saved
- [ ] Falls back to project repositories if no feature-level selection exists
- [ ] Selection changes persist via mutation to feature request repositories
- [ ] All validation commands pass

---

### Step 7: Create Repository Overview Status Display Component

**What**: Create a RepositoryOverviewStatusPanel component that displays overview generation status for selected repositories.
**Why**: Users need visibility into which repositories have AI-generated overviews and their status (generated date, model used, validation state). This enables informed decisions about when to regenerate overviews.
**Confidence**: Medium

**Files to Create:**

- `components/features/workflow/repository-overview-status-panel.tsx` - New component for displaying overview statuses

**Changes:**

- Create component that accepts repositoryIds: Array<number> as prop
- Import useRepositoryOverviewStatuses hook
- Import repository data hook for getting repository names/paths
- Display each selected repository with its overview status:
  - Repository name and path (truncated)
  - Status indicator: Has Overview (green), No Overview (amber), Loading (gray spinner)
  - Generated date (if available) using formatDistanceToNow from date-fns
  - Model used (if available)
  - "Regenerate" button for each repository
- Handle loading state with skeleton UI
- Handle error state with appropriate messaging
- Use CVA for variant styling of status indicators

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component displays status for each repository in the array
- [ ] Shows appropriate status indicators (generated, not generated, loading)
- [ ] Displays generation metadata (date, model) when available
- [ ] Includes regenerate action for each repository
- [ ] All validation commands pass

---

### Step 8: Integrate Repository Overview Status Panel into DescribeStep

**What**: Add the RepositoryOverviewStatusPanel to the DescribeStep to show overview status for selected repositories.
**Why**: Users need to see the status of repository overviews to understand the context available for AI planning and decide whether regeneration is needed.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Import and render RepositoryOverviewStatusPanel

**Changes:**

- Import RepositoryOverviewStatusPanel component
- Add conditional render of RepositoryOverviewStatusPanel when repositories are selected
- Pass selectedRepositoryIds from form state to the panel
- Position the panel below the repository selector section

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Overview status panel renders when repositories are selected
- [ ] Panel updates when repository selection changes
- [ ] Panel is hidden when no repositories are selected
- [ ] All validation commands pass

---

### Step 9: Add Repository Overview Regeneration Dialog

**What**: Create a dialog that wraps RepositoryOverviewGenerator for regenerating repository overviews from the Describe Step.
**Why**: Users need the ability to regenerate overviews when the underlying repository has changed. The dialog provides a focused experience for the regeneration workflow.
**Confidence**: Medium

**Files to Create:**

- `components/features/workflow/repository-overview-regenerate-dialog.tsx` - Dialog wrapping the generator

**Files to Modify:**

- `components/features/workflow/repository-overview-status-panel.tsx` - Add dialog trigger to regenerate buttons

**Changes:**

- Create dialog component using Base UI Dialog primitives
- Import and embed RepositoryOverviewGenerator component
- Accept repositoryId and repositoryPath as props
- Handle onSave callback to close dialog and potentially show success message
- Handle onCancel callback to close dialog
- Wire up regenerate buttons in status panel to open the dialog with appropriate repository context

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Dialog opens when regenerate button is clicked
- [ ] RepositoryOverviewGenerator displays correctly within dialog
- [ ] Dialog closes on save or cancel
- [ ] Overview status refreshes after regeneration
- [ ] All validation commands pass

---

### Step 10: Integrate Context File Picker into DescribeStep

**What**: Add the ContextFilePicker component to the DescribeStep for selecting relevant code files.
**Why**: Users need to add context files that will be included in the AI planning process. This provides essential context about specific implementation details.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Import and render ContextFilePicker

**Changes:**

- Import ContextFilePicker from components/features/workflow/context-file-picker
- Add ContextFilePicker below the repository overview status panel
- Pass featureRequestId (from featureRequest.id prop) to the component
- Add section header/description explaining the purpose of context files

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] ContextFilePicker renders in the DescribeStep
- [ ] Users can add files via native file dialog
- [ ] Added files appear in the context file list
- [ ] Users can remove files from the list
- [ ] All validation commands pass

---

### Step 11: Create Token Estimation Warning Component

**What**: Create a TokenEstimationWarning component that displays dynamic token count and warns when approaching model limits.
**Why**: Users need feedback on context size to avoid exceeding model token limits. This prevents failed requests and helps users optimize their context selection.
**Confidence**: Medium

**Files to Create:**

- `components/features/workflow/token-estimation-warning.tsx` - Warning component with token display

**Changes:**

- Create component accepting contextFiles, selectedModel, and repositoryOverviewTokens props
- Import tokenlens for token estimation (use countTokens or encode function)
- Calculate total estimated tokens from:
  - Context file sizes (using tokenlens estimation)
  - Repository overview content (if available)
  - Base prompt overhead (configurable constant)
- Display current token count with progress bar toward model limit
- Show warning alert when tokens exceed 80% of model context window
- Show error alert when tokens exceed 100% of model context window
- Use appropriate color indicators (green < 60%, amber 60-80%, red > 80%)

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component displays estimated token count
- [ ] Progress bar visualizes usage against model limit
- [ ] Warning appears at 80% threshold
- [ ] Error appears at 100% threshold
- [ ] Token count updates dynamically when files are added/removed
- [ ] All validation commands pass

---

### Step 12: Integrate Token Estimation Warning into ContextFilePicker Enhancement

**What**: Integrate the TokenEstimationWarning component into the DescribeStep below the context file picker.
**Why**: Users need to see the impact of their context file selections on token usage in real-time as they add or remove files.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Add TokenEstimationWarning component

**Changes:**

- Import TokenEstimationWarning component
- Import useStepConfig hook to get currently selected model for the 'describe' step
- Import useContextFiles hook to get current context files
- Import useRepositoryOverviewStatuses for overview token estimation
- Add TokenEstimationWarning below ContextFilePicker
- Pass context files, selected model, and overview data to the warning component
- Ensure token counts update reactively when context changes

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Token warning displays below context file picker
- [ ] Token count updates when files are added/removed
- [ ] Warning reflects currently selected model's context limit
- [ ] All validation commands pass

---

### Step 13: Integrate StepSettingsPanel into DescribeStep

**What**: Add StepSettingsPanel to the DescribeStep to enable model selection, temperature, max tokens, thinking budget, and custom prompt configuration.
**Why**: Users need control over AI parameters for the describe/clarification step. Settings should persist at the step level for this feature request.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Import and render StepSettingsPanel

**Changes:**

- Import StepSettingsPanel from components/features/workflow/step-settings-panel
- Add StepSettingsPanel at the top of the component (before content areas)
- Pass featureRequestId from featureRequest.id
- Pass step={'describe'} to configure for the describe step
- Ensure the collapsible panel integrates visually with the rest of the step UI

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] StepSettingsPanel renders in DescribeStep
- [ ] Panel shows "Describe Settings" as the header
- [ ] Model selection, temperature, max tokens, thinking budget, and custom prompt are configurable
- [ ] Settings persist to database via upsert mutation
- [ ] "Customized" indicator appears when settings are modified
- [ ] All validation commands pass

---

### Step 14: Update Validation Schema for DescribeStep Form

**What**: Update or create a validation schema specifically for the DescribeStep form that validates raw request content and repository selection.
**Why**: Form validation ensures data integrity and provides user feedback. The schema should reflect the combined requirements of content entry and repository selection.
**Confidence**: High

**Files to Modify:**

- `lib/validations/feature-request.ts` - Add describeStepFormSchema

**Changes:**

- Create describeStepFormSchema using Zod that includes:
  - rawRequest: string (required, minimum length)
  - repositoryIds: array of numbers (optional, but recommended)
- Export DescribeStepFormValues type
- Optionally rename or deprecate entryStepFormSchema if no longer needed

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] describeStepFormSchema is exported and validates correctly
- [ ] DescribeStepFormValues type is exported
- [ ] Schema can be used with TanStack Form validators
- [ ] All validation commands pass

---

### Step 15: Refactor DescribeStep Layout and Visual Organization

**What**: Organize the DescribeStep UI into logical sections with clear visual hierarchy.
**Why**: The step now has multiple subsections (content, repositories, overviews, context files, settings). Clear organization improves usability and reduces cognitive load.
**Confidence**: High

**Files to Modify:**

- `components/features/describe-step.tsx` - Reorganize component layout

**Changes:**

- Organize into collapsible sections using existing Collapsible component:
  1. Settings Panel (collapsible, collapsed by default) - StepSettingsPanel
  2. Feature Description (always visible) - Textarea for rawRequest
  3. Repository Context (collapsible, expanded by default) - Repository selection + overview status
  4. Additional Context (collapsible, collapsed by default) - ContextFilePicker + TokenEstimationWarning
- Add section headers with consistent styling
- Ensure proper spacing between sections using gap utilities
- Maintain the ClarificationPanel integration at the bottom
- Keep the "Clarify Request" button functionality
- Add visual separators between major sections

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] UI is organized into logical, visually distinct sections
- [ ] Collapsible sections work correctly
- [ ] Proper visual hierarchy with headers and spacing
- [ ] All existing functionality (save, clarification) continues to work
- [ ] All validation commands pass

---

### Step 16: Update Page Step Content Descriptions

**What**: Update the stepContent object in the feature workflow page to reflect the enhanced capabilities of the Describe Step.
**Why**: The step content descriptions should accurately describe what users can do in each step. The enhanced Describe step has additional capabilities beyond just describing the feature.
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Update stepContent.describe

**Changes:**

- Update the describe step entry in stepContent object:
  - Keep icon as Lightbulb or consider changing to a more representative icon
  - Update title to "Describe Your Feature"
  - Update description to mention repository selection and context configuration capabilities

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Step card shows accurate title and description for Describe step
- [ ] Description reflects enhanced capabilities (repositories, context, settings)
- [ ] All validation commands pass

---

### Step 17: Integration Testing and Edge Case Handling

**What**: Add error boundaries and loading states for all integrated components, and verify end-to-end functionality.
**Why**: Robust error handling prevents cascading failures. Loading states provide feedback during async operations. Testing ensures all components work together correctly.
**Confidence**: Medium

**Files to Modify:**

- `components/features/describe-step.tsx` - Add loading/error states
- `components/features/workflow/repository-overview-status-panel.tsx` - Ensure error handling
- `components/features/workflow/token-estimation-warning.tsx` - Handle edge cases

**Changes:**

- Add loading skeletons for repository fetching
- Add error fallback UI for failed repository/overview fetches
- Handle empty state when no repositories exist in project
- Handle edge case when tokenlens fails to estimate (fallback to byte-based estimation)
- Ensure all mutations have appropriate error handling with user feedback
- Verify debounced save continues to work for rawRequest changes

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Loading states display during data fetching
- [ ] Error states display with actionable messages
- [ ] Empty states guide users appropriately
- [ ] All edge cases are handled gracefully
- [ ] End-to-end workflow functions correctly
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint --fix`
- [ ] DescribeStep renders without errors in Electron dev environment
- [ ] Repository selection persists at feature level
- [ ] Step settings persist to database
- [ ] Token estimation updates dynamically
- [ ] Clarification flow continues to work from Describe step
- [ ] Navigation between workflow steps functions correctly

## Notes

**Architecture Decisions:**

- Repository selection uses "inherit with edit" pattern: starts with project defaults but persists changes at feature level via useSetFeatureRequestRepositories mutation
- Token estimation uses tokenlens library which is already installed in the project
- StepSettingsPanel integration reuses the existing component with 'describe' step type addition
- The existing ClarificationPanel integration is preserved; it appears as an action triggered from the Describe step

**Risk Considerations:**

- Token estimation may be imprecise for some file types; consider displaying as "approximate" in the UI
- The 'describe' step type requires a schema change that will need migration awareness (though SQLite with Drizzle handles this gracefully)
- Large context file selections could impact performance of token estimation; consider memoization and throttling

**Dependencies:**

- tokenlens@1.3.1 is already installed per package.json
- All referenced components (StepSettingsPanel, ContextFilePicker, etc.) are assumed to exist from Phase 4
- Repository overview generator exists in components/repositories/repository-overview-generator.tsx
