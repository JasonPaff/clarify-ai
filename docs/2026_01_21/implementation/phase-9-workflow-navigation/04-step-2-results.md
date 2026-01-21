# Step 2: Create Step Validation Utility

**Status**: ✅ SUCCESS

## Files Created
- `lib/workflow/step-validation.ts` - Step validation utility with soft warnings

## Implementation Details

### Types Defined:
- `ValidationSeverity`: `'caution' | 'info' | 'warning'`
- `ValidationWarningType`: Eight categories of warnings
- `ValidationWarning`: Interface with `message`, `severity`, and `type` fields
- `ValidationContext`: Interface containing `featureRequest`, optional repos and context files

### Validation Functions:
1. `validateDescribeStep(context)` - Checks description and repository links
2. `validateClarifyStep(context)` - Checks questions and answers
3. `validateDiscoverStep(context)` - Checks research findings and context files
4. `validatePlanStep(context)` - Checks all prerequisite steps and stale data

### Helper Functions:
- `getStepWarnings(step, context)` - Main entry point for aggregating warnings
- `hasCautionWarnings(warnings)` - Checks for caution severity
- `filterWarningsBySeverity(warnings, severity)` - Filter by severity
- `filterWarningsByType(warnings, type)` - Filter by type

## Validation Results
- ✅ pnpm lint: PASS
- ✅ pnpm typecheck: PASS

## Success Criteria
- [x] New file created at `lib/workflow/step-validation.ts`
- [x] Each validation function returns an array of `ValidationWarning` objects
- [x] Validation is soft (returns warnings, not errors)
- [x] All validation commands pass
