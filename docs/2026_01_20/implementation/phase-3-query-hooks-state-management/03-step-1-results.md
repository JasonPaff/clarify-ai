# Step 1 Results: Create Query Keys for Feature Request Runs

**Status**: ✅ SUCCESS

## Files Created

- `lib/queries/feature-request-runs.ts` - Query key factory for feature request run-related queries

## Files Modified

- `lib/queries/index.ts` - Added `featureRequestRunKeys` to merged query keys export

## Query Keys Created

| Key | Purpose | Parameters |
|-----|---------|------------|
| `featureRequestRunKeys.byFeatureRequest(featureRequestId)` | List all runs for a feature request | `featureRequestId: number` |
| `featureRequestRunKeys.byFeatureRequestAndStep(featureRequestId, step)` | List runs filtered by step | `featureRequestId: number, step: FeatureRequestRunStep` |
| `featureRequestRunKeys.currentRun(featureRequestId, step)` | Get the current run for a step | `featureRequestId: number, step: FeatureRequestRunStep` |
| `featureRequestRunKeys.detail(id)` | Get a single run by ID | `id: number` |
| `featureRequestRunKeys.latest(featureRequestId)` | Get the most recent run | `featureRequestId: number` |
| `featureRequestRunKeys.latestByStep(featureRequestId, step)` | Get the most recent run for a step | `featureRequestId: number, step: FeatureRequestRunStep` |

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] File exports `featureRequestRunKeys` with all defined key factories
- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
