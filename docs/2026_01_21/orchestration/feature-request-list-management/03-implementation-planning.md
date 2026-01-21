# Step 3: Implementation Planning

**Start Time**: 2026-01-21T00:03:00Z
**End Time**: 2026-01-21T00:04:00Z
**Duration**: ~60 seconds
**Status**: Completed

## Inputs

### Refined Request
Implement Phase 10 Feature Request List and Management by enhancing the features list page at `app/(app)/projects/[projectId]/features/page.tsx` with comprehensive filtering, search, and archive capabilities. Add a status filter dropdown using the existing `Select` component from `@base-ui/react` (`components/ui/select.tsx`) that filters feature requests by their workflow status values (draft, describing, clarifying, researching, planning, completed, failed), with filter state managed via URL query parameters using `nuqs` for persistence and shareability. Implement a search input using the existing `Input` component (`components/ui/input.tsx`) with Search icon from `lucide-react` that filters the list by title and description, applying debouncing (300-400ms) via a custom hook or `useDeferredValue` to prevent excessive re-renders during typing. Add a "Show archived" toggle using the existing `Switch` component (`components/ui/switch.tsx`) that controls visibility of archived items, persisting this preference via the `electron-store` handlers in `electron/ipc/store.handlers.ts` through the existing IPC channels. Extend the `FeatureRequestCard` component (`components/features/feature-request-card.tsx`) to include Archive and Unarchive actions alongside the existing Edit and Delete buttons, utilizing the `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` mutations already implemented in `hooks/queries/use-feature-requests.ts`. Apply visual distinction to archived items through reduced opacity, muted styling, or a subtle badge indicator. Update the feature request repository's `getByProjectId` method in `db/repositories/feature-requests.repository.ts` to optionally filter by archived state, or implement client-side filtering since the `archivedAt` field already exists with an index. Enhance the status badges on `FeatureRequestCard` to use the existing `Badge` component variants (`components/ui/badge.tsx`) which already have appropriate color mappings for all workflow statuses, and add visual indicators for stale feature requests by checking the `staleSteps` field and displaying a warning icon or stale badge variant. The filter toolbar should be positioned between the `PageHeader` and the feature request list, containing the search input, status filter select, and archive toggle in a responsive horizontal layout.

### File Discovery Analysis
- 20 files discovered across all architectural layers
- 4-6 files to modify (Critical priority)
- 14-16 files to reference (High/Medium/Low priority)
- Key patterns identified: client-side filtering, nuqs for URL state, useElectronStore for persistence

## Complete Agent Prompt Sent

```
Generate an implementation plan in MARKDOWN format (NOT XML) following your defined template with these sections: ## Overview (with Estimated Duration, Complexity, Risk Level), ## Quick Summary, ## Prerequisites, ## Implementation Steps (each step with What/Why/Confidence/Files/Changes/Validation Commands/Success Criteria), ## Quality Gates, ## Notes.

IMPORTANT: Include 'pnpm run lint:fix && pnpm run typecheck' validation for every step touching JS/JSX/TS/TSX files. Do NOT include code examples.

CRITICAL: Include Codex code review quality gate steps using '/codex-review' at logical checkpoints in the plan (e.g., after completing a major component, after database schema changes, after API endpoint implementation) AND always as the final quality gate step at the end of the plan. The Codex review uses GPT 5.2 to review code changes.

[Full refined feature request and file discovery analysis provided]
```

## Plan Validation Results

### Format Check
- ✅ Markdown format (not XML)
- ✅ All required sections present
- ✅ No code examples included

### Template Compliance
- ✅ Overview section with Duration, Complexity, Risk Level
- ✅ Quick Summary section
- ✅ Prerequisites section with checklist
- ✅ Implementation Steps with What/Why/Confidence/Files/Changes/Validation/Success Criteria
- ✅ Quality Gates section
- ✅ Notes section

### Validation Commands Check
- ✅ All TypeScript file changes include `pnpm run lint:fix && pnpm run typecheck`

### Codex Review Gates Check
- ✅ Intermediate Codex review at Step 8 (after filter toolbar and URL state)
- ✅ Final Codex review at Step 15 (end of implementation)

### Completeness Check
- ✅ Status filter implementation (Steps 2, 3, 4, 7)
- ✅ Search implementation (Steps 3, 4, 5, 7)
- ✅ Archive toggle implementation (Steps 3, 6, 7)
- ✅ Archive actions implementation (Steps 9, 12)
- ✅ Status display/stale indicator (Steps 1, 10, 11)
- ✅ All 5 sub-features addressed

## Plan Statistics

- **Total Steps**: 15
- **Codex Review Gates**: 2 (Step 8, Step 15)
- **Files to Create**: 1 (filter toolbar component)
- **Files to Modify**: 4 (badge, route-type, features page, feature-request-card)
- **Estimated Duration**: 3-4 hours
- **Complexity**: Medium
- **Risk Level**: Low
