# Import Repository Overview Feature - Implementation Plan

**Generated**: 2026-01-19
**Original Request**: the repository overview should have a way to import an overview in case the user already has one that they want to use or create.

**Refined Request**: The repository overview feature should be enhanced to support importing pre-existing overview content from external sources, providing users with flexibility when they already have documentation they want to reuse. This import capability should offer two distinct input methods to accommodate different workflows: first, a file upload mechanism using Electron's native file dialog (via the existing `electron:selectFile` IPC channel from `dialog.handlers.ts`) that allows users to browse and select Markdown files from their file system, with filtering restricted to `.md` extensions; second, a paste-from-clipboard option using a textarea input field where users can directly paste overview content without needing to save it as a file first. When implementing this feature, the application should leverage the existing repository overview infrastructure in `db/repositories/repository-overviews.repository.ts`, storing imported content in the `content` field of the `repositoryOverviews` table, setting `modelId` to the literal string `'imported'` to distinguish imported overviews from AI-generated ones, and recording `generatedAt` as the current timestamp at the moment of import. To prevent accidental data loss, the import flow must check whether an overview already exists for the repository using the existing query hooks in `hooks/queries/repository-overviews.queries.ts`, and if one is found, display a confirmation dialog warning the user that importing will overwrite their existing overview content, requiring explicit confirmation before proceeding with the destructive operation. The UI implementation should integrate seamlessly into the existing repository overview page at `app/(app)/projects/[projectId]/repositories/[repositoryId]/page.tsx`, potentially adding an "Import Overview" button alongside the existing "Generate Overview" functionality, with the import dialog using TanStack Form for state management following the patterns in `lib/forms/form-hook.ts`, TanStack Query mutations for the import operation with proper cache invalidation of the `repositoryOverviews.detail` query key, and Base UI components styled with CVA variants for consistency with the rest of the application. The import operation should be handled through a new IPC channel in `electron/ipc/repositories.handlers.ts` that accepts the repository ID and imported content, validates the input, and uses the repository overview repository's upsert method to persist the data to the SQLite database.

## Analysis Summary

- **Feature request refined** with project context from CLAUDE.md
- **User clarification gathered** for import method, existing content handling, and metadata storage
- **Discovered 28 files** across 4 priority levels (8 critical, 9 high, 6 medium, 5 low)
- **Generated 10-step implementation plan** with quality gates and validation

## File Discovery Results

### Critical Priority Files
- `electron/ipc/repository-overviews.handlers.ts` - Add import handler
- `electron/ipc/channels.ts` - Add IPC channel constant
- `db/repositories/repository-overviews.repository.ts` - Upsert method for persistence
- `hooks/queries/use-repository-overviews.ts` - Query hooks for existing overview check + import mutation
- `lib/queries/repository-overviews.ts` - Query key factory for cache invalidation
- `components/repositories/import-repository-overview-dialog.tsx` - **NEW FILE** Main import dialog

### High Priority Files (Integration)
- `components/repositories/repository-card.tsx` - Add import button
- `components/repositories/repository-overview-viewer.tsx` - Show import indicator
- `electron/ipc/dialog.handlers.ts` - File selection with .md filter
- `electron/ipc/fs.handlers.ts` - Read file content
- `hooks/useElectron.ts` - Electron API hooks
- `types/electron.ts` - ElectronAPI types
- `electron/preload.ts` - Context bridge

### Supporting Files
- Form infrastructure: `lib/forms/form-hook.ts`, `components/ui/form/textarea-field.tsx`
- UI components: `components/ui/dialog.tsx`, `components/ui/button.tsx`, `components/ui/radio-group.tsx`, `components/ui/badge.tsx`, `components/ui/alert.tsx`
- Schema: `db/schema/repository-overviews.schema.ts`

---

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

This feature adds the ability to import pre-existing overview content from external sources into repository overviews, offering both file upload and paste-from-clipboard input methods. The implementation will integrate with existing repository overview infrastructure, include overwrite protection, and follow established IPC/TanStack patterns.

## Prerequisites

- [ ] Verify existing IPC channel `electron:selectFile` works with Markdown file filtering
- [ ] Confirm `db/repositories/repository-overviews.repository.ts` has upsert capability
- [ ] Review existing confirmation dialog patterns in the codebase

## Implementation Steps

### Step 1: Add IPC Channel for Import Operation

**What**: Define new IPC channel constant for importing repository overview content
**Why**: Following the project's typed IPC channel pattern ensures type safety and maintainability
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add `'electron:importRepositoryOverview'` channel constant

**Changes:**
- Add new channel constant to the channels object: `'electron:importRepositoryOverview'`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] New channel constant added to channels object
- [ ] All validation commands pass

---

### Step 2: Implement IPC Handler for Import

**What**: Create IPC handler in repository overviews handlers to process import requests
**Why**: Centralizes validation and database operations following the repository pattern
**Confidence**: High

**Files to Modify:**
- `electron/ipc/repository-overviews.handlers.ts` - Add import handler function
- `electron/ipc/register-handlers.ts` - Register the new import handler

**Changes:**
- Add handler function that accepts `repositoryId` and `content` parameters
- Validate input parameters (non-empty content, valid repository ID)
- Use repository overview repository's upsert method with `modelId: 'imported'` and current timestamp
- Register handler in the handler registration function

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handler validates input parameters before processing
- [ ] Handler uses repository upsert method correctly
- [ ] Handler is registered in register-handlers.ts
- [ ] All validation commands pass

---

### Step 3: Update Type Definitions for Electron API

**What**: Add type definitions for the new import IPC channel
**Why**: Ensures type safety when calling the import function from the renderer process
**Confidence**: High

**Files to Modify:**
- `types/electron.ts` - Add `importRepositoryOverview` method signature
- `electron/preload.ts` - Expose import method through contextBridge

**Changes:**
- Add method signature: `importRepositoryOverview(repositoryId: number, content: string): Promise<void>`
- Expose method in preload script using `ipcRenderer.invoke` with the new channel

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Type definition matches handler signature
- [ ] Preload script exposes method correctly
- [ ] All validation commands pass

---

### Step 4: Create TanStack Query Mutation Hook

**What**: Add import mutation hook to repository overviews query hooks
**Why**: Provides proper cache invalidation and optimistic updates following TanStack Query patterns
**Confidence**: High

**Files to Modify:**
- `hooks/queries/use-repository-overviews.ts` - Add `useImportRepositoryOverview` mutation hook

**Changes:**
- Create mutation hook that calls `electronDb.importRepositoryOverview`
- Invalidate `repositoryOverviews.detail` and `repositoryOverviews.list` query keys on success
- Include proper error handling with type-safe error messages

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Mutation hook properly invalidates cache on success
- [ ] Hook uses `useElectronDb()` for IPC calls
- [ ] Error handling is implemented
- [ ] All validation commands pass

---

### Step 5: Create Confirmation Dialog Component

**What**: Build reusable confirmation dialog component for overwrite warnings
**Why**: Prevents accidental data loss when importing over existing overviews
**Confidence**: High

**Files to Create:**
- `components/repositories/import-confirmation-dialog.tsx` - Confirmation dialog component

**Changes:**
- Create dialog component using Base UI Dialog primitives
- Accept props: `isOpen`, `onConfirm`, `onCancel`
- Display warning message about overwriting existing content
- Style with CVA variants for consistency

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog uses Base UI primitives correctly
- [ ] Warning message clearly communicates data loss risk
- [ ] Component follows CVA styling patterns
- [ ] All validation commands pass

---

### Step 6: Create Import Dialog Component

**What**: Build main import dialog with file upload and paste options
**Why**: Provides the primary UI for users to import overview content
**Confidence**: Medium

**Files to Create:**
- `components/repositories/import-repository-overview-dialog.tsx` - Main import dialog

**Changes:**
- Create dialog component using Base UI Dialog primitives
- Use TanStack Form with `useAppForm` hook for state management
- Add radio group to select input method (file upload vs paste)
- Add file selection button that calls `electron:selectFile` with `.md` filter
- Add TextareaField component for paste option
- Include form validation (content must not be empty)
- Wire up submit handler to call import mutation
- Handle loading and error states

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Form uses `useAppForm` hook correctly
- [ ] Radio group switches between input methods
- [ ] File dialog integration works with Markdown filter
- [ ] Textarea field accepts pasted content
- [ ] Form validation prevents empty submissions
- [ ] All validation commands pass

---

### Step 7: Integrate Import Flow with Confirmation Logic

**What**: Add orchestration logic to check for existing overview and show confirmation dialog
**Why**: Ensures users don't accidentally overwrite existing content
**Confidence**: Medium

**Files to Modify:**
- `components/repositories/import-repository-overview-dialog.tsx` - Add confirmation flow logic

**Changes:**
- Query for existing overview using `useRepositoryOverview` hook
- On form submit, check if overview exists
- If exists, show confirmation dialog component
- If confirmed or no existing overview, proceed with import mutation
- Close dialog on successful import
- Display success/error feedback

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Existing overview check works correctly
- [ ] Confirmation dialog appears only when overview exists
- [ ] Import proceeds after confirmation
- [ ] Dialog closes on success
- [ ] All validation commands pass

---

### Step 8: Add Import Button to Repository Overview Page

**What**: Integrate import dialog into the repository overview page UI
**Why**: Provides user access to the import functionality
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/repositories/[repositoryId]/page.tsx` - Add import button and dialog

**Changes:**
- Add "Import Overview" button near existing "Generate Overview" functionality
- Add state management for dialog open/close
- Include ImportRepositoryOverviewDialog component
- Pass repository ID to dialog component
- Ensure button is appropriately disabled during loading states

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Import button is visible and accessible
- [ ] Dialog opens/closes correctly
- [ ] Repository ID is passed to dialog
- [ ] UI integrates seamlessly with existing page layout
- [ ] All validation commands pass

---

### Step 9: Update Repository Overview Badge Logic

**What**: Modify badge display to show "Imported" for imported overviews
**Why**: Distinguishes imported overviews from AI-generated ones in the UI
**Confidence**: High

**Files to Modify:**
- `components/repositories/repository-overview-viewer.tsx` - Update badge rendering logic
- `components/repositories/repository-card.tsx` - Update badge rendering if overview info shown

**Changes:**
- Add conditional logic to check if `modelId === 'imported'`
- Display "Imported" badge variant for imported overviews
- Maintain existing badge display for AI-generated overviews

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Badge displays "Imported" when modelId is 'imported'
- [ ] Existing AI model badges continue to work
- [ ] Badge styling is consistent with existing patterns
- [ ] All validation commands pass

---

### Step 10: Add Validation Schema for Import Form

**What**: Create Zod validation schema for import form inputs
**Why**: Ensures type-safe validation following project validation patterns
**Confidence**: High

**Files to Create:**
- `lib/validations/import-repository-overview.ts` - Zod schema for import form

**Changes:**
- Create schema with fields: `inputMethod` (enum: 'file' or 'paste'), `content` (string, min 1 char)
- Export schema and infer TypeScript type
- Add validation error messages

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema validates input method selection
- [ ] Schema validates non-empty content
- [ ] Type is properly inferred from schema
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Import dialog opens and closes correctly
- [ ] File selection dialog filters to `.md` files only
- [ ] Paste option accepts and submits content
- [ ] Confirmation dialog appears when overwriting existing overview
- [ ] Import creates overview with `modelId: 'imported'`
- [ ] Badge displays "Imported" for imported overviews
- [ ] Cache invalidation updates UI immediately after import
- [ ] Error states display appropriate user feedback

## Notes

**Assumptions:**
- The existing `electron:selectFile` IPC channel in `dialog.handlers.ts` supports file type filtering
- The repository overview repository's upsert method correctly handles the `'imported'` modelId value
- The existing dialog components support nested dialogs (main import dialog + confirmation dialog)

**Risks:**
- **Medium Risk**: Dialog UX with two nested dialogs (import + confirmation) may feel clunky; consider alternative flows if user testing shows confusion
- **Low Risk**: File reading implementation not explicitly mentioned in file discovery; may need to add file content reading logic in the IPC handler

**Technical Considerations:**
- The `'imported'` string literal for `modelId` should be added as a constant to avoid magic strings
- Consider adding a character limit validation for pasted content to prevent performance issues with extremely large files
- The import operation should be atomic (all-or-nothing) to prevent partial data corruption
