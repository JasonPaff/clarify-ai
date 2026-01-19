# Steps 11-12 Results: Query Key Factory and Query Hooks

## Status: SUCCESS

## Files Created

- `lib/queries/feature-request-repositories.ts` - Query key factory
- `hooks/queries/use-feature-request-repositories.ts` - Query and mutation hooks

## Files Modified

- `lib/queries/index.ts` - Added import and merged query keys

## Query Hooks Created

- `useFeatureRequestRepositories(featureRequestId: number)` - Returns `Array<number>` of repository IDs

## Mutation Hooks Created

- `useSetFeatureRequestRepositories()` - Replace all repository associations
- `useAddFeatureRequestRepository()` - Add a single repository
- `useRemoveFeatureRequestRepository()` - Remove a single repository

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS
