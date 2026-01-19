# Step 2: Create Centralized Provider Factory

**Status**: SUCCESS

## Files Created

- `electron/ipc/lib/provider-factory.ts` - Centralized module for provider instantiation, API key retrieval, and model ID parsing

## Files Modified

- `electron/ipc/ai-clarification.handlers.ts` - Removed duplicated helper functions, now imports from provider-factory
- `electron/ipc/ai-overview.handlers.ts` - Removed duplicated helper functions, now imports from provider-factory

## Functions in provider-factory.ts

- `createProvider(provider, apiKey)` - Creates AI SDK provider instances with dynamic imports
- `getApiKey(provider)` - Retrieves API key from encrypted store or environment variable
- `parseModelId(fullModelId)` - Parses "provider:modelId" format into components

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Single `createProvider()` implementation used across all AI handlers
- [x] Single `getApiKey()` implementation for credential retrieval
- [x] Duplicated code removed from handler files
- [x] All validation commands pass

## Notes

- Factory currently supports 3 providers (anthropic, google, openai)
- Step 5 will add remaining 9 provider cases after dependencies installed
