# Create New Project Dialog - Implementation Plan

**Generated**: 2026-01-17T12:03:30Z
**Original Request**: The /projects page needs a dialog for the user to use to create a new project
**Orchestration Logs**: `../orchestration/create-project-dialog/`

---

## Overview

**Estimated Duration**: 3-4 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements a modal dialog for creating new projects on the projects page. The dialog will use Base UI's Dialog primitive wrapped with CVA variants for styling, TanStack React Form for form state management with Zod validation aligned to the Drizzle schema, and integrate with the existing `useCreateProject` mutation hook to persist data via Electron IPC.

## Prerequisites

- [ ] Base UI Dialog documentation reviewed for component API understanding
- [ ] Existing form infrastructure in `components/ui/form/` available and functional
- [ ] TanStack React Form hook (`useAppForm`) from `lib/forms/form-hook.ts` operational
- [ ] `useCreateProject` mutation hook in `hooks/queries/use-projects.ts` tested and working

## Implementation Steps

### Step 1: Create Reusable Dialog Component with CVA Variants

**What**: Create a reusable dialog component wrapping Base UI's Dialog primitive with CVA-based styling variants
**Why**: Establishes a consistent, reusable dialog pattern that matches the application's design system and can be used for future dialogs
**Confidence**: High

**Files to Create:**
- `components/ui/dialog.tsx` - Reusable dialog component with backdrop, popup, title, description, and close button sub-components

**Changes:**
- Import Dialog components from `@base-ui/react/dialog`
- Define CVA variants for `dialogBackdropVariants` (overlay styling with opacity, blur)
- Define CVA variants for `dialogPopupVariants` (sizing: sm, default, lg; rounded corners, shadow, background)
- Export composite components: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogBackdrop`, `DialogPopup`, `DialogTitle`, `DialogDescription`, `DialogClose`
- Apply CSS variables from `globals.css` for theme-consistent colors (--color-background, --color-foreground, --color-border)
- Add tw-animate-css utilities for open/close animations (animate-in, animate-out, fade-in, fade-out, zoom-in, zoom-out)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog component file created with proper TypeScript types
- [ ] All CVA variants compile without errors
- [ ] Component exports are properly typed with `ComponentPropsWithRef`
- [ ] All validation commands pass

---

### Step 2: Create Zod Validation Schema for Project Form

**What**: Create a Zod schema for project form validation that aligns with the Drizzle schema's `NewProject` type
**Why**: Ensures form validation rules match database constraints, providing type-safe validation between form inputs and database model
**Confidence**: High

**Files to Create:**
- `lib/validations/project.ts` - Zod schema for project creation form

**Changes:**
- Import `z` from Zod
- Define `createProjectSchema` with:
  - `name`: `z.string().min(1, "Project name is required").max(255, "Project name is too long")`
  - `description`: `z.string().optional()` (nullable in database schema)
- Export `CreateProjectFormValues` type inferred from schema
- Ensure schema alignment with `NewProject` type from `db/schema/projects.schema.ts`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Schema correctly validates required `name` field
- [ ] Schema allows optional `description` field
- [ ] Inferred type is compatible with `NewProject` type
- [ ] All validation commands pass

---

### Step 3: Create Project Creation Form Component

**What**: Build the form component for project creation using TanStack React Form with the Zod validation schema
**Why**: Provides a reusable form component that handles validation, submission states, and error display following project conventions
**Confidence**: High

**Files to Create:**
- `components/projects/create-project-form.tsx` - Form component for creating a new project

**Changes:**
- Import `useAppForm` from `lib/forms/form-hook.ts`
- Import field components: `TextField`, `TextareaField`, `SubmitButton` from form infrastructure
- Import `createProjectSchema` from validation schema file
- Define `CreateProjectFormProps` interface with `onSuccess` callback and `onCancel` callback
- Use `useAppForm` with Zod validator adapter and `createProjectSchema`
- Render form with:
  - `form.AppField` for `name` using `TextField` component (required, label: "Project Name")
  - `form.AppField` for `description` using `TextareaField` component (optional, label: "Description")
  - Action buttons row: Cancel button and `SubmitButton` with "Create Project" text
- Handle form submission to invoke the mutation function passed via props

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Form renders name and description fields correctly
- [ ] Validation errors display inline using field wrapper error states
- [ ] Submit button shows loading state during submission
- [ ] Cancel button is functional and calls `onCancel` prop
- [ ] All validation commands pass

---

### Step 4: Create New Project Dialog Component

**What**: Compose the dialog and form components into a complete "New Project" dialog with state management
**Why**: Encapsulates the dialog open/close state, form submission logic, and navigation behavior in a single component
**Confidence**: High

**Files to Create:**
- `components/projects/new-project-dialog.tsx` - Complete dialog component combining dialog UI and form

**Changes:**
- Import Dialog components from `components/ui/dialog.tsx`
- Import `CreateProjectForm` component
- Import `useCreateProject` from `hooks/queries/use-projects.ts`
- Import `useRouter` from `next/navigation` and `$path` from `next-typesafe-url`
- Define component with controlled `open` state using `useState`
- Define `handleSuccess` callback that:
  - Closes dialog
  - Navigates to new project detail page using `$path({ route: "/projects/[projectId]", routeParams: { projectId: project.id } })`
- Implement `handleSubmit` that calls `createProject.mutateAsync` and invokes `handleSuccess` on success
- Render Dialog structure:
  - `DialogTrigger` wrapping children (button slot)
  - `DialogPortal` containing `DialogBackdrop` and `DialogPopup`
  - `DialogTitle` with "Create New Project"
  - `DialogDescription` with helper text
  - `CreateProjectForm` with `onSubmit`, `onCancel` (closes dialog), and `isSubmitting` props
- Ensure proper focus management by leveraging Base UI's built-in dialog focus trap

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog opens and closes correctly
- [ ] Form submission triggers project creation via IPC
- [ ] Successful creation navigates to new project page
- [ ] Dialog closes on cancel button click
- [ ] Escape key closes dialog (Base UI built-in)
- [ ] All validation commands pass

---

### Step 5: Integrate Dialog into Projects Page

**What**: Add the New Project dialog trigger to the projects page header and empty state
**Why**: Makes the dialog accessible from the main projects page in both populated and empty states
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/page.tsx` - Integrate NewProjectDialog into page

**Changes:**
- Import `NewProjectDialog` component
- Replace header action Button with `NewProjectDialog` component, passing Button as trigger child
- Replace empty state action Button with `NewProjectDialog` component, passing Button as trigger child
- Ensure both trigger buttons maintain existing styling and icon (Plus icon)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Header "New Project" button opens dialog
- [ ] Empty state "Create your first project" button opens dialog
- [ ] Dialog functionality works correctly from both entry points
- [ ] Page layout and styling remain intact
- [ ] All validation commands pass

---

### Step 6: Add Dialog Component Export and Update UI Index

**What**: Export the new dialog component from the UI components index for discoverability
**Why**: Maintains consistent module structure and allows other parts of the application to import the dialog component easily
**Confidence**: High

**Files to Create:**
- `components/ui/index.ts` - UI components barrel export (if not exists, create; otherwise modify)

**Files to Modify:**
- `components/projects/index.ts` - Add NewProjectDialog export (create if not exists)

**Changes:**
- Export all dialog components and variants from `components/ui/dialog.tsx`
- Export `NewProjectDialog` from projects components index
- Export `CreateProjectForm` for potential reuse

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog components importable from `@/components/ui`
- [ ] Project dialog components importable from `@/components/projects`
- [ ] All validation commands pass

---

### Step 7: Manual Integration Testing

**What**: Verify the complete dialog flow works end-to-end in the Electron application
**Why**: Ensures all components integrate correctly and the IPC communication works as expected
**Confidence**: High

**Files to Modify:**
- None (testing step)

**Changes:**
- Run `pnpm electron:dev` to start the application
- Navigate to Projects page
- Test dialog opening from header button
- Test dialog opening from empty state (if no projects exist)
- Test form validation (submit with empty name)
- Test successful project creation and navigation
- Test cancel button and Escape key closing dialog
- Verify dark/light theme compatibility
- Test keyboard navigation (Tab through form fields)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog opens with smooth animation
- [ ] Form validation prevents empty name submission
- [ ] Error messages display correctly
- [ ] Successful creation persists to database
- [ ] Navigation to new project works
- [ ] Dialog closes cleanly with backdrop fade-out
- [ ] Theme colors apply correctly in both modes
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Dialog accessibility verified (focus trap, Escape to close, ARIA attributes)
- [ ] Form validation prevents invalid submissions
- [ ] IPC communication successfully creates database records
- [ ] Navigation after creation works correctly
- [ ] Component follows existing CVA pattern for styling
- [ ] No console errors during dialog lifecycle

## Notes

**Architecture Decisions:**
- Dialog component is created as a reusable primitive in `components/ui/` to allow future reuse for other dialogs (confirmation, edit, delete)
- Form component separated from dialog for potential standalone use and testing
- Zod schema placed in `lib/validations/` to establish a pattern for form validations
- Controlled dialog state managed within `NewProjectDialog` component rather than lifting to page level

**Assumptions Requiring Confirmation:**
- Base UI Dialog handles focus trapping and restoration automatically (confirmed in documentation)
- `useCreateProject` mutation returns the created project with its ID for navigation

**Key File Dependencies:**
- `db/schema/projects.schema.ts` - Defines `NewProject` type
- `hooks/queries/use-projects.ts` - Provides `useCreateProject` mutation
- `lib/forms/form-hook.ts` - Provides `useAppForm` and form context
- `components/ui/form/` - Provides field components

---

## Analysis Summary

- Feature request refined with project context (350 words)
- Discovered 41 files across 4 priority levels
- Generated 7-step implementation plan with clear validation checkpoints
