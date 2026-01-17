# Step 5: Update Project Settings Page

**Agent**: general-purpose
**Status**: SUCCESS

## Files Modified

- `app/(app)/projects/[projectId]/settings/page.tsx` - Updated to integrate edit and delete dialogs:
  - Added `withParamValidation` HOC wrapper for type-safe route params
  - Used `use()` hook to await `routeParams` and extract `projectId`
  - Added `useProject(projectId)` hook to fetch current project data
  - Added loading state with centered spinner
  - Added error state for failed project fetch
  - Displayed actual project name/description in General card
  - Wrapped Edit button with `EditProjectDialog`
  - Wrapped Delete button with `DeleteProjectDialog`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Settings page fetches and displays project data
- [x] Edit button opens edit dialog with current project info
- [x] Delete button opens confirmation dialog
- [x] Loading and error states are handled appropriately
- [x] All validation commands pass

## Notes

The dialogs are now fully integrated and will use the mutations from `useUpdateProject` and `useDeleteProject` hooks to persist changes.
