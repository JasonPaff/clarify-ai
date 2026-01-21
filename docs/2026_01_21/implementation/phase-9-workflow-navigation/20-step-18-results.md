# Step 18: Update useStaleSteps Hook

**Status**: ✅ SUCCESS

## Files Modified
- `hooks/use-stale-steps.ts` - Added `markDownstreamStale` function

## Implementation Details

### Import Added:
- `getDownstreamSteps` and `StepId` from `@/lib/workflow/stale-detection`
- Re-exported `StepId` type for consumer convenience

### New Function:
```typescript
markDownstreamStale(step: StepId): void
```
- Uses `getDownstreamSteps()` to get all downstream dependencies
- Early returns if no downstream steps exist (e.g., for 'plan' step)
- Marks all downstream steps as stale in a single mutation

### Two APIs Now Available:
1. `markStale(steps)` - Direct control over specific steps (unchanged)
2. `markDownstreamStale(step)` - Automatic dependency-based marking

### Documentation:
- Added comprehensive JSDoc for both functions
- Updated hook's main JSDoc with usage examples

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] useStaleSteps hook has new `markDownstreamStale` function
- [x] Existing `markStale` function remains unchanged
- [x] All validation commands pass
