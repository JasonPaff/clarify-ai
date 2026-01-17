# Implementation Plan: Edit and Delete Projects

Generated: 2026-01-17
Original Request: The user needs a way to edit and delete projects
Refined Request: The application currently allows users to create projects but lacks the ability to edit existing project details or delete projects entirely, which are essential CRUD operations for a complete project management experience.

## Overview

**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan implements the ability to edit project name/description via a modal dialog and delete projects with a confirmation alert dialog. The backend infrastructure (IPC handlers, repository methods, TanStack Query hooks) is already complete; this plan focuses on creating the UI components and integrating them into the project settings page.

## Prerequisites

- [ ] Verify the existing `useUpdateProject` and `useDeleteProject` hooks are functional
- [ ] Confirm Base UI AlertDialog component can be imported from `@base-ui/react/alert-dialog`
- [ ] Ensure the project settings page has access to `projectId` via route params

## Implementation Steps

### Step 1: Add Update Project Validation Schema

**What**: Extend the project validation file with an `updateProjectSchema` for edit form validation
**Why**: Ensures consistent validation between create and update operations while allowing for reuse of shared validation rules
**Confidence**: High

**Files to Modify:**

- `lib/validations/project.ts` - Add updateProjectSchema and associated type export

**Changes:**

- Add `updateProjectSchema` using the same validation rules as `createProjectSchema`
- Export `UpdateProjectFormValues` type inferred from the schema
- Consider extracting shared field validation into reusable schema parts for DRY compliance

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] `updateProjectSchema` exported from the validation file
- [ ] `UpdateProjectFormValues` type available for import
- [ ] All validation commands pass

---

### Step 2: Create Edit Project Form Component

**What**: Build a reusable form component for editing project details using TanStack Form
**Why**: Separates form logic from dialog presentation, following the existing pattern established by `create-project-form.tsx`
**Confidence**: High

**Files to Create:**

- `components/projects/edit-project-form.tsx` - Form component with pre-populated values

**Changes:**

- Create `EditProjectFormProps` interface accepting `project` data, `onSubmit` callback, `onCancel` callback, and `isSubmitting` state
- Implement form using `useAppForm` hook with `updateProjectSchema` validator
- Pre-populate `defaultValues` from the passed project prop
- Include TextField for name and TextareaField for description (matching create form structure)
- Add Cancel and Save buttons using the form's SubmitButton component
- Follow exact structure of `create-project-form.tsx` for consistency

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Component renders with pre-populated project data
- [ ] Form validation matches create project validation rules
- [ ] Component exports are properly typed
- [ ] All validation commands pass

---

### Step 3: Create Edit Project Dialog Component

**What**: Build a dialog component that wraps the edit form and manages dialog state
**Why**: Provides a consistent modal interface following the `new-project-dialog.tsx` pattern
**Confidence**: High

**Files to Create:**

- `components/projects/edit-project-dialog.tsx` - Dialog wrapper for the edit form

**Changes:**

- Create `EditProjectDialogProps` interface with `project` data prop and `children` render prop for trigger
- Use Base UI Dialog components (DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogClose)
- Manage controlled open state with `useState`
- Integrate `useUpdateProject` mutation hook from `use-projects.ts`
- Call mutation on form submit, close dialog on success
- Include close button using IconButton with X icon (matching new-project-dialog pattern)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog opens when trigger is clicked
- [ ] Form displays current project data
- [ ] Successful update closes dialog and invalidates queries
- [ ] Dialog can be dismissed via close button or backdrop
- [ ] All validation commands pass

---

### Step 4: Create Delete Project Confirmation Dialog Component

**What**: Build an AlertDialog component for confirming project deletion
**Why**: Project deletion is a destructive operation that requires explicit user confirmation to prevent accidental data loss
**Confidence**: High

**Files to Create:**

- `components/projects/delete-project-dialog.tsx` - Confirmation dialog for deletion

**Changes:**

- Create `DeleteProjectDialogProps` interface with `project` data prop and `children` render prop for trigger
- Import AlertDialog from `@base-ui/react/alert-dialog`
- Use AlertDialog components (Root, Trigger, Portal, Backdrop, Popup, Title, Description, Close)
- Implement controlled open state with `useState`
- Integrate `useDeleteProject` mutation hook
- Display project name in confirmation message
- Add warning text about cascading deletion of repositories and features
- Include Cancel button (closes dialog) and Delete button (triggers mutation)
- Style Delete button with destructive variant
- Navigate to `/projects` after successful deletion using `useRouter`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] AlertDialog opens when trigger is clicked
- [ ] Confirmation message displays project name
- [ ] Cancel button closes dialog without action
- [ ] Delete button triggers mutation and navigates away on success
- [ ] All validation commands pass

---

### Step 5: Update Project Settings Page with Edit and Delete UI

**What**: Integrate the edit and delete dialogs into the project settings page
**Why**: Provides the user interface for accessing edit and delete functionality from the appropriate location
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/settings/page.tsx` - Add edit and delete UI integration

**Changes:**

- Add `withParamValidation` HOC wrapper for type-safe route params (following other project pages)
- Import Route from `./route-type` for param validation
- Use `use()` hook to await `routeParams` and extract `projectId`
- Add `useProject(projectId)` hook to fetch current project data
- Import and render `EditProjectDialog` in the General settings card
- Replace placeholder content with an Edit button wrapped by `EditProjectDialog`
- Import and render `DeleteProjectDialog` wrapping the existing Delete button in Danger Zone
- Add loading state handling while project data is being fetched
- Add error state handling if project fetch fails

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Settings page fetches and displays project data
- [ ] Edit button opens edit dialog with current project info
- [ ] Delete button opens confirmation dialog
- [ ] Loading and error states are handled appropriately
- [ ] All validation commands pass

---

### Step 6: Export New Components from Projects Index

**What**: Add exports for the new dialog components to the projects component barrel file (if one exists)
**Why**: Maintains consistent import patterns across the codebase
**Confidence**: Medium

**Files to Modify:**

- `components/projects/index.ts` - Add exports (create file if it does not exist)

**Changes:**

- Export `EditProjectDialog` from `./edit-project-dialog`
- Export `EditProjectForm` from `./edit-project-form`
- Export `DeleteProjectDialog` from `./delete-project-dialog`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] All new components can be imported from `@/components/projects`
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Edit dialog opens, pre-populates data, validates input, and saves changes
- [ ] Delete dialog opens, displays warning, and deletes project on confirmation
- [ ] TanStack Query cache invalidates correctly after edit/delete operations
- [ ] Navigation works correctly after project deletion
- [ ] UI remains responsive during mutation operations

## Notes

- The backend infrastructure is already complete (IPC channels, handlers, repository methods, TanStack Query hooks)
- Follow the exact patterns established in `new-project-dialog.tsx` and `create-project-form.tsx` for consistency
- Base UI AlertDialog requires direct import from `@base-ui/react/alert-dialog` since no wrapper exists in the codebase
- The settings page needs to be converted from a static component to use `withParamValidation` for accessing route params
- Project deletion cascades to associated repositories and features due to database schema relationships - this should be clearly communicated in the confirmation dialog
- Consider adding toast notifications for success/error feedback in a future enhancement (not in current scope as no toast system exists yet)

---

## Analysis Summary

- Feature request refined with project context
- Discovered 35 files across the codebase
- Generated 6-step implementation plan
- Backend infrastructure already complete - focus on UI components only
