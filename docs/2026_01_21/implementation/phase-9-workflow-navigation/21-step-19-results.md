# Step 19: Add BeforeUnload Handler to Feature Workflow Page

**Status**: ✅ SUCCESS

## Files Modified
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Added useLeaveWarning integration

## Implementation Details

### Import Added:
```typescript
import { useLeaveWarning } from '@/hooks/use-leave-warning';
```

### Hook Configuration:
```typescript
useLeaveWarning({
  isActive: isAnyAiOperationRunning,
  onCancel: handleCancelAiOperation,
  stepName: activeOperationStepName ?? 'current',
});
```

### How It Works:
- When `isActive` is `true` (AI operation running), registers `beforeunload` handler
- Handler triggers browser's native confirmation dialog on window close
- Automatically cleaned up when `isActive` becomes `false` or component unmounts

### Integration Points:
- `isAnyAiOperationRunning` - From workflow context
- `handleCancelAiOperation` - Existing cancel callback
- `activeOperationStepName` - Human-readable step name

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] BeforeUnload handler prevents window closure during AI operations
- [x] Handler is cleaned up when AI operations complete
- [x] All validation commands pass
