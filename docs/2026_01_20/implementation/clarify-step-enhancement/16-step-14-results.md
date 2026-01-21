# Step 14 Results: Add StaleWarningBanner to Clarify Step

**Status**: ✅ SUCCESS
**Specialist**: frontend-component

## Files Modified

| File                                    | Changes                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `components/features/clarify-step.tsx`  | Added StaleWarningBanner with rerun/dismiss handlers, rerunKey state |
| `hooks/queries/use-feature-requests.ts` | Added useClearStepsStale mutation function                           |

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] Banner shows when clarification is stale
- [x] Re-run button starts new clarification
- [x] Dismiss removes stale state
- [x] Banner disappears after re-running
- [x] All validation commands pass

## Implementation Details

**ClarifyStep changes**:

- Added rerunKey state to force ClarificationPanel remount
- Added staleSteps memo parsing JSON from featureRequest
- Added isRefineStale computed value
- handleStaleRerun: clears stale state + increments rerunKey
- handleStaleDismiss: only clears stale state
- Added key={rerunKey} to ClarificationPanel for remount

**useClearStepsStale hook**:

- Removes specified steps from staleSteps array
- Sets staleSteps to null if no remaining stale steps
- Updates query cache on success
