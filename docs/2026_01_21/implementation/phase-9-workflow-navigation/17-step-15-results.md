# Step 15: Update DescribeStep to Use Centralized Stale Detection

**Status**: ✅ SUCCESS

## Files Modified
- `components/features/describe-step.tsx` - Replaced hardcoded step array with utility

## Implementation Details

### Import Added:
```typescript
import { getDownstreamSteps } from '@/lib/workflow/stale-detection';
```

### Stale Marking Logic Updated:
- Changed comment to "mark all downstream steps as stale"
- Replaced hardcoded `['refine']` with `getDownstreamSteps('describe')`
- Added safety check before mutation
- Now correctly returns `['refine', 'research', 'plan']`

### Before:
```typescript
steps: ['refine']
```

### After:
```typescript
const downstreamSteps = getDownstreamSteps('describe');
if (downstreamSteps.length > 0) {
  steps: [...downstreamSteps]
}
```

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] DescribeStep uses centralized stale detection utility
- [x] Hardcoded step arrays replaced with utility function calls
- [x] All validation commands pass
