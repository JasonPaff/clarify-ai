# Step 15 Results: Create Helper Hook for Stale Steps Management

**Status**: ✅ SUCCESS
**Specialist**: tanstack-query

## Files Created

| File | Purpose |
|------|---------|
| `hooks/use-stale-steps.ts` | Reusable hook for managing stale steps across workflow |

## Files Modified

| File | Changes |
|------|---------|
| `components/features/clarify-step.tsx` | Replaced inline stale logic with useStaleSteps hook |

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] Hook provides clean API for stale state management
- [x] isStale returns correct boolean for each step
- [x] markStale and clearStale update database
- [x] All validation commands pass

## Hook API

```typescript
const { isStale, markStale, clearStale, staleSteps, staleStepNames } = useStaleSteps(featureRequest);
```

- `isStale(step: string): boolean` - Check if step is stale
- `markStale(steps: string | string[]): Promise<void>` - Mark step(s) as stale
- `clearStale(steps: string | string[]): Promise<void>` - Remove from stale state
- `staleSteps: StaleStep[]` - Parsed array with timestamps
- `staleStepNames: string[]` - Just step names for easy iteration

## Notes

- Wraps existing useMarkStepsStale and useClearStepsStale mutations
- Ready for use in Research and Plan step components
