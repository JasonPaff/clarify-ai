# Step 2: File Discovery

## Metadata

| Field | Value |
|-------|-------|
| **Step** | 2 - File Discovery |
| **Start Time** | 2026-01-17T00:00:20Z |
| **End Time** | 2026-01-17T00:01:30Z |
| **Duration** | ~70 seconds |
| **Status** | ✅ Completed |

## Input

**Refined Feature Request** (from Step 1):
The feature request UI implementation should provide a complete user interface for managing feature requests within a project context, leveraging the existing feature requests data layer that includes CRUD operations and validation.

## Agent Prompt Sent

```
Analyze the codebase and discover ALL files relevant to implementing this feature:

**Refined Feature Request**:
[Full refined request from Step 1]

**Requirements**:
1. Find ALL existing files that will need to be modified or referenced
2. Identify patterns from similar features (repositories management) to follow
3. Categorize files by priority: Critical, High, Medium, Low
4. Include database schemas, IPC handlers, query hooks, validations, components, and pages
5. Provide reasoning for each file's relevance

Discover at least 10 relevant files across all architectural layers.
```

## Discovery Summary

| Metric | Value |
|--------|-------|
| Directories Explored | 12 |
| Candidate Files Examined | 65+ |
| Highly Relevant Files | 28 |
| Supporting/Reference Files | 16 |

## Discovered Files by Priority

### Critical Priority (Core Implementation - Must Modify)

| File | Status | Action Required |
|------|--------|-----------------|
| `app/(app)/projects/[projectId]/features/page.tsx` | Placeholder | Full implementation needed |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Placeholder | Integrate real data |
| `app/(app)/projects/[projectId]/features/route-type.ts` | Exists | Verify type exports |
| `app/(app)/projects/[projectId]/features/[featureId]/route-type.ts` | Exists | Reference only |

### High Priority (New Components to Create)

| File | Status | Purpose |
|------|--------|---------|
| `components/features/feature-request-card.tsx` | To Create | Card display component |
| `components/features/new-feature-request-dialog.tsx` | To Create | Creation dialog |
| `components/features/edit-feature-request-dialog.tsx` | To Create | Edit dialog |
| `components/features/delete-feature-request-dialog.tsx` | To Create | Delete confirmation |
| `components/features/create-feature-request-form.tsx` | To Create | Form for creation |
| `components/features/edit-feature-request-form.tsx` | To Create | Form for editing |
| `components/skeletons/feature-requests-skeleton.tsx` | To Create | Loading skeleton |

### High Priority (Existing - Reference/Verify)

| File | Status | Purpose |
|------|--------|---------|
| `db/schema/feature-requests.schema.ts` | Complete | Schema reference |
| `db/repositories/feature-requests.repository.ts` | Complete | Repository methods |
| `electron/ipc/feature-requests.handlers.ts` | Complete | IPC handlers |
| `electron/ipc/channels.ts` | Has channels | Channel names reference |
| `hooks/queries/use-feature-requests.ts` | Complete | Query hooks ready to use |
| `lib/queries/feature-requests.ts` | Complete | Query key factories |
| `lib/validations/feature-request.ts` | Complete | Zod schemas ready |
| `types/electron.d.ts` | Has types | Type definitions |
| `electron/preload.ts` | Has exposure | API exposure |
| `hooks/useElectron.ts` | Has methods | Database hook |

### Medium Priority (Reference Patterns)

| File | Purpose |
|------|---------|
| `app/(app)/projects/[projectId]/repositories/page.tsx` | Primary pattern reference |
| `components/repositories/new-repository-dialog.tsx` | Dialog pattern |
| `components/repositories/repository-card.tsx` | Card pattern |
| `components/repositories/delete-repository-dialog.tsx` | Delete confirmation pattern |
| `components/repositories/create-repository-form.tsx` | Form pattern |
| `components/skeletons/repositories-skeleton.tsx` | Skeleton pattern |
| `lib/validations/repository.ts` | Validation schema pattern |
| `hooks/queries/use-repositories.ts` | Query hooks pattern |

### Medium Priority (UI Components to Use)

| File | Exports |
|------|---------|
| `components/ui/dialog.tsx` | Dialog primitives |
| `components/ui/card.tsx` | Card components |
| `components/ui/button.tsx` | Button with variants |
| `components/ui/empty-state.tsx` | Empty state component |
| `components/layout/page-header.tsx` | Page header component |
| `components/data/query-error-boundary.tsx` | Error boundary |
| `lib/forms/form-hook.ts` | useAppForm hook |
| `components/ui/form/text-field.tsx` | Text input |
| `components/ui/form/textarea-field.tsx` | Textarea |
| `components/ui/form/select-field.tsx` | Select dropdown |

### Low Priority (May Need Updates)

| File | Current State | Action |
|------|---------------|--------|
| `components/projects/project-tabs.tsx` | Has Features tab | Verify working |
| `components/layout/sidebar-nav.tsx` | Main nav items | Check if updates needed |
| `app/globals.css` | CSS variables | Reference for styling |
| `types/component-types.ts` | Global types | Reference |

## Architecture Insights

### Existing Patterns Identified

1. **Page Structure Pattern** (from `repositories/page.tsx`):
   - `withParamValidation` HOC for type-safe route params
   - Separate content component from main page
   - `QueryErrorBoundary` wrapper
   - Skeleton during loading, empty state when no data
   - `PageHeader` with action button

2. **Dialog Pattern** (from `new-repository-dialog.tsx`):
   - Controlled open state with `useState`
   - Trigger wrapped in `DialogTrigger`
   - Mutation with `mutateAsync`
   - Close on success

3. **Form Pattern** (from `create-repository-form.tsx`):
   - `useAppForm` with `defaultValues` and `validators.onSubmit`
   - `form.AppField` with render function
   - Cancel and submit buttons

4. **Card Component Pattern** (from `repository-card.tsx`):
   - Icon in header
   - Edit/delete icon buttons
   - Title and description
   - Metadata at bottom

5. **Query Hook Pattern** (from `use-repositories.ts`):
   - List query with `queryKeys.byProject(projectId)`
   - Detail query with `queryKeys.detail(id)`
   - Mutation cache invalidation strategies

### Status Badge Mapping (Suggested)

| Status | Color |
|--------|-------|
| `draft` | `text-muted-foreground` (gray) |
| `refining` | `text-accent` (blue) |
| `researching` | `text-accent` (blue) |
| `planning` | `text-accent` (blue) |
| `completed` | `text-green-500` (green) |

### Integration Points Confirmed

- ✅ Navigation: Features tab exists in `ProjectTabs`
- ✅ Data Layer: Complete CRUD infrastructure exists
- ✅ Forms: `useAppForm` hook and field components ready
- ✅ Validation: Zod schemas in `lib/validations/feature-request.ts`
- ✅ Query Cache: Query key factories in `lib/queries/feature-requests.ts`

## Validation Results

| Check | Result |
|-------|--------|
| Minimum files discovered (≥10) | ✅ Pass (38 files) |
| Files categorized by priority | ✅ Pass |
| All paths validated | ✅ Pass |
| Patterns identified | ✅ Pass |
| Comprehensive coverage | ✅ Pass |

---

**MILESTONE:STEP_2_COMPLETE**
