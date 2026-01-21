# Step 2: AI-Powered File Discovery

**Start Time**: 2026-01-21T00:02:00Z
**End Time**: 2026-01-21T00:02:45Z
**Duration**: ~45 seconds
**Status**: Completed

## Refined Request Used as Input

Implement Phase 10 Feature Request List and Management by enhancing the features list page at `app/(app)/projects/[projectId]/features/page.tsx` with comprehensive filtering, search, and archive capabilities. Add a status filter dropdown using the existing `Select` component from `@base-ui/react` (`components/ui/select.tsx`) that filters feature requests by their workflow status values (draft, describing, clarifying, researching, planning, completed, failed), with filter state managed via URL query parameters using `nuqs` for persistence and shareability. Implement a search input using the existing `Input` component (`components/ui/input.tsx`) with Search icon from `lucide-react` that filters the list by title and description, applying debouncing (300-400ms) via a custom hook or `useDeferredValue` to prevent excessive re-renders during typing. Add a "Show archived" toggle using the existing `Switch` component (`components/ui/switch.tsx`) that controls visibility of archived items, persisting this preference via the `electron-store` handlers in `electron/ipc/store.handlers.ts` through the existing IPC channels. Extend the `FeatureRequestCard` component (`components/features/feature-request-card.tsx`) to include Archive and Unarchive actions alongside the existing Edit and Delete buttons, utilizing the `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` mutations already implemented in `hooks/queries/use-feature-requests.ts`. Apply visual distinction to archived items through reduced opacity, muted styling, or a subtle badge indicator. Update the feature request repository's `getByProjectId` method in `db/repositories/feature-requests.repository.ts` to optionally filter by archived state, or implement client-side filtering since the `archivedAt` field already exists with an index. Enhance the status badges on `FeatureRequestCard` to use the existing `Badge` component variants (`components/ui/badge.tsx`) which already have appropriate color mappings for all workflow statuses, and add visual indicators for stale feature requests by checking the `staleSteps` field and displaying a warning icon or stale badge variant. The filter toolbar should be positioned between the `PageHeader` and the feature request list, containing the search input, status filter select, and archive toggle in a responsive horizontal layout.

## Discovery Analysis

- **Directories Explored**: 12
- **Files Examined**: 45+
- **Relevant Files Found**: 20
- **Supporting Files**: 8

## Discovered Files by Priority

### Critical Priority (Core Implementation)

| File | Reason | Expected Changes |
|------|--------|------------------|
| `app/(app)/projects/[projectId]/features/page.tsx` | PRIMARY file - entire filtering, search, and archive UI implementation | Add status filter dropdown, search input with debouncing, "Show archived" toggle, filter toolbar layout, client-side filtering logic, nuqs integration |
| `components/features/feature-request-card.tsx` | Must extend with Archive/Unarchive actions and archived visual distinction | Add `onArchive`/`onUnarchive` props, icon buttons, archived styling, stale warning indicator |
| `hooks/queries/use-feature-requests.ts` | Contains archive/unarchive mutations already implemented | No changes - import and use existing mutations |

### High Priority (Supporting/Integration)

| File | Reason | Expected Changes |
|------|--------|------------------|
| `app/(app)/projects/[projectId]/features/route-type.ts` | May extend with searchParams for nuqs | Potentially add searchParams schema |
| `db/schema/feature-requests.schema.ts` | Reference for types, status values, archivedAt, staleSteps | None - reference only |
| `components/ui/select.tsx` | Status filter dropdown component | None - use existing |
| `components/ui/input.tsx` | Search input component | None - use existing |
| `components/ui/switch.tsx` | "Show archived" toggle component | None - use existing |
| `components/ui/badge.tsx` | Status badges, may need stale variant | May add "stale" or "warning" variant |
| `hooks/use-debounced-callback.ts` | Search input debouncing | None - use existing |
| `hooks/useElectron.ts` | useElectronStore for persisting showArchived | None - use existing |

### Medium Priority (Reference/Context)

| File | Reason | Expected Changes |
|------|--------|------------------|
| `electron/ipc/store.handlers.ts` | Reference for store IPC implementation | None - reference only |
| `electron/ipc/channels.ts` | Reference for store channel names | None - reference only |
| `components/layout/page-header.tsx` | Understand layout for filter toolbar positioning | None - reference only |
| `hooks/use-stale-steps.ts` | Stale detection pattern reference | None - reference only |
| `db/repositories/feature-requests.repository.ts` | Optionally add archived filtering | Could add filtered method, or use client-side |

### Low Priority (May Need Updates)

| File | Reason | Expected Changes |
|------|--------|------------------|
| `lib/queries/feature-requests.ts` | May update query keys if adding filtered queries | Potentially add filtered variant |
| `components/skeletons/feature-requests-skeleton.tsx` | Filter toolbar may affect loading state | Potentially add filter toolbar skeleton |
| `types/electron.ts` | Reference for ElectronAPI store types | None - reference only |
| `types/component-types.ts` | Reference for global component types | None - reference only |

## Architecture Insights Discovered

### Existing Patterns

1. **Client-side filtering**: Codebase uses client-side filtering with React state and useMemo
2. **URL state with nuqs**: Package installed (`nuqs@^2.8.6`) but no current usage - this will be first implementation
3. **Electron store pattern**: `useElectronStore` hook provides typed get/set/remove operations
4. **Debouncing pattern**: `useDebouncedCallback` hook with cancel, flush, isPending utilities
5. **Badge status variants**: All workflow status variants exist with appropriate color mappings
6. **Archive mutations exist**: `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` already implemented
7. **Stale detection pattern**: `useStaleSteps` hook parses staleSteps JSON field

### Integration Points

1. **Filter toolbar position**: Between PageHeader and feature requests list in FeaturesContent
2. **Archive button position**: In FeatureRequestCard alongside Edit and Delete buttons
3. **Stale indicator position**: In FeatureRequestCard near the status badge
4. **URL state persistence**: Using nuqs for status filter and search term
5. **Local storage persistence**: Using useElectronStore for showArchived toggle

### Key Exports/Components to Use

```typescript
// From components/ui/select.tsx
SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectPositioner, SelectPopup, SelectList, SelectItem

// From components/ui/
Input, Switch, Badge, badgeVariants

// From lucide-react
Search, Archive, ArchiveRestore, AlertTriangle

// From hooks/
useDebouncedCallback, useElectronStore

// From hooks/queries/use-feature-requests.ts
useArchiveFeatureRequest, useUnarchiveFeatureRequest

// From db/schema/feature-requests.schema.ts
FeatureRequestStatus
```

## File Path Validation

All discovered files validated to exist:
- ✅ `app/(app)/projects/[projectId]/features/page.tsx`
- ✅ `components/features/feature-request-card.tsx`
- ✅ `hooks/queries/use-feature-requests.ts`
- ✅ `app/(app)/projects/[projectId]/features/route-type.ts`
- ✅ `db/schema/feature-requests.schema.ts`
- ✅ `components/ui/select.tsx`
- ✅ `components/ui/input.tsx`
- ✅ `components/ui/switch.tsx`
- ✅ `components/ui/badge.tsx`
- ✅ `hooks/use-debounced-callback.ts`
- ✅ `hooks/useElectron.ts`
- ✅ `electron/ipc/store.handlers.ts`
- ✅ `electron/ipc/channels.ts`
- ✅ `components/layout/page-header.tsx`
- ✅ `hooks/use-stale-steps.ts`
- ✅ `db/repositories/feature-requests.repository.ts`
- ✅ `lib/queries/feature-requests.ts`
- ✅ `components/skeletons/feature-requests-skeleton.tsx`

## Discovery Statistics

- **Total Files Discovered**: 20
- **Files to Modify**: 4-6
- **Files to Reference**: 14-16
- **Coverage**: All major architectural layers covered (schema, repository, hooks, components, pages)
