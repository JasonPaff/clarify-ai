# Implementation Plan: Expand AI SDK Provider Support

**Generated**: 2026-01-18
**Original Request**: The app should support a lot more of the ai-sdk providers, all the popular ones should be supported.

## Analysis Summary

- Feature request refined with project context
- Discovered 20+ files across electron/ipc, components, hooks, lib, and types directories
- Generated 13-step implementation plan with architecture consolidation first

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan expands the AI provider ecosystem from 3 providers (Anthropic, Google, OpenAI) to 12 providers by adding Mistral, Cohere, Amazon Bedrock, Azure OpenAI, xAI, Groq, DeepSeek, Together AI, and Ollama. The implementation first consolidates the currently duplicated provider types and utilities into a centralized module, then extends the system to support provider-specific authentication requirements (AWS credentials, Azure endpoints, Ollama localhost URLs).

## Prerequisites

- [ ] Verify all existing provider integrations continue working before starting
- [ ] Review Vercel AI SDK documentation for each new provider package
- [ ] Ensure development environment has access to test at least one new provider

## Implementation Steps

### Step 1: Create Centralized Provider Type Definitions

**What**: Create a shared provider types module to eliminate the 5 locations where `ApiKeyProvider` is currently duplicated.
**Why**: The provider type is duplicated in `api-keys.handlers.ts`, `ai-clarification.handlers.ts`, `ai-overview.handlers.ts`, `lib/validations/api-key.ts`, and `lib/ai/models.ts`. Centralizing prevents inconsistencies when adding new providers.
**Confidence**: High

**Files to Create:**

- `electron/ipc/lib/provider-types.ts` - Single source of truth for all provider-related types and constants

**Files to Modify:**

- `electron/ipc/api-keys.handlers.ts` - Import from centralized module
- `electron/ipc/ai-clarification.handlers.ts` - Import from centralized module
- `electron/ipc/ai-overview.handlers.ts` - Import from centralized module
- `lib/validations/api-key.ts` - Import from centralized module
- `lib/ai/models.ts` - Import from centralized module
- `types/electron.d.ts` - Update type re-exports

**Changes:**

- Define `ApiKeyProvider` as a union type with all 12 providers
- Define `ProviderCategory` type for UI grouping (major, emerging, local)
- Define `ProviderConfig` interface with authentication requirements per provider
- Define `PROVIDER_ENV_VARS` mapping for all providers
- Define `PROVIDER_DISPLAY_NAMES` for UI labels
- Define `PROVIDER_CATEGORIES` mapping providers to categories
- Export all types and constants for shared use

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All provider types defined in single location
- [ ] No duplicate `ApiKeyProvider` definitions remain in codebase
- [ ] All validation commands pass

---

### Step 2: Create Centralized Provider Factory

**What**: Extract and consolidate the duplicated `createProvider()` function and API key retrieval utilities into a shared module.
**Why**: The `createProvider()` switch statement and `getApiKey()` function are duplicated in both `ai-clarification.handlers.ts` and `ai-overview.handlers.ts`. A centralized factory enables easier extension and maintenance.
**Confidence**: High

**Files to Create:**

- `electron/ipc/lib/provider-factory.ts` - Shared provider instantiation and API key retrieval

**Files to Modify:**

- `electron/ipc/ai-clarification.handlers.ts` - Import from factory module
- `electron/ipc/ai-overview.handlers.ts` - Import from factory module

**Changes:**

- Create `createProvider()` function that handles all 12 providers with dynamic imports
- Create `getApiKey()` function with support for provider-specific credential retrieval
- Create `getProviderCredentials()` function for complex auth (AWS, Azure)
- Remove duplicated helper functions from individual handler files
- Add provider-specific configuration handling (endpoints, regions)

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Single `createProvider()` implementation used across all AI handlers
- [ ] Single `getApiKey()` implementation for credential retrieval
- [ ] Duplicated code removed from handler files
- [ ] All validation commands pass

---

### Step 3: Extend API Key Storage Schema

**What**: Update the stored API key data structure to support provider-specific fields (endpoint URLs, regions, deployment names).
**Why**: Providers like Azure OpenAI require endpoint URLs and deployment names, Amazon Bedrock requires regions, and Ollama requires localhost endpoint configuration.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/lib/provider-types.ts` - Add extended credential interfaces
- `electron/ipc/api-keys.handlers.ts` - Update storage and retrieval logic
- `types/electron.d.ts` - Update `SetApiKeyInput` interface

**Changes:**

- Add `ProviderCredentials` interface with optional fields: `endpoint`, `region`, `deploymentName`, `accessKeyId`, `secretAccessKey`
- Update `SetApiKeyInput` to include provider-specific fields
- Update `StoredApiKeyData` to persist additional fields
- Update `ApiKeyInfo` to expose relevant configuration info (masked)
- Modify set/get handlers to handle extended credential storage

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Extended credential fields properly stored and retrieved
- [ ] Backward compatible with existing 3-provider API keys
- [ ] All validation commands pass

---

### Step 4: Install New AI SDK Provider Packages

**What**: Add npm dependencies for all new AI SDK provider packages.
**Why**: The Vercel AI SDK uses modular packages - each provider requires its own `@ai-sdk/*` package installation.
**Confidence**: High

**Files to Modify:**

- `package.json` - Add new dependencies

**Changes:**

- Add `@ai-sdk/mistral`
- Add `@ai-sdk/cohere`
- Add `@ai-sdk/amazon-bedrock`
- Add `@ai-sdk/azure`
- Add `@ai-sdk/xai`
- Add `@ai-sdk/groq`
- Add `@ai-sdk/deepseek` (official SDK for DeepSeek)
- Add `@ai-sdk/togetherai` (official SDK for Together AI - note: no hyphen)
- Add `ollama-ai-provider` (recommended community package for Ollama integration)

**Validation Commands:**

```bash
pnpm install && pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All new packages installed successfully
- [ ] No peer dependency conflicts
- [ ] All validation commands pass

---

### Step 5: Implement Provider Factory Cases for New Providers

**What**: Extend the `createProvider()` factory to handle all 9 new providers with appropriate configuration.
**Why**: Each provider has different initialization requirements - some use standard API keys, others require endpoints or AWS credentials.
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/lib/provider-factory.ts` - Add switch cases for all new providers

**Changes:**

- Add Mistral provider case using `createMistral` from `@ai-sdk/mistral`
- Add Cohere provider case using `createCohere` from `@ai-sdk/cohere`
- Add Amazon Bedrock provider case with AWS credential handling using `createAmazonBedrock` from `@ai-sdk/amazon-bedrock`
- Add Azure OpenAI provider case with endpoint and deployment name using `createAzure` from `@ai-sdk/azure`
- Add xAI provider case using `createXai` from `@ai-sdk/xai`
- Add Groq provider case using `createGroq` from `@ai-sdk/groq`
- Add DeepSeek provider case using `createDeepSeek` from `@ai-sdk/deepseek` (official SDK - NOT createOpenAICompatible)
- Add Together AI provider case using `createTogetherAI` from `@ai-sdk/togetherai` (official SDK - NOT createOpenAICompatible)
- Add Ollama provider case using `createOllama` from `ollama-ai-provider` (recommended community package with better integration than generic OpenAI-compatible approach)

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All 12 providers have factory implementations
- [ ] Provider-specific configurations properly applied
- [ ] Ollama works without API key requirement
- [ ] All validation commands pass

---

### Step 6: Implement API Key Test Functions for New Providers

**What**: Add test functions for verifying API key validity for each new provider.
**Why**: The existing `testAnthropicKey`, `testGoogleKey`, and `testOpenAIKey` functions need equivalents for all new providers to support the "Test Connection" feature.
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/api-keys.handlers.ts` - Add test functions and extend switch statement

**Changes:**

- Add `testMistralKey()` function
- Add `testCohereKey()` function - **Note: Cohere has a different response format than OpenAI-compatible APIs; use their `/v2/chat` endpoint which returns `message.content[0].text` instead of `choices[0].message.content`**
- Add `testBedrockCredentials()` function with AWS auth
- Add `testAzureKey()` function with endpoint validation
- Add `testXaiKey()` function
- Add `testGroqKey()` function
- Add `testDeepSeekKey()` function using official SDK
- Add `testTogetherAiKey()` function using official SDK
- Add `testOllamaConnection()` function (no API key, just endpoint connectivity check via `/api/tags` endpoint)
- Extend the test handler switch statement for all providers

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All providers have working test functions
- [ ] Ollama test verifies endpoint connectivity without API key
- [ ] Error messages are provider-appropriate
- [ ] All validation commands pass

---

### Step 7: Add Model Definitions for New Providers

**What**: Extend the `AI_MODELS` registry with model definitions for all new providers.
**Why**: The model selector depends on `AI_MODELS` to populate the dropdown with available models per provider.
**Confidence**: High

**Files to Modify:**

- `lib/ai/models.ts` - Add model entries for all new providers
- `hooks/use-available-models.ts` - Update `modelsByProvider` initialization

**Changes:**

- Add Mistral models (mistral-large-latest, mistral-small-latest, codestral-latest, pixtral-large-latest, magistral-medium-2506, ministral-8b-latest)
- Add Cohere models (command-r-plus, command-r, command-light, etc.)
- Add Amazon Bedrock models (claude-3.5-sonnet, claude-3-opus, titan-text-express, nova-pro, etc.)
- Add Azure OpenAI models (gpt-4, gpt-4o, gpt-4o-mini, etc. - deployment-dependent)
- Add xAI models (grok-2, grok-2-vision, grok-beta, etc.)
- Add Groq models (llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it)
- Add DeepSeek models (deepseek-chat, deepseek-coder, deepseek-reasoner)
- Add Together AI models (meta-llama/Llama-3.3-70B-Instruct-Turbo, mistralai/Mixtral-8x22B-Instruct-v0.1, Qwen/QwQ-32B-Preview, etc.)
- Add Ollama models (placeholder for local models - consider dynamic discovery via `/api/tags` endpoint)
- Update `PROVIDER_NAMES` with display names for all providers
- Update `modelsByProvider` to include all provider keys

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All providers have model definitions
- [ ] Model selector shows correct models when provider is configured
- [ ] All validation commands pass

---

### Step 8: Update Zod Validation Schema

**What**: Extend the API key validation schema to include all new providers and provider-specific fields.
**Why**: Form validation needs updated schemas to handle new provider options and conditional field requirements.
**Confidence**: High

**Files to Modify:**

- `lib/validations/api-key.ts` - Extend provider enum and add conditional schemas

**Changes:**

- Extend `apiProviderSchema` enum with all 12 providers
- Add optional `endpoint` field schema for Azure, Ollama
- Add optional `region` field schema for Amazon Bedrock
- Add optional `deploymentName` field schema for Azure
- Add optional `accessKeyId` and `secretAccessKey` for Bedrock
- Create conditional schema logic for provider-specific requirements
- **Ollama special case**: API key field must be explicitly optional (not just empty string allowed) with custom validation that ONLY validates endpoint when provider is 'ollama'. Use Zod's `.superRefine()` or discriminated union to handle this unique case where API key is not just optional but irrelevant.
- Update `CreateApiKeyFormValues` type to include extended fields

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All 12 providers valid in form submission
- [ ] Provider-specific fields validated appropriately
- [ ] Ollama allows empty API key with required endpoint
- [ ] All validation commands pass

---

### Step 9: Add Badge Variants for New Providers

**What**: Extend the badge component CVA variants to include styling for all new providers.
**Why**: Provider badges in the API keys table and model selector need distinct colors for visual identification.
**Confidence**: High

**Files to Modify:**

- `components/ui/badge.tsx` - Add variant cases for 9 new providers

**Changes:**

- Add `mistral` variant (orange/red tones)
- Add `cohere` variant (coral tones)
- Add `bedrock` variant (AWS orange)
- Add `azure` variant (Azure blue)
- Add `xai` variant (distinct color)
- Add `groq` variant (distinct color)
- Add `deepseek` variant (distinct color)
- Add `togetherai` variant (distinct color)
- Add `ollama` variant (purple/local indicator)

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All providers have unique badge variants
- [ ] Colors work in both light and dark mode
- [ ] All validation commands pass

---

### Step 10: Update API Key Form with Provider-Specific Fields

**What**: Modify the API key form to conditionally render additional fields based on selected provider.
**Why**: Azure OpenAI needs endpoint and deployment name fields, Amazon Bedrock needs region and AWS credentials, Ollama needs endpoint URL without API key.
**Confidence**: Medium

**Files to Modify:**

- `components/settings/api-key-form.tsx` - Add conditional field rendering

**Changes:**

- Add provider category grouping in provider select dropdown
- Add conditional `endpoint` TextField for Azure and Ollama
- Add conditional `region` SelectField for Amazon Bedrock
- Add conditional `deploymentName` TextField for Azure
- Add conditional `accessKeyId` and `secretAccessKey` fields for Bedrock
- Hide API key field for Ollama (make optional)
- Update form submission to include extended fields
- Add helper text explaining each provider's requirements

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Correct fields appear for each provider type
- [ ] Ollama form works without API key input
- [ ] Azure form includes endpoint and deployment name
- [ ] Bedrock form includes AWS credentials and region
- [ ] All validation commands pass

---

### Step 11: Update API Keys Section with Provider Categories

**What**: Organize the API keys display into categorized sections (Major Cloud, Emerging, Local/Self-Hosted).
**Why**: With 12 providers, a flat list becomes unwieldy. Categorization improves discoverability and UX.
**Confidence**: Medium

**Files to Modify:**

- `components/settings/api-keys-section.tsx` - Add category grouping
- `components/settings/api-key-table.tsx` - Update to support grouped display

**Changes:**

- Group providers by category in the display
- Add category headers (Major Cloud Providers, Emerging Providers, Local/Self-Hosted)
- Update table layout to show categories
- Add visual distinction between categories
- Update skeleton loader for new layout

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Providers displayed in logical categories
- [ ] Category headers clearly visible
- [ ] All 12 providers shown in correct categories
- [ ] All validation commands pass

---

### Step 12: Update Preload Script and Type Definitions

**What**: Update the Electron preload script and TypeScript type definitions to reflect extended API key interfaces.
**Why**: The preload script exposes the API to the renderer, and type definitions ensure type safety across the IPC boundary.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Update type imports
- `types/electron.d.ts` - Update exported types and interfaces

**Changes:**

- Update `SetApiKeyInput` type with extended fields
- Update `ApiKeyInfo` type with extended configuration display
- Ensure all new provider types are properly exported
- Update ElectronAPI interface comments for clarity

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All types properly exported for renderer use
- [ ] No type mismatches between main and renderer
- [ ] All validation commands pass

---

### Step 13: Integration Testing and Validation

**What**: Verify the complete provider integration works end-to-end with at least the free/easily-testable providers.
**Why**: Need to confirm the entire flow works: configuration, storage, retrieval, model selection, and AI generation.
**Confidence**: High

**Files to Modify:**

- None (testing only)

**Changes:**

- Test Groq provider (free tier available)
- Test Ollama with local installation if available
- Verify model selector shows correct models per configured provider
- Verify API key test function works for new providers
- Test the three-step AI workflow with a new provider

**Validation Commands:**

```bash
pnpm run lint --fix && pnpm run typecheck && pnpm run electron:dev
```

**Success Criteria:**

- [ ] At least one new provider fully functional end-to-end
- [ ] Model selector properly filters by configured providers
- [ ] AI generation workflow works with new provider
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint --fix`
- [ ] No duplicate provider type definitions remain in codebase
- [ ] No duplicate `createProvider()` or `getApiKey()` implementations remain
- [ ] All 12 providers have complete implementations (types, factory, models, test, badge, form)
- [ ] Ollama works without API key requirement
- [ ] Azure and Bedrock work with their specific authentication requirements
- [ ] Existing 3 providers (Anthropic, Google, OpenAI) continue working unchanged

## Notes

**Architecture Consolidation Priority**: Steps 1-2 MUST be completed before adding new providers. The consolidation eliminates technical debt and makes subsequent provider additions trivial.

**Provider Package Versions**: When adding AI SDK packages, verify version compatibility with the existing `ai` package version (currently `^6.0.39`). All `@ai-sdk/*` packages should use compatible versions.

**CRITICAL - Use Official SDKs**: DeepSeek and Together AI both have official Vercel AI SDK packages (`@ai-sdk/deepseek` and `@ai-sdk/togetherai`). Do NOT use the generic `createOpenAICompatible()` approach for these providers - the official SDKs provide better type safety, error handling, and feature support.

**Package Naming**: Note that Together AI's package is `@ai-sdk/togetherai` (no hyphen), not `@ai-sdk/together-ai`.

**Ollama Implementation**: The recommended approach is using `ollama-ai-provider` community package which provides better integration than a generic OpenAI-compatible wrapper. This package understands Ollama's specific features and endpoint structure.

**Ollama Special Handling**: Ollama is unique in requiring no API key but requiring an endpoint URL. The form validation and credential storage must handle this case explicitly - the API key field should be completely hidden/disabled for Ollama, not just optional.

**Cohere API Differences**: Cohere's API response format differs from OpenAI-compatible APIs. Their `/v2/chat` endpoint returns `message.content[0].text` instead of `choices[0].message.content`. Test functions must account for this.

**Amazon Bedrock Complexity**: Bedrock requires AWS credentials (access key ID + secret access key) and a region. Consider whether to support IAM role-based auth in future iterations.

**Azure OpenAI Deployment Names**: Azure OpenAI uses deployment names rather than model IDs. Users will need to configure both the endpoint and the specific deployment name for each model they want to use.

**Model Discovery for Dynamic Providers**: For Ollama and potentially Bedrock, consider adding a future enhancement to dynamically discover available models rather than hardcoding the list. Ollama exposes available models via `/api/tags` endpoint.

**Testing Constraints**: Full testing of all 12 providers requires accounts/API keys for each. Prioritize testing providers with free tiers (Groq, Ollama, DeepSeek free tier) during development.
