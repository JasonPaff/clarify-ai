# Step 16 Results: Update WorkflowSteps to Display Stale Indicators

**Status**: ✅ SUCCESS
**Specialist**: frontend-component

## Files Modified

| File | Changes |
|------|---------|
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Added useStaleSteps hook, passed staleStepNames to WorkflowSteps |

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] Workflow step indicators show amber warning for stale steps
- [x] Tooltip explains step is outdated
- [x] Indicator updates when stale state changes
- [x] All validation commands pass

## Implementation Details

Used existing `useStaleSteps` hook to:
1. Parse JSON staleSteps from feature request
2. Extract step names into staleStepNames array
3. Pass to WorkflowSteps component

WorkflowSteps already implemented stale display:
- Amber border on step circle
- Warning icon badge in top-right
- Amber text color for step title
- Tooltip on hover explaining outdated state

## Notes

Stale indicators now connected end-to-end. Upstream changes can mark downstream steps as stale, and indicators appear immediately in workflow navigation.
