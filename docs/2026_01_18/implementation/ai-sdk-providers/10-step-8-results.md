# Step 8: Update Zod Validation Schema

**Status**: SUCCESS

## Files Modified

- `lib/validations/api-key.ts` - Extended Zod validation schema to support all 12 providers with provider-specific validation

## Schema Summary

**Legacy Schemas** (backward compatible):
- `createApiKeySchema` - 3 major providers only
- `updateApiKeySchema` - Basic update

**Extended Schemas** (new multi-provider form):
- `createExtendedApiKeySchema` - All 12 providers with conditional validation
- `updateExtendedApiKeySchema` - Extended update with all credential fields

**New Type Exports**:
- `CreateExtendedApiKeyFormValues`
- `UpdateExtendedApiKeyFormValues`
- `allApiProvidersTuple` - Const tuple for form select options

## Extended Fields

```typescript
{
  accessKeyId?: string;      // For AWS Bedrock
  apiKey: string;            // Standard API key
  deploymentName?: string;   // For Azure OpenAI
  endpoint?: string;         // For Azure, Ollama
  notes: string;             // User notes
  provider: ApiKeyProvider;  // All 12 providers
  region?: string;           // For AWS Bedrock
  secretAccessKey?: string;  // For AWS Bedrock
}
```

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All 12 providers valid in form submission
- [x] Provider-specific fields validated appropriately
- [x] Ollama allows empty API key with required endpoint
- [x] All validation commands pass

## Notes

- Form components will need to use extended schemas in Step 10
- Provider-specific field rendering based on `authType`
