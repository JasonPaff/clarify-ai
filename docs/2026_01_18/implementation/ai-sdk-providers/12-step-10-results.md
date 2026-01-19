# Step 10: Update API Key Form with Provider-Specific Fields

**Status**: SUCCESS

## Files Modified

1. `components/settings/api-key-form.tsx` - Major form update:
   - Added provider category grouping in select dropdown (Major, Emerging, Enterprise, Local)
   - Added conditional endpoint TextField for Azure and Ollama
   - Added conditional region SelectField with AWS regions for Bedrock
   - Added conditional accessKeyId and secretAccessKey TextFields for Bedrock
   - Added conditional deploymentName TextField for Azure
   - API key field hidden for Ollama (authType: 'none')
   - Added ProviderHelperText component with contextual guidance
   - Updated form submission to include extended credential fields
   - Used `useStore` from TanStack Form for reactive provider selection

2. `lib/validations/api-key.ts` - Schema update:
   - Updated schemas to use required string fields
   - Provider-specific validation handled by superRefine

## Validation Results

- pnpm lint: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Correct fields appear for each provider type
- [x] Ollama form works without API key input
- [x] Azure form includes endpoint and deployment name
- [x] Bedrock form includes AWS credentials and region
- [x] All validation commands pass

## Provider Authentication Types

| Auth Type | Providers                                                                   | Fields Shown                             |
| --------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| api_key   | anthropic, google, openai, mistral, cohere, xai, groq, deepseek, togetherai | API Key                                  |
| aws       | bedrock                                                                     | Access Key ID, Secret Access Key, Region |
| azure     | azure                                                                       | API Key, Endpoint, Deployment Name       |
| none      | ollama                                                                      | Endpoint (optional)                      |

## Notes

- Form supports all 12 providers with specific authentication requirements
- Test connection validates required fields based on auth type
- Provider select uses disabled headers as category separators
