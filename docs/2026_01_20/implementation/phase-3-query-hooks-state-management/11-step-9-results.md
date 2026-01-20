# Step 9 Results: Update Feature Requests Hooks with Archive/Unarchive

**Status**: ✅ SUCCESS

## Files Modified

- `hooks/queries/use-feature-requests.ts` - Added archive/unarchive mutation hooks

## Mutation Hooks Added

| Hook | Purpose | Action |
|------|---------|--------|
| `useArchiveFeatureRequest()` | Archive a feature request | Sets `archivedAt` to ISO timestamp |
| `useUnarchiveFeatureRequest()` | Unarchive a feature request | Sets `archivedAt` to `null` |

## Cache Invalidation

Both mutations:
- Set detail query data via `queryClient.setQueryData`
- Invalidate list queries via `featureRequestKeys.byProject._def`

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] `useArchiveFeatureRequest` and `useUnarchiveFeatureRequest` hooks exported
- [x] Mutations properly set/clear `archivedAt` timestamp
- [x] Query cache invalidation works correctly
- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
