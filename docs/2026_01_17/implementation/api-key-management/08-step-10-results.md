# Step 10: Create TanStack Query Hooks for API Keys

**Status**: ✅ Success

## Files Created

- `hooks/queries/use-api-keys.ts` - TanStack Query hooks for API key management

## Hooks Created

**Query Hooks**:
| Hook | Purpose |
|------|---------|
| `useApiKey(provider)` | Fetch a specific provider's API key info |
| `useApiKeys()` | Fetch all configured API keys |
| `useEncryptionAvailable()` | Check if system encryption is available |

**Mutation Hooks**:
| Hook | Purpose | Cache Invalidation |
|------|---------|-------------------|
| `useSetApiKey()` | Set/update an API key | detail + list queries |
| `useDeleteApiKey()` | Delete an API key | detail + list queries |
| `useTestApiKey()` | Test an API key connection | None (read-only) |

## Validation Results

- pnpm lint: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Hooks follow existing TanStack Query patterns
- [x] Mutations properly invalidate relevant queries
- [x] All validation commands pass
