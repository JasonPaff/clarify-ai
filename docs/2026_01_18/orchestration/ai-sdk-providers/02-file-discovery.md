# Step 2: AI-Powered File Discovery

**Step**: 2 - File Discovery
**Status**: Completed
**Started**: 2026-01-18T00:02:00Z
**Completed**: 2026-01-18T00:03:00Z
**Duration**: ~60 seconds

## Input

### Refined Feature Request

Expand the AI provider ecosystem to support a comprehensive range of popular providers beyond the current Anthropic, Google, and OpenAI integrations, leveraging the Vercel AI SDK's modular package architecture to add 8-10 new provider integrations across three categories...

## Discovery Summary

- **Directories Explored**: 8 key directories
- **Files Examined**: 32 candidate files
- **Relevant Files Found**: 22 requiring modification
- **Reference Files**: 8 supporting patterns

## Files by Priority

### Critical Priority (Must Modify)

| File                                        | Purpose                                                        | Category    |
| ------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `electron/ipc/api-keys.handlers.ts`         | API key management, `ApiKeyProvider` type, encryption, testing | Backend/IPC |
| `electron/ipc/ai-clarification.handlers.ts` | AI clarification with `createProvider()` function              | Backend/IPC |
| `electron/ipc/ai-overview.handlers.ts`      | AI overview with duplicate `createProvider()`                  | Backend/IPC |
| `types/electron.d.ts`                       | Global type definitions for renderer                           | Types       |
| `lib/validations/api-key.ts`                | Zod validation with hardcoded provider enum                    | Types       |
| `lib/ai/models.ts`                          | Model definitions per provider                                 | Types       |
| `components/settings/api-key-form.tsx`      | Form with provider-specific fields needed                      | Frontend    |

### High Priority (Should Modify)

| File                                                   | Purpose                                  | Category    |
| ------------------------------------------------------ | ---------------------------------------- | ----------- |
| `electron/preload.ts`                                  | Context bridge API exposure              | Backend/IPC |
| `lib/queries/api-keys.ts`                              | Query key factory with `AiProvider` type | Queries     |
| `components/settings/api-keys-section.tsx`             | Main API keys settings section           | Frontend    |
| `components/settings/api-key-table.tsx`                | Table with `getProviderDisplayName()`    | Frontend    |
| `components/features/clarification/model-selector.tsx` | Model dropdown by provider               | Frontend    |
| `components/ui/badge.tsx`                              | Provider-specific badge variants         | Frontend    |
| `hooks/queries/use-api-keys.ts`                        | TanStack Query hooks for API keys        | Queries     |
| `hooks/use-available-models.ts`                        | Available models filtering               | Queries     |
| `hooks/useElectron.ts`                                 | Electron API hooks                       | Queries     |
| `package.json`                                         | New provider package dependencies        | Config      |

### Medium Priority

| File                                     | Purpose                 | Category    |
| ---------------------------------------- | ----------------------- | ----------- |
| `electron/ipc/channels.ts`               | IPC channel definitions | Backend/IPC |
| `components/settings/api-key-dialog.tsx` | Dialog wrapper          | Frontend    |
| `app/(app)/settings/page.tsx`            | Settings page layout    | Frontend    |

### Low Priority

| File                                            | Purpose              | Category    |
| ----------------------------------------------- | -------------------- | ----------- |
| `electron/ipc/register-handlers.ts`             | Handler registration | Backend/IPC |
| `components/settings/delete-api-key-dialog.tsx` | Delete confirmation  | Frontend    |

## Architecture Insights

### Provider Type Duplication Issue

The `ApiKeyProvider` type is defined in **multiple locations**:

1. `electron/ipc/api-keys.handlers.ts` (source of truth)
2. `electron/ipc/ai-clarification.handlers.ts` (duplicate)
3. `electron/ipc/ai-overview.handlers.ts` (duplicate)
4. `lib/queries/api-keys.ts` (as `AiProvider`)
5. `lib/validations/api-key.ts` (as Zod enum)

**Recommendation**: Consolidate to single source of truth.

### Environment Variable Mapping Duplication

`PROVIDER_ENV_VARS` is duplicated across:

- `electron/ipc/api-keys.handlers.ts`
- `electron/ipc/ai-clarification.handlers.ts`
- `electron/ipc/ai-overview.handlers.ts`

**Recommendation**: Extract to shared utility.

### Provider Factory Pattern

The `createProvider()` function uses switch statements. This should be refactored to a registry pattern for extensibility.

### Model Registry

`lib/ai/models.ts` is the central configuration mapping providers to models with names, IDs, and capabilities.

### CVA Badge Variants

Provider styling uses class-variance-authority variants - needs new variants for added providers.

## New Packages Required

```json
{
  "@ai-sdk/mistral": "^x.x.x",
  "@ai-sdk/cohere": "^x.x.x",
  "@ai-sdk/amazon-bedrock": "^x.x.x",
  "@ai-sdk/azure": "^x.x.x",
  "@ai-sdk/xai": "^x.x.x",
  "@ai-sdk/groq": "^x.x.x",
  "@ai-sdk/deepseek": "^x.x.x",
  "@ai-sdk/togetherai": "^x.x.x",
  "ollama-ai-provider": "^x.x.x"
}
```

## Provider-Specific Requirements

| Provider       | API Key   | Endpoint URL    | Region | Deployment Name |
| -------------- | --------- | --------------- | ------ | --------------- |
| Mistral        | Yes       | No              | No     | No              |
| Cohere         | Yes       | No              | No     | No              |
| Amazon Bedrock | AWS Creds | No              | Yes    | No              |
| Azure OpenAI   | Yes       | Yes             | No     | Yes             |
| xAI            | Yes       | No              | No     | No              |
| Groq           | Yes       | No              | No     | No              |
| DeepSeek       | Yes       | No              | No     | No              |
| Together AI    | Yes       | No              | No     | No              |
| Ollama         | No        | Yes (localhost) | No     | No              |

## File Validation

All discovered file paths verified to exist in the codebase.

## Milestone

`MILESTONE:STEP_2_COMPLETE`
