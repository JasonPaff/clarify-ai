# Feature Request UI Implementation Plan

**Generated**: 2026-01-17
**Original Request**: feature request UI
**Refined Request**: The feature request UI implementation should provide a complete user interface for managing feature requests within a project context, leveraging the existing feature requests data layer that includes CRUD operations and validation.

---

## Overview

| Attribute              | Value     |
| ---------------------- | --------- |
| **Estimated Duration** | 6-8 hours |
| **Complexity**         | Medium    |
| **Risk Level**         | Low       |

## Quick Summary

This plan implements a complete feature request management UI including a list page with card-based layout, new/edit/delete dialogs, status badges, and proper navigation integration. The implementation follows the established repository management pattern and leverages the existing TanStack Query hooks and Zod validation schemas.

## Prerequisites

- [x] Existing TanStack Query hooks in `hooks/queries/use-feature-requests.ts` are complete
- [x] Validation schemas in `lib/validations/feature-request.ts` are complete
- [x] Database schema in `db/schema/feature-requests.schema.ts` is complete
- [x] Route type files for features pages exist

## Implementation Steps

### Step 1: Create Status Badge Component

**What**: Create a reusable status badge component with color-coded variants for feature request statuses
**Why**: Status visualization is needed across the feature cards and detail pages, requiring a centralized component with CVA variants
**Confidence**: High

**Files to Create:**

- `components/ui/badge.tsx` - Reusable badge component with status variants

**Changes:**

- Create a Badge component using CVA pattern following existing UI component conventions
- Define variants for each feature request status: `draft` (gray), `refining` (yellow), `researching` (blue), `planning` (purple), `completed` (green)
- Use CSS variables from the theme system for consistent color coding
- Export the component and variant types

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Badge component renders with correct styling for each status variant
- [ ] Component follows CVA pattern consistent with other UI components
- [ ] All validation commands pass

---

### Step 2: Create Feature Requests Loading Skeleton

**What**: Create a skeleton loading component for the feature requests list
**Why**: Provides visual feedback during async data loading, following the pattern established by `RepositoriesSkeleton`
**Confidence**: High

**Files to Create:**

- `components/skeletons/feature-requests-skeleton.tsx` - Loading skeleton for feature request cards

**Changes:**

- Create `FeatureRequestsSkeleton` component with animated placeholder cards
- Use `animate-pulse` and `bg-muted` classes matching the `RepositoriesSkeleton` pattern
- Display 3-4 placeholder cards with appropriate height for feature request card dimensions

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Skeleton renders with smooth pulse animation
- [ ] Visual appearance matches the expected feature request card layout
- [ ] All validation commands pass

---

### Step 3: Create Feature Request Card Component

**What**: Create a card component for displaying individual feature requests in the list view
**Why**: Provides a consistent, reusable display format for feature requests with actions following the `RepositoryCard` pattern
**Confidence**: High

**Files to Create:**

- `components/features/feature-request-card.tsx` - Card component for displaying feature request info

**Changes:**

- Create `FeatureRequestCard` component with props for title, description, status, createdAt, and action callbacks (onEdit, onDelete, onClick)
- Display Lightbulb icon in the card header matching the feature icon pattern
- Include status badge using the Badge component created in Step 1
- Display truncated description with creation date using `date-fns` `formatDistanceToNow`
- Add edit and delete `IconButton` actions in the card header
- Make the card clickable to navigate to the feature workflow page
- Use Card, CardHeader, CardContent, CardTitle, CardDescription components

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Card displays all feature request information correctly
- [ ] Status badge shows appropriate color for each status
- [ ] Edit and delete buttons trigger callback functions
- [ ] All validation commands pass

---

### Step 4: Create Feature Request Form Component

**What**: Create a reusable form component for creating and editing feature requests
**Why**: Centralizes form logic using TanStack Form with the `useAppForm` hook, enabling reuse across new and edit dialogs
**Confidence**: High

**Files to Create:**

- `components/features/create-feature-request-form.tsx` - Form for creating new feature requests

**Changes:**

- Create `CreateFeatureRequestForm` component with props for `onSubmit`, `onCancel`, and `isSubmitting`
- Use `useAppForm` hook from `lib/forms/form-hook.ts`
- Add TextField for title with autoFocus
- Add TextareaField for description
- Apply `createFeatureRequestSchema` validation from `lib/validations/feature-request.ts`
- Include Cancel and Submit buttons following the `CreateRepositoryForm` pattern

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Form validates input according to Zod schema
- [ ] Submit triggers onSubmit callback with form values
- [ ] Cancel button triggers onCancel callback
- [ ] All validation commands pass

---

### Step 5: Create Edit Feature Request Form Component

**What**: Create a form component specifically for editing existing feature requests
**Why**: Edit form needs to pre-populate values and may include status field, requiring a separate component
**Confidence**: High

**Files to Create:**

- `components/features/edit-feature-request-form.tsx` - Form for editing feature requests

**Changes:**

- Create `EditFeatureRequestForm` component with props for `featureRequest`, `onSubmit`, `onCancel`, and `isSubmitting`
- Use `useAppForm` hook with defaultValues populated from the featureRequest prop
- Add TextField for title with autoFocus
- Add TextareaField for description
- Add SelectField for status using `featureRequestStatuses` from validation schema
- Apply `updateFeatureRequestSchema` validation
- Include Cancel and Save buttons following the `EditRepositoryForm` pattern

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Form pre-populates with existing feature request values
- [ ] Status dropdown shows all valid status options
- [ ] Form validates according to update schema
- [ ] All validation commands pass

---

### Step 6: Create New Feature Request Dialog Component

**What**: Create a dialog component for creating new feature requests
**Why**: Provides a modal interface for creating feature requests following the `NewRepositoryDialog` pattern
**Confidence**: High

**Files to Create:**

- `components/features/new-feature-request-dialog.tsx` - Dialog for creating new feature requests

**Changes:**

- Create `NewFeatureRequestDialog` component with props for `projectId` and `children` (trigger element)
- Use DialogRoot, DialogTrigger, DialogPortal, DialogBackdrop, DialogPopup, DialogTitle, DialogDescription, DialogClose components
- Integrate `useCreateFeatureRequest` mutation hook
- Pass handleSubmit and handleCancel to CreateFeatureRequestForm
- Close dialog on successful creation
- Include X button for closing in the top-right corner

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog opens when trigger is clicked
- [ ] Form submission creates new feature request via mutation
- [ ] Dialog closes on successful creation or cancel
- [ ] All validation commands pass

---

### Step 7: Create Edit Feature Request Dialog Component

**What**: Create a dialog component for editing existing feature requests
**Why**: Provides a modal interface for editing feature requests following the `EditRepositoryDialog` pattern with controlled/uncontrolled support
**Confidence**: High

**Files to Create:**

- `components/features/edit-feature-request-dialog.tsx` - Dialog for editing feature requests

**Changes:**

- Create `EditFeatureRequestDialog` component with props for `featureRequest`, `children`, `open`, and `onOpenChange`
- Support both controlled and uncontrolled open state like `EditRepositoryDialog`
- Integrate `useUpdateFeatureRequest` mutation hook
- Pass featureRequest data to EditFeatureRequestForm
- Close dialog on successful update

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog works in both controlled and uncontrolled modes
- [ ] Form submission updates feature request via mutation
- [ ] Dialog closes on successful update
- [ ] All validation commands pass

---

### Step 8: Create Delete Feature Request Dialog Component

**What**: Create an alert dialog component for confirming feature request deletion
**Why**: Destructive actions require confirmation following the `DeleteRepositoryDialog` pattern with type-to-confirm
**Confidence**: High

**Files to Create:**

- `components/features/delete-feature-request-dialog.tsx` - Confirmation dialog for deletion

**Changes:**

- Create `DeleteFeatureRequestDialog` component using `@base-ui/react/alert-dialog`
- Accept props for `featureRequest` (with id and title), `children`, `open`, and `onOpenChange`
- Include type-to-confirm input requiring user to type the feature title
- Integrate `useDeleteFeatureRequest` mutation hook
- Display warning message about permanent deletion
- Include Cancel and Delete buttons with destructive variant

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Dialog requires typing feature title to enable delete button
- [ ] Delete button triggers mutation and closes dialog
- [ ] Cancel clears confirmation input and closes dialog
- [ ] All validation commands pass

---

### Step 9: Update Features List Page

**What**: Replace placeholder features page with full implementation using TanStack Query and feature request components
**Why**: Main entry point for feature request management needs complete CRUD functionality
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/page.tsx` - Full implementation of features list page

**Changes:**

- Add `withParamValidation` HOC wrapper with Route import
- Create `FeaturesContent` component that uses `useFeatureRequests(projectId)` hook
- Display `FeatureRequestsSkeleton` during loading state
- Display `EmptyState` when no feature requests exist with New Feature Request button
- Map feature requests to `FeatureRequestCard` components
- Add state for `editingFeatureRequest` and `deletingFeatureRequest` (using Pick type)
- Render `EditFeatureRequestDialog` and `DeleteFeatureRequestDialog` conditionally based on state
- Wrap content in `QueryErrorBoundary`
- Add `PageHeader` with "Feature Requests" title and New Feature Request button
- Make cards clickable to navigate to feature workflow page using Link

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page displays loading skeleton while fetching
- [ ] Page displays empty state when no feature requests
- [ ] Page displays list of feature request cards when data exists
- [ ] Edit and delete dialogs open from card actions
- [ ] New feature request dialog opens from header button
- [ ] All validation commands pass

---

### Step 10: Update Feature Detail Page with Data Integration

**What**: Integrate the existing feature workflow page with actual feature request data from the database
**Why**: The existing placeholder page needs to fetch and display real feature request data
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Integrate with data layer

**Changes:**

- Import and use `useFeatureRequest(featureId)` hook to fetch feature request data
- Replace hardcoded `featureName` with actual feature request title from data
- Add loading state handling while feature request is being fetched
- Handle case where feature request is not found (navigate back or show error)
- Display feature request description in the entry step content area
- Display status badge showing current workflow status

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Page fetches and displays actual feature request data
- [ ] Title shows the real feature request title
- [ ] Loading state is handled appropriately
- [ ] Not found state navigates back or shows appropriate message
- [ ] All validation commands pass

---

### Step 11: Regenerate Route Types

**What**: Run the next-typesafe-url command to regenerate route type definitions
**Why**: Ensures type-safe routing is up to date with any route changes
**Confidence**: High

**Files to Modify:**

- None directly; this generates/updates type definition files

**Changes:**

- Run `pnpm next-typesafe-url` to regenerate route types
- Verify generated types include features routes

**Validation Commands:**

```bash
pnpm next-typesafe-url && pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Route types are regenerated successfully
- [ ] Type checking passes with updated route types
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Feature requests list page loads and displays data correctly
- [ ] Create feature request dialog creates new records
- [ ] Edit feature request dialog updates existing records
- [ ] Delete feature request dialog removes records with confirmation
- [ ] Feature detail page loads real feature request data
- [ ] Navigation between features list and detail pages works correctly
- [ ] Status badges display correct colors for all status values
- [ ] Empty states and loading skeletons display appropriately

## Notes

- The ProjectTabs component already includes a "Features" tab linking to the features page, so no sidebar modification is needed
- The validation schemas in `lib/validations/feature-request.ts` are already complete and should be used directly
- The TanStack Query hooks in `hooks/queries/use-feature-requests.ts` are complete with proper cache invalidation
- The feature workflow page already exists with navigation and workflow step UI; it just needs data integration
- Follow the repository management components as reference for consistent patterns and styling
- Use FeatureRequest type from `db/schema/feature-requests.schema.ts` for type safety
- Status values are: `draft`, `refining`, `researching`, `planning`, `completed`
