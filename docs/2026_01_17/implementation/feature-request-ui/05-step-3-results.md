# Step 3: Create Feature Request Card Component

**Status**: SUCCESS
**Specialist**: frontend-component

## Files Created

- `components/features/feature-request-card.tsx` - Card component for displaying feature request info

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Card displays all feature request information correctly
- [x] Status badge shows appropriate color for each status
- [x] Edit and delete buttons trigger callback functions
- [x] All validation commands pass

## Implementation Details

- Props: title, description, status, createdAt, onClick, onEdit, onDelete
- Lightbulb icon in header
- Badge for status display
- Truncated description with line-clamp-2
- Date formatted with formatDistanceToNow
- Edit and delete IconButton actions
- Clickable card with hover state
