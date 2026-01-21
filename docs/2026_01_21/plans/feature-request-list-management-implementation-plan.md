# Feature Request List & Management Implementation Plan

**Generated**: 2026-01-21
**Original Request**: Implement Phase 10: Feature Request List & Management from the feature request workflow implementation order
**Feature**: Phase 10 - Status Filter, Search, Archive Toggle, Archive Actions, Status Display

---

## Overview

**Estimated Duration**: 3-4 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

Enhance the features list page with comprehensive filtering, search, and archive capabilities. This includes adding a status filter dropdown, debounced search input, archive toggle with persistence, archive/unarchive actions on feature cards, and visual indicators for archived and stale feature requests. URL state management via nuqs enables shareable filter states.

## Prerequisites

- [ ] Verify nuqs package is installed (`pnpm install nuqs` if needed)
- [ ] Confirm existing archive mutations work (`useArchiveFeatureRequest`, `useUnarchiveFeatureRequest`)
- [ ] Verify electron-store handlers support get/set operations via `useElectronStore`

## Implementation Steps

### Step 1: Add Stale Badge Variant to Badge Component

**What**: Add a `stale` variant to the Badge component for visual stale indication
**Why**: Stale feature requests need a distinct visual indicator to alert users that steps may need to be re-run
**Confidence**: High

**Files to Modify:**
- `components/ui/badge.tsx` - Add stale variant with warning color styling

**Changes:**
- Add `stale` variant to `badgeVariants` with amber/warning color scheme (similar to `clarifying` variant pattern)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Badge component exports new `stale` variant
- [ ] Stale variant uses warning/amber colors for visibility
- [ ] All validation commands pass

---

### Step 2: Extend Route Type for URL Query Parameters

**What**: Add searchParams schema to the route-type.ts file for nuqs integration
**Why**: Enables type-safe URL state management for filter persistence and shareability
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/route-type.ts` - Add searchParams with status filter schema

**Changes:**
- Add `searchParams` object with `status` field using Zod enum for valid status values
- Add `search` field for search query string
- Export updated Route type

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Route type includes searchParams definition
- [ ] Status enum includes all workflow status values plus "all" option
- [ ] TypeScript correctly infers searchParams types
- [ ] All validation commands pass

---

### Step 3: Create Filter Toolbar Component

**What**: Create a reusable filter toolbar component for the features page
**Why**: Encapsulates filter UI logic and keeps the page component clean; provides responsive layout for search, status filter, and archive toggle
**Confidence**: High

**Files to Create:**
- `components/features/feature-request-filter-toolbar.tsx` - Filter toolbar with search, status select, and archive toggle

**Changes:**
- Create component with three filter controls in horizontal flex layout
- Implement search input with Search icon from lucide-react
- Implement status filter using Select components
- Implement archive toggle using Switch component with label
- Accept props for filter state and callbacks

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Filter toolbar renders search input with icon
- [ ] Status dropdown shows all workflow statuses plus "All" option
- [ ] Archive toggle with label displays correctly
- [ ] Responsive horizontal layout works on different screen sizes
- [ ] All validation commands pass

---

### Step 4: Implement URL State Management with nuqs in Features Page

**What**: Add nuqs hooks for status filter and search query URL state
**Why**: Persists filter state in URL for shareability and browser history support
**Confidence**: Medium

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add nuqs state hooks and filter logic

**Changes:**
- Import `useQueryState` and `parseAsStringLiteral` from nuqs
- Add `useQueryState` for status filter with valid status values
- Add `useQueryState` for search query string
- Pass filter state to FeaturesContent component

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Status filter syncs with URL query parameter `?status=`
- [ ] Search query syncs with URL query parameter `?search=`
- [ ] URL updates when filters change
- [ ] Page loads correctly with filter params from URL
- [ ] All validation commands pass

---

### Step 5: Add Debounced Search with useDebouncedCallback

**What**: Implement debounced search input to prevent excessive filtering during typing
**Why**: Improves performance by reducing re-renders and filtering operations while user types
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add debounced search state

**Changes:**
- Add local state for immediate input value
- Use `useDebouncedCallback` with 300ms delay to update URL state
- Connect local state to search input for instant feedback
- Update URL search param via debounced callback

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Search input updates immediately (no lag)
- [ ] URL updates after 300ms debounce delay
- [ ] Typing quickly only triggers one URL update
- [ ] All validation commands pass

---

### Step 6: Add Archive Toggle Persistence with Electron Store

**What**: Persist "Show archived" toggle preference using electron-store
**Why**: User preference for archive visibility should persist across sessions
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add archive toggle state with persistence

**Changes:**
- Use `useElectronStore` hook to get/set `showArchivedFeatures` preference
- Initialize state from stored value on mount
- Update stored value when toggle changes
- Default to `false` (hide archived) if no stored preference

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Archive toggle state persists across page navigations
- [ ] Archive toggle state persists across app restarts
- [ ] Default is false (hidden) for new users
- [ ] All validation commands pass

---

### Step 7: Implement Client-Side Filtering Logic

**What**: Add useMemo-based filtering of feature requests by status, search, and archive state
**Why**: Filters the feature request list based on active filter criteria; client-side since data is already loaded
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add filtering useMemo

**Changes:**
- Add `useMemo` hook to filter feature requests array
- Filter by status when not "all"
- Filter by search query matching title or description (case-insensitive)
- Filter out archived items unless showArchived is true
- Return filtered array for rendering

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Status filter correctly shows only matching statuses
- [ ] Search filter matches title and description
- [ ] Archive toggle shows/hides archived items
- [ ] Filters combine correctly (AND logic)
- [ ] All validation commands pass

---

### Step 8: Codex Code Review (Quality Gate)

**What**: Run Codex code review to validate filter toolbar and URL state implementation
**Why**: AI-powered code review (GPT 5.2) catches issues before they become problems
**Confidence**: High

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
- [ ] Code quality approved by GPT 5.2 review

---

### Step 9: Extend FeatureRequestCard with Archive Actions

**What**: Add Archive and Unarchive action buttons to the feature request card
**Why**: Users need to archive/unarchive feature requests directly from the list view
**Confidence**: High

**Files to Modify:**
- `components/features/feature-request-card.tsx` - Add archive/unarchive buttons and callbacks

**Changes:**
- Add `archivedAt` and `id` to component props
- Add `onArchive` and `onUnarchive` optional callback props
- Import `Archive` and `ArchiveRestore` icons from lucide-react
- Add conditional Archive or Unarchive IconButton based on archived state
- Implement click handlers with stopPropagation

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Archive button shows for non-archived items
- [ ] Unarchive button shows for archived items
- [ ] Click handlers prevent card navigation
- [ ] Icons are visually distinct and accessible
- [ ] All validation commands pass

---

### Step 10: Add Visual Styling for Archived Items

**What**: Apply muted visual styling to archived feature request cards
**Why**: Archived items should be visually distinct to indicate their inactive state
**Confidence**: High

**Files to Modify:**
- `components/features/feature-request-card.tsx` - Add archived state styling

**Changes:**
- Add `isArchived` computed boolean from `archivedAt` prop
- Apply `opacity-60` class to Card when archived
- Add subtle "Archived" Badge next to status badge
- Use `cn()` utility to conditionally apply classes

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Archived cards have reduced opacity
- [ ] "Archived" badge displays for archived items
- [ ] Visual distinction is clear but not overwhelming
- [ ] All validation commands pass

---

### Step 11: Add Stale Indicator to FeatureRequestCard

**What**: Display warning icon and stale badge for feature requests with stale steps
**Why**: Users need visibility into which feature requests have outdated workflow steps
**Confidence**: High

**Files to Modify:**
- `components/features/feature-request-card.tsx` - Add stale indicator

**Changes:**
- Add `staleSteps` to component props (JSON string or null)
- Parse staleSteps to check if any exist
- Import `AlertTriangle` icon from lucide-react
- Display warning icon with tooltip or stale Badge variant when steps are stale
- Position indicator near status badge

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Stale indicator shows when staleSteps has entries
- [ ] Stale indicator does not show for fresh items
- [ ] Warning icon/badge is visually noticeable
- [ ] All validation commands pass

---

### Step 12: Wire Archive Actions in Features Page

**What**: Connect archive/unarchive mutations to the FeatureRequestCard callbacks
**Why**: Completes the archive functionality by connecting UI to data layer
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add archive mutation handling

**Changes:**
- Import `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` hooks
- Add mutation handlers to FeaturesContent component
- Pass `archivedAt`, `staleSteps`, `onArchive`, and `onUnarchive` props to FeatureRequestCard
- Handle mutation errors appropriately

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Archive action updates database and UI
- [ ] Unarchive action updates database and UI
- [ ] TanStack Query cache invalidates correctly
- [ ] Archived items disappear from list (when toggle off)
- [ ] All validation commands pass

---

### Step 13: Integrate Filter Toolbar into Features Page

**What**: Add the filter toolbar between PageHeader and feature list
**Why**: Provides the user interface for all filtering capabilities
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add filter toolbar to layout

**Changes:**
- Import FeatureRequestFilterToolbar component
- Position toolbar between PageHeader and QueryErrorBoundary
- Connect filter state and callbacks to toolbar props
- Add appropriate spacing/margins

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Filter toolbar renders in correct position
- [ ] All filter controls are functional
- [ ] Layout is responsive and visually balanced
- [ ] All validation commands pass

---

### Step 14: Update Empty State for Filtered Results

**What**: Show appropriate empty state when filters yield no results
**Why**: Users need feedback when their filters exclude all items vs. having no items at all
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/page.tsx` - Add filtered empty state

**Changes:**
- Differentiate between "no feature requests exist" and "no results match filters"
- Show different EmptyState messages based on filter active state
- Include "Clear filters" action when filters are active
- Keep existing empty state for truly empty project

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] "No results" message shows when filters exclude all items
- [ ] "Clear filters" action resets filters
- [ ] Original empty state shows for empty project
- [ ] All validation commands pass

---

### Step 15: Final Codex Code Review (Quality Gate)

**What**: Run final Codex code review to validate complete implementation
**Why**: Ensures all code changes meet quality standards before completion
**Confidence**: High

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] All implementation steps are verified
- [ ] Code quality approved by GPT 5.2 review

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Intermediate Codex review passes (Step 8)
- [ ] Final Codex code review passes (Step 15)
- [ ] URL filter state persists on page refresh
- [ ] Archive toggle preference persists across sessions
- [ ] All filter combinations work correctly
- [ ] Archive/Unarchive mutations complete successfully

## Notes

1. **nuqs First Usage**: This is the first usage of nuqs in the codebase. The implementation should serve as a pattern for future URL state management needs.

2. **Client-Side Filtering**: Since `useFeatureRequests` already loads all feature requests for a project, client-side filtering is appropriate. If performance becomes an issue with large lists, consider server-side filtering in future iterations.

3. **Archive Toggle Persistence**: Uses electron-store rather than URL state because this is a user preference that should persist across projects, not a filter specific to the current view.

4. **Stale Steps Parsing**: The `staleSteps` field is stored as a JSON string. The parsing logic should handle malformed JSON gracefully, defaulting to empty array.

5. **Search Debouncing**: The 300ms delay balances responsiveness with performance. Adjust if user testing reveals issues.

6. **Badge Variants**: The Badge component already has all status variants. Only the `stale` variant needs to be added.

---

## File Discovery Summary

### Files to Create
| File | Purpose |
|------|---------|
| `components/features/feature-request-filter-toolbar.tsx` | Filter toolbar with search, status, archive controls |

### Files to Modify
| File | Changes |
|------|---------|
| `components/ui/badge.tsx` | Add `stale` variant |
| `app/(app)/projects/[projectId]/features/route-type.ts` | Add searchParams schema |
| `app/(app)/projects/[projectId]/features/page.tsx` | Add filter logic, archive actions, toolbar integration |
| `components/features/feature-request-card.tsx` | Add archive buttons, archived styling, stale indicator |

### Files to Reference
| File | Purpose |
|------|---------|
| `hooks/queries/use-feature-requests.ts` | Use existing archive mutations |
| `db/schema/feature-requests.schema.ts` | Reference for types and status values |
| `components/ui/select.tsx` | Status filter dropdown |
| `components/ui/input.tsx` | Search input |
| `components/ui/switch.tsx` | Archive toggle |
| `hooks/use-debounced-callback.ts` | Search debouncing |
| `hooks/useElectron.ts` | Store persistence |
| `hooks/use-stale-steps.ts` | Stale detection pattern |
