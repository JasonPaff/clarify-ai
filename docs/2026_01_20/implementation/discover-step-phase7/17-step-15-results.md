# Step 15: Integrate Discover Step into Feature Page

**Status**: ✅ Success
**Specialist**: general-purpose

## Files Modified

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Replaced ResearchStep with DiscoverStep

## Validation Results

- pnpm lint:fix: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] DiscoverStep renders in discover workflow position
- [x] Props passed correctly from page component
- [x] Navigation between steps works
- [x] All validation commands pass

## Changes Made

- Updated import from ResearchStep to DiscoverStep
- Changed props from `featureRequestId={featureId}` to `featureRequest={featureRequest}`
- Ensured projectId prop is passed correctly
