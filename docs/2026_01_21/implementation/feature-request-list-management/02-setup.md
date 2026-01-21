# Implementation Setup

**Feature**: Phase 10 - Feature Request List & Management

## Routing Table

| Step | Title | Specialist Agent | Files |
|------|-------|------------------|-------|
| 1 | Add Stale Badge Variant | `frontend-component` | `components/ui/badge.tsx` |
| 2 | Extend Route Type for URL Query Params | `general-purpose` | `app/(app)/projects/[projectId]/features/route-type.ts` |
| 3 | Create Filter Toolbar Component | `frontend-component` | `components/features/feature-request-filter-toolbar.tsx` |
| 4 | Implement URL State with nuqs | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 5 | Add Debounced Search | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 6 | Add Archive Toggle Persistence | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 7 | Implement Client-Side Filtering Logic | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 8 | Codex Code Review (Quality Gate) | `codex-review` | N/A |
| 9 | Extend FeatureRequestCard with Archive Actions | `frontend-component` | `components/features/feature-request-card.tsx` |
| 10 | Add Visual Styling for Archived Items | `frontend-component` | `components/features/feature-request-card.tsx` |
| 11 | Add Stale Indicator to FeatureRequestCard | `frontend-component` | `components/features/feature-request-card.tsx` |
| 12 | Wire Archive Actions in Features Page | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 13 | Integrate Filter Toolbar into Features Page | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 14 | Update Empty State for Filtered Results | `general-purpose` | `app/(app)/projects/[projectId]/features/page.tsx` |
| 15 | Final Codex Code Review | `codex-review` | N/A |

## Step Detection Rules Applied

- Steps 1, 3, 9, 10, 11: `frontend-component` - UI component modifications
- Steps 2, 4, 5, 6, 7, 12, 13, 14: `general-purpose` - Page logic and routing
- Steps 8, 15: `codex-review` - Quality gates

## Files Summary

### Files to Create
- `components/features/feature-request-filter-toolbar.tsx`

### Files to Modify
- `components/ui/badge.tsx`
- `app/(app)/projects/[projectId]/features/route-type.ts`
- `app/(app)/projects/[projectId]/features/page.tsx`
- `components/features/feature-request-card.tsx`

---

**MILESTONE**: PHASE_2_COMPLETE
