# Step 11: Create TanStack Query Hooks for Repositories

**Status**: SUCCESS
**Specialist**: tanstack-query

## Files Created

- `hooks/queries/use-repositories.ts` - TanStack Query hooks for repository data fetching and mutations

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Hooks follow pattern from `use-projects.ts`
- [x] `useRepositories` accepts `projectId` parameter
- [x] All mutations invalidate relevant queries
- [x] `enabled` flag checks `isElectron`
- [x] All validation commands pass

## Query Hooks Created

- `useRepositories(projectId)` - Fetch repositories for a project
- `useRepository(id)` - Fetch single repository by ID

## Mutation Hooks Created

- `useCreateRepository()` - Create new repository with cache invalidation
- `useUpdateRepository()` - Update repository with optimistic cache update
- `useDeleteRepository()` - Delete repository with cache cleanup

## Cache Invalidation Strategy

- Create: Invalidates `byProject` queries
- Update: Sets detail cache directly, invalidates `byProject` queries
- Delete: Removes detail query, invalidates all repository queries
