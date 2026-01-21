# Step 13 Results: Track Describe Step Content Changes for Stale Detection

**Status**: ✅ SUCCESS
**Specialist**: tanstack-query

## Files Modified

| File | Changes |
|------|---------|
| `hooks/queries/use-feature-requests.ts` | Added useMarkStepsStale mutation hook |
| `components/features/describe-step.tsx` | Integrated stale detection on save |

## Validation Results

- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria

- [x] Changing rawRequest after clarification marks 'refine' as stale
- [x] staleSteps field updated in database
- [x] Only triggers when clarification was previously completed
- [x] All validation commands pass

## useMarkStepsStale Hook

- Accepts featureRequestId and steps array
- Parses existing staleSteps JSON text field
- Merges new steps with timestamps (avoids duplicates)
- Updates feature request with merged stale steps
- Invalidates relevant query caches on success

## Stale Data Format

```json
[{ "step": "refine", "staleAt": "2026-01-20T12:34:56.789Z" }]
```

## Notes

- Timestamps allow UI to display when step became stale
- WorkflowSteps component already accepts staleSteps prop for display
