# Step 1: Create Centralized Stale Detection Utility

**Status**: ✅ SUCCESS

## Files Created
- `lib/workflow/stale-detection.ts` - Centralized stale detection utility with step dependency graph

## Implementation Details
- Defined `StepId` type: `'describe' | 'refine' | 'research' | 'plan'`
- Created `STEP_DEPENDENCY_GRAPH` mapping each step to downstream dependencies
- Created `STEP_UPSTREAM_GRAPH` for reverse lookups
- Implemented functions:
  - `getDownstreamSteps(step)` - Returns steps to mark stale
  - `getUpstreamSteps(step)` - Returns steps that current step depends on
  - `shouldMarkStale(changedStep, targetStep)` - Check if specific step should be stale
  - `isValidStepId(value)` - Type guard for step validation
  - `getStepIndex(step)` - Get numeric index for ordering
  - `isStepBefore(a, b)` / `isStepAfter(a, b)` - Step ordering utilities

## Dependency Graph
```
describe → [refine, research, plan]
refine   → [research, plan]
research → [plan]
plan     → []
```

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] New file created at `lib/workflow/stale-detection.ts`
- [x] Step dependency graph correctly models dependencies
- [x] All exported functions properly typed
- [x] All validation commands pass
