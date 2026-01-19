# Step 1: Create Centralized Provider Type Definitions

**Status**: SUCCESS

## Files Created

- `electron/ipc/lib/provider-types.ts` - Single source of truth for all provider-related types, constants, and utility functions

## Files Modified

- `electron/ipc/api-keys.handlers.ts` - Imports from centralized module, re-exports `ApiKeyProvider`, uses `getMajorProviders()` and `getProviderEnvVar()`
- `electron/ipc/ai-clarification.handlers.ts` - Imports `ApiKeyProvider` and `getProviderEnvVar` from centralized module
- `electron/ipc/ai-overview.handlers.ts` - Imports `ApiKeyProvider` and `getProviderEnvVar` from centralized module
- `lib/validations/api-key.ts` - Imports from centralized module, exports `MajorProvider` for form validation
- `lib/ai/models.ts` - Imports from centralized module, uses `PROVIDER_DISPLAY_NAMES`, changed `AI_MODELS` to `Partial<Record<...>>`
- `lib/queries/api-keys.ts` - Imports from centralized module, exports both `ApiKeyProvider` and legacy `AiProvider` alias
- `types/electron.d.ts` - Re-exports all types and constants from the centralized module
- `components/settings/api-key-form.tsx` - Uses `MajorProvider` for form type safety
- `components/settings/api-key-table.tsx` - Uses `PROVIDER_DISPLAY_NAMES` from centralized module
- `components/settings/api-key-dialog.tsx` - Uses `MajorProvider` type assertion
- `components/settings/delete-api-key-dialog.tsx` - Uses `PROVIDER_DISPLAY_NAMES` from centralized module
- `components/features/clarification/model-selector.tsx` - Added null check for `modelsByProvider[provider]`
- `hooks/use-available-models.ts` - Changed `modelsByProvider` to `Partial<Record<...>>`

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All provider types defined in single location
- [x] No duplicate `ApiKeyProvider` definitions remain in codebase
- [x] All validation commands pass

## Notes

- Centralized module defines all 12 providers
- Current UI continues to work with 3 major providers via `getMajorProviders()` and `MajorProvider` type
- `PROVIDER_CONFIGS` provides authentication requirements for future provider-specific configuration
