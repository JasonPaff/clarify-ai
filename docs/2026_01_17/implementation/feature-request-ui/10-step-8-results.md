# Step 8: Create Delete Feature Request Dialog Component

**Status**: SUCCESS
**Specialist**: frontend-component

## Files Created

- `components/features/delete-feature-request-dialog.tsx` - Confirmation dialog for deletion

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Dialog requires typing feature title to enable delete button
- [x] Delete button triggers mutation and closes dialog
- [x] Cancel clears confirmation input and closes dialog
- [x] All validation commands pass

## Implementation Details

- Uses `@base-ui/react/alert-dialog` primitives
- Type-to-confirm input pattern
- Supports controlled and uncontrolled modes
- Integrates `useDeleteFeatureRequest` mutation hook
- Warning message about permanent deletion
- Delete button disabled until title is correctly typed
