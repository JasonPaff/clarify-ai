# Step 5: Create Leave Warning Hook

**Status**: ✅ SUCCESS

## Files Created
- `hooks/use-leave-warning.ts` - Hook for navigation blocking during AI operations

## Implementation Details

### Hook API:
- `requestNavigation()` - Returns `true` if can proceed, `false` if blocked
- `proceedNavigation()` - Called when user confirms leaving (cancels AI operation)
- `dismissWarning()` - Called when user cancels navigation attempt
- `showWarning` - Boolean for rendering warning dialog

### Features:
- `beforeunload` event handling when `isActive` is true
- Automatic cleanup on unmount or when `isActive` becomes false
- Automatic state reset when AI operation completes
- Ref pattern to avoid stale closures

### Integration:
```typescript
const { showWarning, requestNavigation, proceedNavigation, dismissWarning } =
  useLeaveWarning({ isActive, stepName, onCancel });

// Before navigating:
if (!requestNavigation()) {
  // Navigation blocked, showWarning will be true
  return;
}
// Proceed with navigation
```

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] Hook created at `hooks/use-leave-warning.ts`
- [x] Correctly sets up `beforeunload` event listener
- [x] Provides API for blocking and allowing navigation
- [x] All validation commands pass
