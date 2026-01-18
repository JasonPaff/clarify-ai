# Step 9: Create Query Key Factory for API Keys

**Status**: ✅ Success

## Files Created

- `lib/queries/api-keys.ts` - Query key factory for API keys

## Files Modified

- `lib/queries/index.ts` - Added `apiKeyKeys` to merged query keys export

## Query Keys Defined

| Key | Purpose |
|-----|---------|
| `list` | All API keys query |
| `detail(provider)` | Single provider key lookup |
| `encryptionAvailable` | Encryption status query |

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Query keys follow existing pattern
- [x] Keys properly differentiate list and detail queries
- [x] All validation commands pass
