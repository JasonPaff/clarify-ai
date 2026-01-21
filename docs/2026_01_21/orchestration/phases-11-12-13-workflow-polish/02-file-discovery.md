# Step 2: AI-Powered File Discovery

## Step Metadata

- **Started**: 2026-01-21
- **Ended**: 2026-01-21
- **Status**: Completed

## Input

**Refined Feature Request** from Step 1: Implement Phases 11, 12, and 13 of the Feature Request Workflow to complete the creation dialog enhancement, project settings extensions, and polish and edge case handling.

## Discovery Summary

- **Directories Explored**: 15+
- **Files Examined**: 50+
- **Files Identified**: 45
- **Priority Distribution**: Critical (8), High (18), Medium (7), Low (5), Reference (7)

## Discovered Files by Phase

### Phase 11: Create Dialog Enhancement

#### Critical Priority

| File | Status | Relevance |
|------|--------|-----------|
| `components/features/create-feature-request-form.tsx` | Modify | Main form - needs validation enhancement, required field indicators |
| `lib/validations/feature-request.ts` | Modify | Schema update to require at least one repository |
| `lib/validations/feature-request-repositories.ts` | Reference | Has `requiredRepositoryIdsSchema` pattern to reuse |

#### High Priority

| File | Status | Relevance |
|------|--------|-----------|
| `components/ui/form/submit-button.tsx` | Modify | Add form validity state check |
| `components/features/repository-selector.tsx` | Modify | Support required state, update description |
| `components/ui/form/form-error.tsx` | Reference | Error display pattern |
| `components/ui/form/text-field.tsx` | Reference | Required field indicator pattern |
| `lib/forms/form-hook.ts` | Reference | TanStack Form configuration |

### Phase 12: Project Settings Extensions

#### Critical Priority

| File | Status | Relevance |
|------|--------|-----------|
| `app/(app)/projects/[projectId]/settings/page.tsx` | Modify | Add planExportFolder and default model sections |
| `db/schema/projects.schema.ts` | Modify | Add `planExportFolder` field |
| `db/schema/step-configurations.schema.ts` | Reference | Existing per-step model config |
| `db/repositories/step-configurations.repository.ts` | Reference | Upsert method for configs |

#### High Priority

| File | Status | Relevance |
|------|--------|-----------|
| `electron/ipc/dialog.handlers.ts` | Reference | Folder picker handler |
| `hooks/queries/use-projects.ts` | Reference | Project update mutation |
| `hooks/queries/use-step-configurations.ts` | Reference | Step config hooks |
| `lib/validations/project.ts` | Modify | Add planExportFolder validation |
| `components/features/workflow/step-settings-panel.tsx` | Reference | Model config UI pattern |

#### Medium Priority

| File | Status | Relevance |
|------|--------|-----------|
| `components/repositories/path-selector-field.tsx` | Reference | Path picker pattern |
| `components/ui/card.tsx` | Reference | Settings card layout |

### Phase 13: Polish & Edge Cases

#### Critical Priority

| File | Status | Relevance |
|------|--------|-----------|
| `components/ui/empty-state.tsx` | Reference/Extend | Base empty state component |
| `components/data/query-error-boundary.tsx` | Modify | Improve error messages, retry styling |
| `components/features/workflow-steps.tsx` | Modify | ARIA labels, keyboard nav, live regions |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Modify | Error boundaries, responsive design |

#### High Priority - Empty States

| File | Status | Relevance |
|------|--------|-----------|
| `components/features/workflow/run-history-dropdown.tsx` | Modify | Empty state enhancement |
| `components/features/discover-step.tsx` | Modify | Add empty state for no results |
| `components/features/plan-step.tsx` | Modify | Add empty state for no plan |
| `components/features/workflow/context-file-list.tsx` | Reference | Inline empty state pattern |

#### High Priority - Loading States

| File | Status | Relevance |
|------|--------|-----------|
| `components/skeletons/` (existing patterns) | Reference | Skeleton implementation patterns |
| `components/skeletons/workflow-skeleton.tsx` | Create | New skeleton for workflow steps |

#### High Priority - Error Handling

| File | Status | Relevance |
|------|--------|-----------|
| `components/features/clarify-step.tsx` | Modify | Add error boundary wrapper |
| `components/features/discover-step.tsx` | Modify | Add error boundary wrapper |
| `components/features/describe-step.tsx` | Reference | Error state Alert pattern |
| `components/ui/alert.tsx` | Reference | Alert component variants |

#### Medium Priority - Accessibility

| File | Status | Relevance |
|------|--------|-----------|
| `components/providers/workflow-provider.tsx` | Modify | Live region announcements |
| `lib/workflow/step-validation.ts` | Reference | Validation messages to announce |

#### Medium Priority - Responsive

| File | Status | Relevance |
|------|--------|-----------|
| `app/globals.css` | Modify | Responsive breakpoint utilities |

## Key Patterns Identified

### TanStack Form Pattern
- Uses `useAppForm` hook with Zod validators
- Field components integrate with `useFieldContext`
- `SubmitButton` checks `isSubmitting` state

### Validation Pattern
- Schemas in `lib/validations/`
- `repositoryIdsSchema` allows empty (optional)
- `requiredRepositoryIdsSchema` enforces `.min(1)`

### Empty State Pattern
- `EmptyState` component accepts: title, description, icon, action
- Used in `QueryErrorBoundary` for errors

### Skeleton Pattern
- Uses `animate-pulse` and `bg-muted` classes
- Responsive grid layouts

### Step Configuration Pattern
- `StepSettingsPanel` for per-step model config
- Uses `useStepConfig` and `useUpsertStepConfig` hooks

## Files Requiring Creation

| File | Purpose |
|------|---------|
| `components/skeletons/workflow-skeleton.tsx` | Skeleton loaders for workflow step content |

## Migration Requirements

- Add `planExportFolder` field to projects schema
- Run `pnpm db:generate` and `pnpm db:migrate`
