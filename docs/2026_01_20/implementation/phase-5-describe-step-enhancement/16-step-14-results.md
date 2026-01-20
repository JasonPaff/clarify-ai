# Step 14: Update Validation Schema

**Timestamp**: 2026-01-20
**Specialist**: tanstack-form
**Status**: SUCCESS

## Changes Made

### Files Modified

1. **lib/validations/feature-request.ts**
   - Added describeStepFormSchema with rawRequest + repositoryIds fields
   - Exported DescribeStepFormValues type
   - Marked entryStepFormSchema as deprecated

2. **lib/validations/feature-request-repositories.ts**
   - Removed old describeStepFormSchema (repository-only)
   - Added repositorySelectionFormSchema for repository-only components

3. **components/features/describe-step.tsx**
   - Updated import to use repositorySelectionFormSchema

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] describeStepFormSchema is exported and validates correctly
- [x] DescribeStepFormValues type is exported
- [x] Schema can be used with TanStack Form validators
- [x] All validation commands pass

## Notes

- describeStepFormSchema in feature-request.ts combines rawRequest + repositoryIds
- Current component uses repositorySelectionFormSchema for backwards compatibility
- Comprehensive schema ready for future unified form refactor
