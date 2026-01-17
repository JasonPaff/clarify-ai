# Step 4: Create Delete Project Confirmation Dialog

**Agent**: general-purpose
**Status**: SUCCESS

## Files Created

- `components/projects/delete-project-dialog.tsx` - Confirmation dialog for deleting projects using Base UI AlertDialog

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] AlertDialog opens when trigger is clicked - Uses `AlertDialog.Trigger` with controlled state
- [x] Confirmation message displays project name - Description includes `{project.name}` with emphasis styling
- [x] Cancel button closes dialog without action - Uses `AlertDialog.Close` component
- [x] Delete button triggers mutation and navigates away on success - Calls `deleteProject.mutateAsync()` then navigates to `/projects`
- [x] All validation commands pass

## Notes

- Delete button includes loading state ("Deleting...") and is disabled while mutation is pending
- Warning text about cascading deletion styled with `text-destructive`
- Uses `children` render prop pattern for flexible trigger elements
