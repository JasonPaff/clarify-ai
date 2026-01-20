# Step 1: Update Step Configuration Schema

**Timestamp**: 2026-01-20
**Specialist**: database-schema
**Status**: SUCCESS

## Changes Made

### Files Modified

1. **db/schema/step-configurations.schema.ts**
   - Added 'describe' to StepConfigurationStep type union
   - Updated JSDoc documentation

2. **db/schema/feature-request-runs.schema.ts**
   - Added 'describe' to FeatureRequestRunStep type union
   - Updated JSDoc documentation

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] StepConfigurationStep type includes 'describe' option
- [x] FeatureRequestRunStep type includes 'describe' option
- [x] TypeScript compilation succeeds with no errors
- [x] All validation commands pass

## Notes

- No database migration required (TypeScript-only type changes)
- Type union values sorted alphabetically per conventions
