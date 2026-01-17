# Step 8: Create Query Key Factory for Repositories

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Created

- `lib/queries/repositories.ts` - Query key factory for repositories

## Files Modified

- `lib/queries/index.ts` - Merged repository keys into main queries export

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Query keys follow pattern from `projects.ts`
- [x] `list` key accepts `projectId` parameter for project-scoped queries
- [x] Keys merged into main `queries` export
- [x] All validation commands pass

## Query Keys Added

- `repositoryKeys.byProject(projectId)` - For fetching repositories by project
- `repositoryKeys.detail(id)` - For fetching individual repository

## Cache Invalidation Keys

- `repositoryKeys._def` - Invalidate all repository queries
- `repositoryKeys.byProject._def` - Invalidate all project-filtered queries
