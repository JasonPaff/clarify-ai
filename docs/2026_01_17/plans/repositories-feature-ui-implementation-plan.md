# Implementation Plan: Repositories Feature UI

**Generated**: 2026-01-17
**Original Request**: repositories feature UI
**Refined Request**: The repositories feature UI should provide a complete interface for managing code repositories associated with a project within the Clarify AI desktop application.

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Build a complete UI for managing code repositories associated with projects, following the established patterns from the projects feature. This includes repository listing with cards, create/edit/delete dialogs with TanStack Form integration, and a path selector that uses the native Electron folder picker dialog.

## Prerequisites

- [ ] Verify existing query hooks in `hooks/queries/use-repositories.ts` are functional
- [ ] Verify validation schemas in `lib/validations/repository.ts` are complete
- [ ] Confirm `useElectronDialog().openDirectory()` hook is working for folder selection

## Implementation Steps

### Step 1: Create Repository Card Component

**What**: Create a reusable card component to display individual repository information
**Why**: Provides the visual representation for each repository in the list view, following the established ProjectCard pattern
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\repository-card.tsx` - Repository card with name, path display, and action buttons

**Changes:**
- Create `RepositoryCardProps` interface with `id`, `name`, `path`, `lastScannedAt`, and optional `fileCount` properties
- Add repository icon using GitBranch from lucide-react
- Display repository name as title
- Display truncated path with appropriate styling
- Add "Last scanned" timestamp using date-fns formatting (or "Never scanned" if null)
- Include edit and delete action buttons using IconButton with Pencil and Trash2 icons
- Wrap edit button with EditRepositoryDialog trigger
- Wrap delete button with DeleteRepositoryDialog trigger
- Follow ProjectCard component structure for layout and styling

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Component renders with correct props
- [ ] Repository icon, name, path, and timestamp display correctly
- [ ] Edit and delete buttons are visible
- [ ] All validation commands pass

---

### Step 2: Create Repositories Skeleton Component

**What**: Create a loading skeleton component for the repositories list
**Why**: Provides visual feedback during data loading, following the established ProjectsSkeleton pattern
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\skeletons\repositories-skeleton.tsx` - Loading skeleton for repository cards

**Changes:**
- Create `RepositoriesSkeleton` function component
- Use same grid layout as the repositories list (vertical stack with gap-4)
- Render 3 placeholder divs with animate-pulse and bg-muted classes
- Use appropriate height for repository card items (h-24 for compact cards)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Skeleton displays 3 animated placeholder items
- [ ] Layout matches the repository list grid structure
- [ ] All validation commands pass

---

### Step 3: Create Path Selector Field Component

**What**: Create a custom form field component that combines text input with a folder picker button
**Why**: Enables users to select a repository path using the native file dialog while also allowing manual entry
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\path-selector-field.tsx` - Custom field with text input and folder picker button

**Changes:**
- Create `PathSelectorFieldProps` interface extending standard field props (label, description, placeholder, disabled)
- Use `useFieldContext<string>()` from TanStack Form to access field state
- Import `useElectronDialog` hook for folder selection
- Create horizontal flex container with text input taking flex-grow
- Add Button with FolderOpen icon next to input that triggers `openDirectory()`
- On folder selection, call `field.handleChange()` with the selected path
- Use FieldWrapper from form components for consistent label/error styling
- Apply inputVariants styles to the text input portion

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Text input displays current path value
- [ ] Browse button opens native folder picker
- [ ] Selected folder path updates the field value
- [ ] Manual typing updates the field value
- [ ] Error states display correctly
- [ ] All validation commands pass

---

### Step 4: Create Repository Form Component

**What**: Create a reusable form component for creating and editing repositories
**Why**: Centralizes form logic and validation, allowing reuse between create and edit dialogs
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\create-repository-form.tsx` - Form for creating new repositories

**Changes:**
- Create `CreateRepositoryFormProps` interface with `isSubmitting`, `onCancel`, `onSubmit`, and `projectId` properties
- Use `useAppForm` hook with `createRepositorySchema` validator
- Set default values for name and path as empty strings
- Add TextField for repository name with appropriate label and placeholder
- Add PathSelectorField for repository path (custom component from Step 3)
- Include Cancel and Submit buttons in footer with proper disabled states
- Follow CreateProjectForm structure for form layout and button placement

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Form renders with name and path fields
- [ ] Path selector integrates with folder picker
- [ ] Form validation prevents empty submissions
- [ ] Cancel and Submit buttons work correctly
- [ ] All validation commands pass

---

### Step 5: Create New Repository Dialog Component

**What**: Create a dialog component that wraps the create form for adding new repositories
**Why**: Provides modal interface for repository creation, following the NewProjectDialog pattern
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\new-repository-dialog.tsx` - Dialog wrapper for create form

**Changes:**
- Create `NewRepositoryDialogProps` interface with `children` (trigger element) and `projectId` properties
- Use useState for dialog open/close state
- Import `useCreateRepository` mutation hook
- Implement `handleSubmit` function that calls mutation with projectId and form values
- Close dialog on successful creation
- Use DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup pattern
- Add DialogTitle "Connect Repository" and DialogDescription
- Include DialogClose button with X icon in top-right corner
- Render CreateRepositoryForm with isSubmitting, onCancel, and onSubmit props

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog opens when trigger is clicked
- [ ] Form renders inside dialog
- [ ] Successful submission creates repository and closes dialog
- [ ] Cancel button closes dialog without submission
- [ ] Close button (X) dismisses dialog
- [ ] All validation commands pass

---

### Step 6: Create Edit Repository Form Component

**What**: Create the edit form component with pre-populated values
**Why**: Provides interface for modifying existing repository details
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\edit-repository-form.tsx` - Form for editing repositories

**Changes:**
- Create `EditRepositoryFormProps` interface with `isSubmitting`, `onCancel`, `onSubmit`, and `repository` (containing id, name, path) properties
- Use `useAppForm` hook with `updateRepositorySchema` validator
- Set default values from the existing repository data
- Add TextField for repository name
- Add PathSelectorField for repository path
- Include Cancel and Save buttons in footer
- Follow EditProjectForm structure for consistency

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Form pre-populates with existing repository data
- [ ] Both name and path can be modified
- [ ] Form validation works correctly
- [ ] All validation commands pass

---

### Step 7: Create Edit Repository Dialog Component

**What**: Create a dialog component that wraps the edit form
**Why**: Provides modal interface for editing repository details, following the EditProjectDialog pattern
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\edit-repository-dialog.tsx` - Dialog wrapper for edit form

**Changes:**
- Create `EditRepositoryDialogProps` interface with `children` and `repository` (id, name, path) properties
- Use useState for dialog open/close state
- Import `useUpdateRepository` mutation hook
- Implement `handleSubmit` function that calls mutation with repository id and form values
- Close dialog on successful update
- Use same dialog structure as NewRepositoryDialog
- Add DialogTitle "Edit Repository" and appropriate DialogDescription
- Render EditRepositoryForm with repository data

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog opens with pre-populated form
- [ ] Successful submission updates repository and closes dialog
- [ ] Cancel closes dialog without changes
- [ ] All validation commands pass

---

### Step 8: Create Delete Repository Dialog Component

**What**: Create a confirmation dialog for repository deletion with typed confirmation
**Why**: Prevents accidental deletion by requiring user to type repository name to confirm
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\delete-repository-dialog.tsx` - Confirmation dialog for deletion

**Changes:**
- Create `DeleteRepositoryDialogProps` interface with `children` and `repository` (Repository type) properties
- Use useState for dialog open state and confirmation text input
- Import `useDeleteRepository` mutation hook
- Implement confirmation check comparing input text with repository name
- Use AlertDialog from @base-ui/react/alert-dialog (not Dialog)
- Add AlertDialog.Title "Delete Repository"
- Add AlertDialog.Description explaining deletion impact
- Add warning text about permanent deletion
- Add text input for typing repository name to confirm
- Add Cancel and Delete buttons with proper disabled states
- Apply destructive variant to Delete button
- Reset confirmation text when dialog closes

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog requires typing exact repository name to enable delete
- [ ] Delete button is disabled until confirmation matches
- [ ] Successful deletion removes repository and closes dialog
- [ ] Cancel closes dialog without deletion
- [ ] All validation commands pass

---

### Step 9: Create Repositories Index Barrel Export

**What**: Create barrel export file for all repository components
**Why**: Simplifies imports and follows the established pattern from components/projects/index.ts
**Confidence**: High

**Files to Create:**
- `C:\Users\jasonpaff\dev\clarify-ai\components\repositories\index.ts` - Barrel export file

**Changes:**
- Export CreateRepositoryForm from './create-repository-form'
- Export DeleteRepositoryDialog from './delete-repository-dialog'
- Export EditRepositoryDialog from './edit-repository-dialog'
- Export EditRepositoryForm from './edit-repository-form'
- Export NewRepositoryDialog from './new-repository-dialog'
- Export PathSelectorField from './path-selector-field'
- Export RepositoryCard from './repository-card'

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All components are exported correctly
- [ ] Imports work from '@/components/repositories'
- [ ] All validation commands pass

---

### Step 10: Update Repositories Page with Full Implementation

**What**: Integrate all components into the repositories page with data fetching and routing
**Why**: Completes the feature by wiring up all components with actual data and proper page structure
**Confidence**: High

**Files to Modify:**
- `C:\Users\jasonpaff\dev\clarify-ai\app\(app)\projects\[projectId]\repositories\page.tsx` - Main repositories page

**Changes:**
- Add 'use client' directive and import `withParamValidation` from next-typesafe-url/app
- Import Route and PageProps from './route-type'
- Import PageHeader from '@/components/layout/page-header'
- Import QueryErrorBoundary from '@/components/data/query-error-boundary'
- Import RepositoriesSkeleton from '@/components/skeletons/repositories-skeleton'
- Import RepositoryCard, NewRepositoryDialog from '@/components/repositories'
- Import EmptyState, Button from UI components
- Import useRepositories hook
- Update page component to receive routeParams via withParamValidation HOC
- Extract projectId from validated route params
- Render PageHeader with title "Repositories", description, and NewRepositoryDialog action button
- Wrap content in QueryErrorBoundary
- Create RepositoriesContent component that:
  - Calls useRepositories(projectId)
  - Shows RepositoriesSkeleton during loading
  - Shows EmptyState with NewRepositoryDialog when no repositories
  - Maps repositories to RepositoryCard components in a vertical list layout
- Pass projectId to NewRepositoryDialog for creating new repositories
- Export default with withParamValidation(Page, Route)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Page loads with correct route params validation
- [ ] Loading state shows skeleton
- [ ] Empty state displays when no repositories
- [ ] Repository list displays when data exists
- [ ] Create, edit, delete actions all work end-to-end
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Application runs without console errors (`pnpm electron:dev`)
- [ ] Repository CRUD operations complete successfully
- [ ] Native folder picker dialog opens correctly on all platforms
- [ ] Form validation prevents invalid submissions
- [ ] Cache invalidation works correctly after mutations

## Notes

- The Repository type from `db/schema/repositories.schema.ts` includes: `id`, `name`, `path`, `projectId`, `lastScannedAt`, `fileCount`, `createdAt`, `updatedAt`
- All TanStack Query hooks (`useRepositories`, `useCreateRepository`, `useUpdateRepository`, `useDeleteRepository`) already exist in `hooks/queries/use-repositories.ts`
- Validation schemas (`createRepositorySchema`, `updateRepositorySchema`) already exist in `lib/validations/repository.ts`
- The `useElectronDialog().openDirectory()` function returns `Promise<string | null>` for the selected path
- Follow alphabetical ordering for imports and object properties (enforced by eslint-plugin-perfectionist)
- The route already has `route-type.ts` with projectId param validation defined
- Use date-fns `formatDistanceToNow` or similar for displaying lastScannedAt timestamp in a human-readable format
