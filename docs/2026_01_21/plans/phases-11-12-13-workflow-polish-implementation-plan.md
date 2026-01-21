# Implementation Plan: Feature Request Workflow Phases 11, 12, and 13

Generated: 2026-01-21
Original Request: Plan the implementation of phase 11, 12, and 13 of the feature request workflow

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: Medium-High
**Risk Level**: Medium

## Quick Summary

This plan implements three phases of the Feature Request Workflow: Phase 11 enhances the create dialog with required field validation; Phase 12 extends project settings with plan export folder and default model configurations; Phase 13 adds polish through empty states, error handling improvements, loading skeletons, accessibility enhancements, and responsive design.

## Prerequisites

- [ ] Ensure development environment is running (`pnpm electron:dev`)
- [ ] Verify database migrations are up to date
- [ ] Confirm TanStack Form and TanStack Query are properly configured
- [ ] Review existing step configuration schema and repository patterns

## Implementation Steps

### Step 1: Enhance Feature Request Validation Schema

**What**: Update the Zod validation schema in `lib/validations/feature-request.ts` to require at least one repository for feature request creation.
**Why**: Ensures users select target repositories before creating a feature request, which is essential for the discovery and planning workflow.
**Confidence**: High

**Files to Modify:**

- `lib/validations/feature-request.ts` - Change `repositoryIdsSchema` to `requiredRepositoryIdsSchema` in `createFeatureRequestSchema`

**Changes:**

- Import `requiredRepositoryIdsSchema` from `feature-request-repositories.ts`
- Update `createFeatureRequestSchema` to use `requiredRepositoryIdsSchema` instead of `repositoryIdsSchema`
- Ensure the error message "At least one repository must be selected" is properly surfaced

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `createFeatureRequestSchema` validates that at least one repository is selected
- [ ] Validation error message is descriptive and user-friendly
- [ ] All validation commands pass

---

### Step 2: Add Required Indicator to TextField Component

**What**: Extend `TextField` component to support a `required` visual indicator.
**Why**: Provides visual feedback to users about which form fields are mandatory.
**Confidence**: High

**Files to Modify:**

- `components/ui/form/text-field.tsx` - Add `isRequired` prop and asterisk indicator

**Changes:**

- Add `isRequired?: boolean` prop to `TextFieldProps`
- Render asterisk indicator next to label when `isRequired` is true
- Style the asterisk with `text-destructive` to match form conventions

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] TextField displays red asterisk when `isRequired` is true
- [ ] Visual indicator is accessible (aria-hidden on decorative asterisk)
- [ ] All validation commands pass

---

### Step 3: Add Required Indicator to RepositorySelector Component

**What**: Extend `RepositorySelector` to display required state visually.
**Why**: Communicates to users that repository selection is mandatory for feature request creation.
**Confidence**: High

**Files to Modify:**

- `components/features/repository-selector.tsx` - Add `isRequired` prop and visual indicator

**Changes:**

- Add `isRequired?: boolean` prop to `RepositorySelectorProps`
- Pass `isRequired` to `MultiSelectField` component
- Update description text to indicate requirement when `isRequired` is true

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] RepositorySelector shows required indicator when `isRequired` is true
- [ ] Description text reflects mandatory nature of selection
- [ ] All validation commands pass

---

### Step 4: Enhance MultiSelectField with Required Indicator

**What**: Add required indicator support to `MultiSelectField` component.
**Why**: Ensures consistent required field styling across all form components.
**Confidence**: High

**Files to Modify:**

- `components/ui/form/multi-select-field.tsx` - Add `isRequired` prop and asterisk indicator

**Changes:**

- Add `isRequired?: boolean` prop to `MultiSelectFieldProps`
- Render asterisk indicator next to label when `isRequired` is true
- Style consistently with TextField required indicator

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] MultiSelectField displays red asterisk when `isRequired` is true
- [ ] Visual styling matches TextField required indicator
- [ ] All validation commands pass

---

### Step 5: Update CreateFeatureRequestForm with Validation Enhancements

**What**: Enhance the create feature request form with required indicators, FormError display, and improved SubmitButton behavior.
**Why**: Provides comprehensive validation feedback to users when creating feature requests.
**Confidence**: High

**Files to Modify:**

- `components/features/create-feature-request-form.tsx` - Add required indicators, FormError, and validation-aware submit

**Changes:**

- Add `isRequired` prop to Title TextField
- Add `isRequired` prop to RepositorySelector
- Update RepositorySelector description to indicate requirement
- Add `form.FormError` component to display validation errors
- Update form to use `onChange` validation mode for real-time feedback

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Title field shows required asterisk
- [ ] Repository selector shows required indicator
- [ ] FormError displays validation messages
- [ ] All validation commands pass

---

### Step 6: Enhance SubmitButton with Form Validity State

**What**: Update `SubmitButton` to disable when form is invalid or has not been validated.
**Why**: Prevents users from submitting forms with validation errors, improving UX.
**Confidence**: High

**Files to Modify:**

- `components/ui/form/submit-button.tsx` - Add form validity check to disabled state

**Changes:**

- Import `canSubmit` state from form store using `useStore`
- Update disabled logic to include `!canSubmit` condition
- Add appropriate ARIA attributes for disabled state

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] SubmitButton is disabled when form has validation errors
- [ ] Button becomes enabled when form is valid
- [ ] ARIA attributes correctly reflect disabled state
- [ ] All validation commands pass

---

### Step 7: Codex Code Review - Phase 11 (Create Dialog Enhancement)

**What**: Run Codex code review to validate Phase 11 implementation quality.
**Why**: AI-powered code review catches issues before they become problems.
**Confidence**: High

**Validation Commands:**

```bash
/codex-review
```

**Success Criteria:**

- [ ] Codex review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
- [ ] Phase 11 code quality approved by GPT 5.2 review

---

### Step 8: Add planExportFolder Field to Projects Schema

**What**: Extend the projects database schema with a `planExportFolder` field.
**Why**: Allows users to configure a default export location for implementation plans at the project level.
**Confidence**: High

**Files to Modify:**

- `db/schema/projects.schema.ts` - Add `planExportFolder` text field

**Changes:**

- Add `planExportFolder: text('plan_export_folder')` field to the schema
- Update type exports to include the new field

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck && pnpm db:generate
```

**Success Criteria:**

- [ ] Schema includes `planExportFolder` field
- [ ] Database migration generated successfully
- [ ] Types are properly inferred
- [ ] All validation commands pass

---

### Step 9: Update Project Validation Schema

**What**: Add `planExportFolder` field to project validation schemas.
**Why**: Ensures proper validation of the new field in forms.
**Confidence**: High

**Files to Modify:**

- `lib/validations/project.ts` - Add planExportFolder validation

**Changes:**

- Add `planExportFolder: z.string().optional()` to validation schemas
- Update both create and update schemas
- Export updated type definitions

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Validation schemas include planExportFolder
- [ ] Types properly reflect the new field
- [ ] All validation commands pass

---

### Step 10: Create DefaultModelSettings Component

**What**: Create a reusable component for configuring default AI models per workflow step.
**Why**: Provides UI for users to set default model configurations at the project level.
**Confidence**: Medium

**Files to Create:**

- `components/projects/default-model-settings.tsx` - New component for per-step model configuration

**Files to Reference:**

- `components/features/clarification/model-selector.tsx` for model selection pattern
- `components/features/workflow/step-settings-panel.tsx` for step configuration pattern

**Changes:**

- Create component that displays all four workflow steps (Describe, Clarify, Discover, Plan)
- Use `ModelSelector` component for each step's model selection
- Integrate with `useStepConfigurations` and `useUpsertStepConfig` hooks
- Apply CVA variants and Base UI styling for consistent appearance
- Use `SelectField` components for model selection

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders all four workflow steps
- [ ] Model selection works for each step
- [ ] Changes persist via step configuration repository
- [ ] Styling matches existing project settings patterns
- [ ] All validation commands pass

---

### Step 11: Create PlanExportFolderField Component

**What**: Create a form field component for selecting the plan export folder.
**Why**: Provides folder selection UI using existing dialog handlers.
**Confidence**: High

**Files to Create:**

- `components/projects/plan-export-folder-field.tsx` - Folder selection field using IPC dialog

**Changes:**

- Create component similar to `PathSelectorField` pattern
- Use `useElectronDialog.openDirectory` for folder selection
- Display current folder path with browse button
- Handle empty state and folder validation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders folder path input with browse button
- [ ] Folder selection dialog opens and returns selected path
- [ ] Path displays correctly in the input field
- [ ] All validation commands pass

---

### Step 12: Extend Project Settings Page

**What**: Add plan export folder and default model configuration sections to project settings.
**Why**: Provides centralized project-level configuration for export paths and AI model defaults.
**Confidence**: Medium

**Files to Modify:**

- `app/(app)/projects/[projectId]/settings/page.tsx` - Add new settings sections

**Changes:**

- Add "Export Settings" Card section with PlanExportFolderField
- Add "Default AI Models" Card section with DefaultModelSettings component
- Use existing Card/CardHeader/CardContent patterns
- Create form using `useAppForm` for plan export folder updates
- Integrate with `useUpdateProject` mutation for saving changes

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Export Settings section displays and functions correctly
- [ ] Default AI Models section shows all four workflow steps
- [ ] Changes save to database via repository pattern
- [ ] UI matches existing project settings styling
- [ ] All validation commands pass

---

### Step 13: Codex Code Review - Phase 12 (Project Settings Extensions)

**What**: Run Codex code review to validate Phase 12 implementation quality.
**Why**: AI-powered code review catches database schema and API endpoint issues.
**Confidence**: High

**Validation Commands:**

```bash
/codex-review
```

**Success Criteria:**

- [ ] Codex review completes without critical issues
- [ ] Database schema changes validated
- [ ] Any warnings or suggestions addressed or documented

---

### Step 14: Create WorkflowEmptyState Component

**What**: Create a specialized empty state component for workflow scenarios.
**Why**: Provides consistent empty state UI for run history, discovery results, and context files.
**Confidence**: High

**Files to Create:**

- `components/features/workflow/workflow-empty-state.tsx` - Workflow-specific empty state

**Changes:**

- Create component using Base UI primitives and Tailwind CSS v4 custom properties
- Support variants: `noHistory`, `noResults`, `noContext`
- Use appropriate icons from lucide-react
- Include optional action button for each variant
- Style with `--color-*` CSS custom properties for theme consistency

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Component renders different variants correctly
- [ ] Styling uses CSS custom properties
- [ ] Icons and messaging are appropriate for each scenario
- [ ] All validation commands pass

---

### Step 15: Create Workflow Skeleton Loader Component

**What**: Create skeleton loading component for workflow steps.
**Why**: Provides visual feedback during async TanStack Query operations.
**Confidence**: High

**Files to Create:**

- `components/skeletons/workflow-skeleton.tsx` - Skeleton for workflow step loading

**Changes:**

- Follow existing skeleton patterns from `projects-skeleton.tsx`
- Create variants for different workflow sections (settings panel, results, progress)
- Use `animate-pulse` class and `bg-muted` background
- Support responsive layouts

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skeleton renders appropriately sized placeholders
- [ ] Animation matches existing skeleton patterns
- [ ] Variants cover common workflow loading scenarios
- [ ] All validation commands pass

---

### Step 16: Create Discovery Step Skeleton

**What**: Create a specialized skeleton for the Discovery step loading state.
**Why**: Improves perceived performance during discovery data loading.
**Confidence**: High

**Files to Create:**

- `components/skeletons/discovery-skeleton.tsx` - Discovery-specific skeleton

**Changes:**

- Create skeleton mimicking discovery step layout
- Include placeholders for settings panel, repository status, and results area
- Use consistent pulse animation
- Match responsive breakpoints

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skeleton matches discovery step layout
- [ ] Smooth animation during loading
- [ ] All validation commands pass

---

### Step 17: Improve QueryErrorBoundary Error Display

**What**: Enhance QueryErrorBoundary with better error messages and retry button styling.
**Why**: Improves user experience when data fetching fails.
**Confidence**: High

**Files to Modify:**

- `components/data/query-error-boundary.tsx` - Enhance error UI

**Changes:**

- Improve error message formatting and clarity
- Style retry button using Button CVA variants (`variant={'destructive'}` or `variant={'outline'}`)
- Add icon to retry button for visual clarity
- Include error code or type when available
- Add `aria-live` region for error announcements

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Error messages are clear and actionable
- [ ] Retry button uses proper CVA variant styling
- [ ] Accessibility attributes are present
- [ ] All validation commands pass

---

### Step 18: Add Error Boundaries to AI Streaming Components

**What**: Wrap AI streaming components with react-error-boundary.
**Why**: Prevents streaming errors from crashing the entire workflow UI.
**Confidence**: High

**Files to Modify:**

- `components/features/clarify-step.tsx` - Add ErrorBoundary wrapper
- `components/features/discover-step.tsx` - Add ErrorBoundary wrapper
- `components/features/plan-step.tsx` - Add ErrorBoundary wrapper

**Changes:**

- Import `ErrorBoundary` from `react-error-boundary`
- Wrap ClarificationPanel with ErrorBoundary
- Wrap discovery progress and results sections with ErrorBoundary
- Wrap PlanPanel with ErrorBoundary
- Create fallback UI for each boundary with retry capability

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Each AI streaming component is wrapped with ErrorBoundary
- [ ] Fallback UI displays on error with retry option
- [ ] Errors are isolated and don't crash parent components
- [ ] All validation commands pass

---

### Step 19: Add Empty States to Discover Step

**What**: Implement empty state for when no discovery results exist.
**Why**: Provides clear feedback when discovery hasn't been run or returned no results.
**Confidence**: High

**Files to Modify:**

- `components/features/discover-step.tsx` - Add empty state handling

**Changes:**

- Use `WorkflowEmptyState` component with `noResults` variant
- Display empty state when discovery is complete but no files found
- Include action to re-run discovery
- Show helpful guidance text

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Empty state displays when no discovery results exist
- [ ] Action button allows re-running discovery
- [ ] Message provides helpful context
- [ ] All validation commands pass

---

### Step 20: Add Empty States to Plan Step

**What**: Implement empty state for when no plan has been generated.
**Why**: Guides users to generate a plan when viewing the plan step without results.
**Confidence**: High

**Files to Modify:**

- `components/features/plan-step.tsx` - Add empty state handling

**Changes:**

- Use appropriate empty state component
- Display when plan step is accessed without generated plan
- Include guidance on completing prerequisite steps
- Show action to generate plan

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Empty state displays appropriately
- [ ] Message guides users on next steps
- [ ] All validation commands pass

---

### Step 21: Add Empty State to RunHistoryDropdown

**What**: Improve empty state display in run history dropdown.
**Why**: Provides clearer feedback when no run history exists for a step.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow/run-history-dropdown.tsx` - Enhance empty state

**Changes:**

- Improve empty state messaging when no runs exist
- Add icon and descriptive text
- Consider disabled state styling improvements

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Empty state is visually clear
- [ ] Messaging explains why there's no history
- [ ] All validation commands pass

---

### Step 22: Add ARIA Labels and Roles to WorkflowSteps

**What**: Enhance accessibility of the workflow stepper component.
**Why**: Ensures the stepper is usable by screen reader users and meets accessibility standards.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Add ARIA attributes

**Changes:**

- Add `role="navigation"` to main container
- Add `aria-label="Workflow progress"` to stepper
- Add `aria-current="step"` to current step
- Add `aria-disabled` to non-clickable steps
- Add descriptive `aria-label` to step buttons
- Add `role="list"` and `role="listitem"` to step elements

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Stepper has proper navigation landmark
- [ ] Current step is announced correctly
- [ ] Step states are communicated to assistive technology
- [ ] All validation commands pass

---

### Step 23: Implement Keyboard Navigation for WorkflowSteps

**What**: Add full keyboard navigation support to the stepper.
**Why**: Enables keyboard-only users to navigate the workflow efficiently.
**Confidence**: Medium

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Add keyboard handlers

**Changes:**

- Add `onKeyDown` handler to stepper container
- Implement Arrow Up/Down navigation between steps
- Add Home/End keys to jump to first/last step
- Add Enter/Space to activate current step
- Manage focus state with `tabIndex` and refs
- Implement roving tabindex pattern for step buttons

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Arrow keys navigate between steps
- [ ] Enter/Space activate the focused step
- [ ] Focus is properly managed
- [ ] Keyboard navigation respects disabled states
- [ ] All validation commands pass

---

### Step 24: Add Live Region Announcements for Status Changes

**What**: Implement ARIA live region for workflow status updates.
**Why**: Announces step transitions and status changes to screen reader users.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Add live region announcements

**Changes:**

- Add hidden live region element with `aria-live="polite"`
- Announce step changes: "Step N of M: [Step Name]"
- Announce completion status changes
- Announce stale step warnings

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Status changes are announced by screen readers
- [ ] Announcements are timely and informative
- [ ] Live region doesn't interfere with visual layout
- [ ] All validation commands pass

---

### Step 25: Add Responsive Breakpoints to WorkflowSteps

**What**: Implement responsive design for stepper on smaller screens.
**Why**: Ensures the workflow functions properly on various screen sizes.
**Confidence**: Medium

**Files to Modify:**

- `components/features/workflow-steps.tsx` - Add responsive styling

**Changes:**

- Use Tailwind responsive breakpoint utilities (`sm:`, `md:`, `lg:`)
- Collapse step descriptions on smaller screens
- Adjust step indicator sizes for mobile
- Consider horizontal stepper variant for narrow viewports
- Update CSS custom property `--stepper-width` for responsive behavior

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Stepper is usable on mobile devices
- [ ] Content adapts appropriately to screen width
- [ ] Touch targets remain accessible (minimum 44x44px)
- [ ] All validation commands pass

---

### Step 26: Add Responsive Design to Step Settings Panel

**What**: Make the step settings panel responsive and collapsible on smaller screens.
**Why**: Preserves usability when screen space is limited.
**Confidence**: Medium

**Files to Modify:**

- `components/features/workflow/step-settings-panel.tsx` - Add responsive behavior

**Changes:**

- Use Tailwind responsive utilities for layout adjustments
- Collapse by default on mobile (`sm:` breakpoint)
- Stack controls vertically on narrow screens
- Adjust padding and spacing for mobile

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Settings panel collapses appropriately on mobile
- [ ] All controls remain accessible
- [ ] Layout adapts smoothly across breakpoints
- [ ] All validation commands pass

---

### Step 27: Update globals.css with Additional Responsive Variables

**What**: Add responsive CSS custom properties for workflow components.
**Why**: Centralizes responsive dimension values for consistent styling.
**Confidence**: High

**Files to Modify:**

- `app/globals.css` - Add responsive custom properties

**Changes:**

- Add responsive stepper width variables
- Add mobile-specific gap variables
- Consider container query support for component-level responsiveness
- Document responsive breakpoint values

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New CSS variables are defined
- [ ] Variables work across light/dark themes
- [ ] All validation commands pass

---

### Step 28: Add Loading States to Workflow Steps

**What**: Integrate skeleton loaders into workflow step components.
**Why**: Provides visual feedback during data loading operations.
**Confidence**: High

**Files to Modify:**

- `components/features/discover-step.tsx` - Add skeleton loading
- `components/features/plan-step.tsx` - Add skeleton loading
- `components/features/clarify-step.tsx` - Add skeleton loading

**Changes:**

- Import skeleton components
- Show skeleton during initial data loading (`isPending` from TanStack Query)
- Replace content with skeleton while loading
- Ensure smooth transition between loading and loaded states

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Skeleton displays during initial load
- [ ] Transition to content is smooth
- [ ] User perceives responsive UI
- [ ] All validation commands pass

---

### Step 29: Codex Code Review - Phase 13 (Polish and Edge Cases)

**What**: Run comprehensive Codex code review for Phase 13 implementation.
**Why**: AI-powered review validates accessibility, responsive design, and edge case handling.
**Confidence**: High

**Validation Commands:**

```bash
/codex-review
```

**Success Criteria:**

- [ ] Codex review completes without critical issues
- [ ] Accessibility implementations validated
- [ ] Responsive design patterns reviewed
- [ ] Any warnings or suggestions addressed or documented

---

### Step 30: Final Codex Code Review - All Phases

**What**: Run final comprehensive Codex code review for entire implementation.
**Why**: Final quality gate ensures all phases integrate correctly and meet quality standards.
**Confidence**: High

**Validation Commands:**

```bash
/codex-review
```

**Success Criteria:**

- [ ] Codex review completes without critical issues
- [ ] All three phases integrate properly
- [ ] No regressions introduced
- [ ] Code quality approved by GPT 5.2 review

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Database migrations generated and applied successfully
- [ ] Phase 11 Codex review passes (`/codex-review`)
- [ ] Phase 12 Codex review passes (`/codex-review`)
- [ ] Phase 13 Codex review passes (`/codex-review`)
- [ ] Final Codex code review passes (`/codex-review`)
- [ ] Manual testing of form validation in create dialog
- [ ] Manual testing of project settings extensions
- [ ] Manual accessibility testing with keyboard navigation
- [ ] Manual responsive design testing at various breakpoints

## Notes

- The `requiredRepositoryIdsSchema` already exists in `lib/validations/feature-request-repositories.ts` and enforces at least one selection
- The existing `PathSelectorField` component provides a proven pattern for folder selection with IPC dialog integration
- The `ModelSelector` component from clarification panel can be reused for default model configuration
- Step configurations already support per-project, per-step model settings via the existing schema and repository
- Empty state patterns are established in `EmptyState` component and `DiscoveryResults` component
- Skeleton patterns are established in `components/skeletons/` directory
- Keyboard navigation should follow WAI-ARIA Authoring Practices for tabbed interfaces and toolbars
- Responsive breakpoints follow Tailwind CSS v4 conventions with mobile-first approach
- All CSS custom properties should work in both light and dark themes
- Error boundaries should be granular enough to isolate failures but not fragment the UI excessively
