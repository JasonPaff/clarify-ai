# Step 6: Create Auto-Save Status Component

**Status**: ✅ SUCCESS

## Files Created
- `components/features/workflow/auto-save-status.tsx` - Standardized save status indicator

## Implementation Details

### Props:
- `isSaving: boolean` - Shows "Saving..." state
- `lastSavedAt: Date | null` - Shows relative time
- `hasUnsavedChanges?: boolean` - Shows "Not saved yet" state

### States Displayed:
1. `isSaving === true` → "Saving..."
2. `lastSavedAt !== null` → "Last saved X ago"
3. `hasUnsavedChanges === true && !lastSavedAt` → "Not saved yet"

### Styling:
- Uses `text-xs text-muted-foreground` for consistency
- Uses `formatDistanceToNow` from `date-fns` with `addSuffix: true`

### Usage Example:
```tsx
<AutoSaveStatus
  hasUnsavedChanges={isDirty}
  isSaving={updateMutation.isPending}
  lastSavedAt={lastSavedAt}
/>
```

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] Component created at `components/features/workflow/auto-save-status.tsx`
- [x] Displays "Saving..." when `isSaving` is true
- [x] Displays "Last saved X ago" when `lastSavedAt` is provided
- [x] Displays "Not saved yet" when no save has occurred
- [x] All validation commands pass
