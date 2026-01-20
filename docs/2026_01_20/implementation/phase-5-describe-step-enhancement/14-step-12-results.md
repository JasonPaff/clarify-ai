# Step 12: Integrate Token Warning

**Timestamp**: 2026-01-20
**Specialist**: frontend-component
**Status**: SUCCESS

## Changes Made

### Files Modified

1. **components/features/describe-step.tsx**
   - Imported TokenEstimationWarning component
   - Added useContextFiles hook for context file data
   - Integrated TokenEstimationWarning below ContextFilePicker
   - Passes contextFiles, repositoryOverviewTokens, modelContextLimit

2. **hooks/queries/use-repository-overviews.ts**
   - Added new useRepositoryOverviewTokens hook
   - Calculates token estimates from repository overview content
   - Uses chars/4 heuristic for estimation
   - Shares query cache with useRepositoryOverviewStatuses

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Token warning displays below context file picker
- [x] Token count updates when files are added/removed
- [x] Warning reflects repository overview token estimates
- [x] All validation commands pass

## Notes

- Model context limit set to 200,000 (Claude 3.5 Sonnet)
- Prioritizes AI-generated content over manual edits for token calculation
