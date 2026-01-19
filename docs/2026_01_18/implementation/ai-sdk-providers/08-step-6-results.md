# Step 6: Implement API Key Test Functions for New Providers

**Status**: SUCCESS

## Files Modified

1. `electron/ipc/api-keys.handlers.ts` - Added 9 new test functions, updated test handler to accept `ProviderCredentials`

2. `electron/preload.ts` - Updated `test` method signature

3. `types/electron.d.ts` - Updated `test` method signature to match preload

4. `hooks/useElectron.ts` - Updated `test` callback signature

5. `hooks/queries/use-api-keys.ts` - Updated `useTestApiKey` mutation to use credentials

## Test Functions Added

| Function                   | Provider   | Description                           |
| -------------------------- | ---------- | ------------------------------------- |
| `testMistralKey()`         | mistral    | Standard API key test                 |
| `testCohereKey()`          | cohere     | Tests using `command-r` model         |
| `testBedrockCredentials()` | bedrock    | AWS auth with credentials             |
| `testAzureKey()`           | azure      | Validates endpoint and tests          |
| `testXaiKey()`             | xai        | Standard API key test                 |
| `testGroqKey()`            | groq       | Standard API key test                 |
| `testDeepSeekKey()`        | deepseek   | Official SDK test                     |
| `testTogetherAiKey()`      | togetherai | Official SDK test                     |
| `testOllamaConnection()`   | ollama     | Endpoint connectivity via `/api/tags` |

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] All providers have working test functions
- [x] Ollama test verifies endpoint connectivity without API key
- [x] Error messages are provider-appropriate
- [x] All validation commands pass

## Notes

- Handler signature changed from `test(provider, apiKey?)` to `test(provider, credentials?)`
- UI components will need to pass credentials object instead of just apiKey
