# Step 16: Add AI Discovery Settings to Step Settings Panel

**Status**: ✅ SUCCESS
**Specialist**: frontend-component
**Completed**: 2026-01-22

## Changes Made

**Files Modified:**
- `components/features/workflow/step-settings-panel.tsx` - Added AI Discovery settings

**Added Imports:**
- `FolderSearch` icon
- `NumberInput` component

**Added Constants:**
- `DEFAULT_AI_DISCOVERY_MAX_FILES = 50`
- `DEFAULT_AI_DISCOVERY_TOKEN_BUDGET = 100000`

**Added State:**
- Local state and ref tracking for ignore patterns

**Added Handlers:**
- `handleAiDiscoveryMaxFilesChange` - persists max files value
- `handleAiDiscoveryTokenBudgetChange` - persists token budget value
- `handleAiDiscoveryIgnorePatternsBlur` - persists ignore patterns on blur

**Added UI:**
- Nested collapsible section for AI Discovery Settings (only for research step)
- Max Files number input (1-200, step 5, default 50)
- Token Budget number input (10k-500k, step 10k, default 100k)
- Additional Ignore Patterns textarea (one pattern per line)

## Validation Results

- pnpm lint:fix: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Settings section visible for research step
- [x] Changes persist via step configuration mutations
- [x] Default values applied when no configuration exists
- [x] All validation commands pass

## Notes

- Ignore patterns stored as plain text (one per line)
- Uses existing upsertMutation pattern for persistence
