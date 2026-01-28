# Claude CLI Provider Implementation Plan

**Generated**: 2026-01-28
**Original Request**: The user should be able to, instead of an api key, enable the use of their local Claude Code CLI tool to perform the clarifying questions, file discovery, and implementation planning.
**Refined Request**: This feature enables users to leverage their locally installed Claude Code CLI as an alternative to API key-based AI providers for executing the application's three-step orchestration workflow (Clarification → Discovery → Planning). A new "Claude CLI" provider option will be added to the existing provider selection UI alongside the current API-based providers (Anthropic, OpenAI, Google, etc.), allowing users to toggle between CLI and API modes without changing their workflow.

---

## Analysis Summary

- Feature request refined with project context
- Discovered 28 files across 7 directories
- Generated 23-step implementation plan with 4 Gemini review quality gates

## File Discovery Results

### Critical Priority Files
- `electron/ipc/lib/provider-types.ts` - Provider type definitions
- `electron/ipc/lib/provider-factory.ts` - Provider instance creation
- `electron/ipc/ai-clarification.handlers.ts` - Clarification step handlers
- `electron/ipc/ai-discovery.handlers.ts` - Discovery step handlers
- `electron/ipc/ai-plan.handlers.ts` - Planning step handlers
- `electron/ipc/api-keys.handlers.ts` - API key management

### High Priority Files
- `electron/ipc/channels.ts` - IPC channel constants
- `electron/preload.ts` - Electron API exposure
- `types/electron.ts` - TypeScript types
- `lib/ai/models.ts` - AI models list

---

## Implementation Plan

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This plan integrates Claude Code CLI as a new AI provider alongside existing API-based providers. Users can execute the three-step orchestration workflow (Clarification, Discovery, Planning) using their locally installed Claude Code CLI. The implementation extends the provider factory pattern with a CLI adapter, adds CLI availability detection, and updates the UI to accommodate non-streaming CLI execution with appropriate progress indicators.

## Prerequisites

- [ ] Verify Claude Code CLI is installed locally for testing (`claude --version`)
- [ ] Understand Claude CLI invocation patterns and argument structure
- [ ] Review Claude CLI documentation for prompt execution and output parsing

## Implementation Steps

### Step 1: Add Claude CLI Provider Type and Configuration

**What**: Extend the provider type system to include 'claude-cli' as a new provider with its specific configuration.
**Why**: The type system is the foundation for provider selection, credential handling, and UI rendering. Adding the provider type first ensures type safety throughout the implementation.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/lib/provider-types.ts` - Add 'claude-cli' to ApiKeyProvider union, add 'cli' to ProviderAuthType, add 'cli' to ProviderCategory, add configuration to all provider constants

**Changes:**

- Add 'claude-cli' to the ApiKeyProvider union type (alphabetical position)
- Add 'cli' to ProviderAuthType union type
- Add 'cli' to ProviderCategory union type
- Add 'claude-cli' entry to ALL_PROVIDERS array
- Add 'claude-cli' entry to PROVIDER_ENV_VARS (undefined - no env var needed)
- Add 'claude-cli' entry to PROVIDER_DISPLAY_NAMES ('Claude CLI')
- Add 'claude-cli' entry to PROVIDER_CATEGORIES ('cli')
- Add 'claude-cli' entry to PROVIDER_CONFIGS with authType: 'cli', category: 'cli'
- Update getRequiredCredentialFields to return empty array for 'cli' authType
- Update getOptionalCredentialFields to return empty array for 'cli' authType
- Update validateProviderCredentials to handle 'cli' authType (no validation needed)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] TypeScript compiles without errors
- [ ] All provider utility functions handle 'claude-cli' provider
- [ ] All validation commands pass

---

### Step 2: Create Claude CLI Execution Service

**What**: Create a new service module that handles spawning the Claude CLI process, passing prompts, and capturing output.
**Why**: Encapsulating CLI execution logic in a dedicated service provides clean separation of concerns and makes the code testable and maintainable.
**Confidence**: Medium

**Files to Create:**

- `electron/ipc/lib/claude-cli-service.ts` - Service for CLI detection, invocation, and output parsing

**Changes:**

- Create ClaudeCliService class with methods:
  - `isAvailable()`: Async method to check if CLI is installed and authenticated
  - `getVersion()`: Async method to get CLI version string
  - `executePrompt(prompt: string, options?: CliExecutionOptions)`: Execute prompt and return result
  - `parseOutput(output: string)`: Parse CLI output into structured response
- Define ClaudeCliExecutionOptions interface (timeout, abortSignal, workingDirectory)
- Define ClaudeCliResult interface (success, output, error, executionTime)
- Implement child process spawning using Node.js child_process.spawn
- Handle stdin/stdout/stderr streams properly
- Implement timeout and abort signal handling
- Add comprehensive error handling for common CLI failures

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Service compiles without TypeScript errors
- [ ] Service handles process spawning with proper error handling
- [ ] Timeout and abort signal mechanisms implemented
- [ ] All validation commands pass

---

### Step 3: Extend Provider Factory for Claude CLI

**What**: Update the provider factory to create Claude CLI provider instances that use the CLI service instead of API SDK.
**Why**: The provider factory is the central point for provider instantiation. Extending it maintains the existing architecture pattern and allows seamless integration with AI handlers.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/lib/provider-factory.ts` - Add case for 'claude-cli' provider, create CLI-based provider instance

**Changes:**

- Add import for claude-cli-service
- Add case for 'claude-cli' in the createProvider switch statement
- Create a special provider instance that wraps CLI execution instead of SDK
- The model function should return an object compatible with the streamText interface
- Handle the non-streaming nature of CLI by implementing a polling/progress pattern
- Add getProviderCredentials case for 'cli' authType (returns empty object)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Provider factory handles 'claude-cli' provider type
- [ ] CLI provider instance created successfully
- [ ] All validation commands pass

---

### Step 5: Add Claude CLI IPC Channels and Handlers

**What**: Create IPC channels and handlers for CLI availability detection and configuration management.
**Why**: The renderer needs to check CLI availability and store CLI configuration. IPC handlers provide the secure bridge between renderer and main process for these operations.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/channels.ts` - Add claudeCli channel group with availability, version, and test channels

**Files to Create:**

- `electron/ipc/claude-cli.handlers.ts` - Handlers for CLI detection and testing

**Changes:**

- Add `claudeCli` channel group to IpcChannels:
  - `isAvailable`: Check if CLI is installed
  - `getVersion`: Get CLI version
  - `test`: Test CLI execution with minimal prompt
- Create handler registration function registerClaudeCliHandlers
- Implement handler for isAvailable using ClaudeCliService
- Implement handler for getVersion using ClaudeCliService
- Implement handler for test using ClaudeCliService with simple prompt

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] IPC channels defined correctly
- [ ] Handlers implemented and registered
- [ ] All validation commands pass

---

### Step 6: Register Claude CLI Handlers in Main Process

**What**: Register the new Claude CLI handlers in the Electron main process.
**Why**: Handlers must be registered for IPC communication to work. This integrates the CLI handlers with the application lifecycle.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/index.ts` - Import and register claudeCli handlers
- `electron/main.ts` - Ensure handler registration is called

**Changes:**

- Import registerClaudeCliHandlers from claude-cli.handlers
- Add registerClaudeCliHandlers to the handler registration sequence
- Ensure handlers are registered before window creation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handlers registered successfully
- [ ] No startup errors
- [ ] All validation commands pass

---

### Step 7: Update Preload Script and Electron API Types

**What**: Expose Claude CLI API methods to the renderer process through the context bridge.
**Why**: The renderer needs access to CLI availability checking and testing. The preload script bridges the security boundary between main and renderer processes.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add claudeCli methods to electronAPI object
- `types/electron.ts` - Add claudeCli interface to ElectronAPI type

**Changes:**

- Add claudeCli interface to ElectronAPI with methods:
  - `isAvailable(): Promise<boolean>`
  - `getVersion(): Promise<string | null>`
  - `test(): Promise<{ success: boolean; error?: string }>`
- Implement claudeCli object in preload script using ipcRenderer.invoke

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Preload script exposes claudeCli API
- [ ] TypeScript types match implementation
- [ ] All validation commands pass

---

### Step 8: Create Claude CLI React Query Hooks

**What**: Create TanStack Query hooks for checking CLI availability and testing CLI execution.
**Why**: React Query hooks provide consistent data fetching patterns with caching, loading states, and error handling that match the rest of the application.
**Confidence**: High

**Files to Create:**

- `hooks/queries/use-claude-cli.ts` - Query hooks for CLI availability and testing

**Changes:**

- Create useClaudeCliAvailable hook for checking CLI availability
- Create useClaudeCliVersion hook for getting CLI version
- Create useTestClaudeCli mutation hook for testing CLI
- Add query keys for CLI-related queries
- Implement proper error handling and loading states

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Query hooks implemented with proper types
- [ ] Hooks follow existing query hook patterns
- [ ] All validation commands pass

---

### Step 9: Update API Keys Handlers for Claude CLI

**What**: Extend API key handlers to support Claude CLI provider configuration storage and retrieval.
**Why**: Claude CLI needs its configuration stored via electron-store alongside other providers. This enables the provider to appear in the UI and be managed consistently.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/api-keys.handlers.ts` - Add case for 'claude-cli' in getAll, get, set, delete, test handlers

**Changes:**

- Update buildApiKeyInfoFromStored to handle 'cli' authType
- Update decryptStoredCredentials to handle 'cli' authType (no decryption needed)
- Add testClaudeCli function that uses ClaudeCliService
- Update test handler switch statement to include 'claude-cli' case
- Ensure getAll returns claude-cli entry with availability status

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Claude CLI appears in API keys list
- [ ] Test function validates CLI availability
- [ ] All validation commands pass

---

### Step 11: Add Claude CLI Models to Models List

**What**: Add Claude CLI as a provider with available models in the models configuration.
**Why**: The model selector needs models for the Claude CLI provider to display in the UI. This enables users to select Claude CLI for workflow steps.
**Confidence**: High

**Files to Modify:**

- `lib/ai/models.ts` - Add 'claude-cli' entry to AI_MODELS with available models

**Changes:**

- Add 'claude-cli' key to AI_MODELS partial record
- Add models array with at least one entry (e.g., 'claude' with name 'Claude Code CLI')
- Set supportsThinking to true for CLI models (CLI supports extended thinking)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Claude CLI models defined in AI_MODELS
- [ ] Models have correct naming and capabilities flags
- [ ] All validation commands pass

---

### Step 12: Create CLI Provider Adapter for AI Handlers

**What**: Create an adapter that translates AI handler requests into CLI invocations and parses responses.
**Why**: The AI handlers use streamText from Vercel AI SDK. The CLI adapter needs to provide a compatible interface that simulates streaming by sending progress updates during CLI execution.
**Confidence**: Medium

**Files to Create:**

- `electron/ipc/lib/claude-cli-adapter.ts` - Adapter to bridge CLI execution with AI handler patterns

**Changes:**

- Create ClaudeCliAdapter class that wraps ClaudeCliService
- Implement method to create a fake streaming interface for CLI execution
- Send progress chunks during execution (starting, executing, parsing)
- Parse CLI output to extract tool calls and results
- Convert CLI response format to match expected stream chunk types
- Handle errors and cancellation consistently with API providers

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Adapter provides compatible interface for AI handlers
- [ ] Progress updates sent during execution
- [ ] Output parsing extracts expected data structures
- [ ] All validation commands pass

---

### Step 13: Update AI Clarification Handler for CLI Support

**What**: Modify the clarification handler to support Claude CLI execution alongside API-based providers.
**Why**: The clarification step is the first in the workflow. Supporting CLI here establishes the pattern for the other handlers.
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/ai-clarification.handlers.ts` - Add conditional logic for CLI provider execution

**Changes:**

- Add import for claude-cli-adapter
- Check if provider is 'claude-cli' after parsing modelId
- For CLI provider, use ClaudeCliAdapter instead of streamText
- Send appropriate progress chunks during CLI execution
- Handle CLI-specific error cases (not installed, not authenticated)
- Maintain functional parity with API providers for output format

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler detects and uses CLI adapter for claude-cli provider
- [ ] Progress updates sent during CLI execution
- [ ] Output format matches API provider output
- [ ] All validation commands pass

---

### Step 14: Update AI Discovery Handler for CLI Support

**What**: Modify the discovery handler to support Claude CLI execution.
**Why**: The discovery step requires tool calls for file search. The CLI adapter must handle these tool call patterns.
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/ai-discovery.handlers.ts` - Add conditional logic for CLI provider execution

**Changes:**

- Add import for claude-cli-adapter
- Check if provider is 'claude-cli' after parsing modelId
- For CLI provider, use ClaudeCliAdapter with tool definitions
- Handle tool calls in CLI execution (may require multiple CLI invocations)
- Send appropriate progress chunks during CLI execution
- Maintain functional parity with API providers for output format

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler detects and uses CLI adapter for claude-cli provider
- [ ] Tool calls handled correctly in CLI mode
- [ ] Progress updates sent during CLI execution
- [ ] All validation commands pass

---

### Step 15: Update AI Plan Handler for CLI Support

**What**: Modify the plan handler to support Claude CLI execution.
**Why**: The plan step completes the workflow. This ensures full CLI support across all orchestration steps.
**Confidence**: Medium

**Files to Modify:**

- `electron/ipc/ai-plan.handlers.ts` - Add conditional logic for CLI provider execution

**Changes:**

- Add import for claude-cli-adapter
- Check if provider is 'claude-cli' after parsing modelId
- For CLI provider, use ClaudeCliAdapter instead of streamText
- Send appropriate progress chunks during CLI execution
- Maintain functional parity with API providers for output format

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler detects and uses CLI adapter for claude-cli provider
- [ ] Progress updates sent during CLI execution
- [ ] Output format matches API provider output
- [ ] All validation commands pass

---

### Step 17: Update API Key Table for CLI Provider Display

**What**: Update the API key table component to properly display Claude CLI provider with appropriate status indicators.
**Why**: The UI needs to show CLI-specific information (installed status, version) rather than API key information.
**Confidence**: High

**Files to Modify:**

- `components/settings/api-key-table.tsx` - Add special handling for Claude CLI row display

**Changes:**

- Detect 'claude-cli' provider in table row rendering
- Display CLI-specific status (Installed/Not Installed) instead of masked key
- Show CLI version when available
- Update status badge to reflect CLI availability
- Hide edit/delete actions for CLI row (configuration managed externally)
- Add "Test CLI" action button for CLI row

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] CLI provider displays correctly in table
- [ ] Status reflects CLI availability
- [ ] Appropriate actions shown for CLI row
- [ ] All validation commands pass

---

### Step 18: Add CLI Fallback UI Component

**What**: Create a component that displays when CLI execution fails, offering options to retry or switch to API provider.
**Why**: Users need clear guidance when CLI is unavailable. The fallback prompt provides a smooth recovery path.
**Confidence**: High

**Files to Create:**

- `components/features/shared/cli-fallback-prompt.tsx` - Fallback UI for CLI unavailability

**Changes:**

- Create CliFallbackPrompt component with props for error message, onRetry callback, onSwitchProvider callback
- Display clear error message explaining CLI unavailability
- Provide "Retry CLI" button that calls onRetry
- Provide "Use API Provider" button that calls onSwitchProvider
- Style component consistently with existing error UI patterns
- Use appropriate icons (AlertCircle, RefreshCw, etc.)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Fallback component renders with appropriate styling
- [ ] Buttons trigger correct callbacks
- [ ] Component follows existing UI patterns
- [ ] All validation commands pass

---

### Step 19: Update Model Selector for CLI Provider

**What**: Ensure the model selector correctly displays Claude CLI as an option when available.
**Why**: Users select the provider/model combination in the workflow. The selector must show CLI as an available option.
**Confidence**: High

**Files to Modify:**

- `hooks/use-available-models.ts` - Update to include CLI provider when available

**Changes:**

- Add logic to check CLI availability via useClaudeCliAvailable hook
- Include 'claude-cli' in configuredProviders when CLI is available
- Ensure CLI models appear in model selector dropdown
- Add CLI-specific indicator (terminal icon) to distinguish from API providers

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] CLI appears in model selector when available
- [ ] CLI models correctly displayed
- [ ] Visual distinction from API providers
- [ ] All validation commands pass

---

### Step 20: Add Progress Indicators for CLI Execution

**What**: Update workflow step components to display appropriate progress during CLI execution.
**Why**: CLI execution doesn't stream tokens. Progress indicators show execution status to maintain user confidence.
**Confidence**: High

**Files to Modify:**

- `components/features/clarification/clarification-output.tsx` - Update progress display for CLI mode
- `components/features/discovery/discovery-output.tsx` - Update progress display for CLI mode
- `components/features/plan/plan-output.tsx` - Update progress display for CLI mode

**Changes:**

- Detect when using CLI provider from model ID
- Display execution progress bar instead of streaming text
- Show CLI-specific status messages (Executing Claude CLI...)
- Maintain spinner animation during CLI execution
- Display final output when CLI completes

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Progress indicators display during CLI execution
- [ ] Status messages appropriate for CLI mode
- [ ] Final output displays correctly
- [ ] All validation commands pass

---

### Step 21: Add CLI Configuration Storage

**What**: Implement electron-store based configuration storage for Claude CLI settings.
**Why**: CLI configuration (enabled status, preferences) needs to persist across sessions. Electron-store provides secure local storage.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/store.handlers.ts` - Add CLI-specific store keys if needed

**Changes:**

- Define store key constants for CLI configuration
- Store CLI enabled/disabled status
- Store any CLI-specific preferences
- Ensure configuration persists and loads correctly

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] CLI configuration stored persistently
- [ ] Configuration loads on app start
- [ ] All validation commands pass

---

### Step 22: Integration Testing and Error Handling Review

**What**: Review all integration points and ensure comprehensive error handling for CLI failures.
**Why**: CLI execution introduces new failure modes (not installed, not authenticated, timeout). Robust error handling ensures good user experience.
**Confidence**: High

**Files to Modify:**

- All handler files to review error handling
- CLI service and adapter files for edge case coverage

**Changes:**

- Review and enhance error messages for CLI-specific failures
- Add logging for debugging CLI issues
- Ensure abort/cancel functionality works correctly
- Verify timeout handling for long-running CLI operations
- Test error recovery paths

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All CLI error cases handled gracefully
- [ ] Error messages clear and actionable
- [ ] Cancel/abort works correctly
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Step 4: Gemini review passes (provider types and factory)
- [ ] Step 10: Gemini review passes (IPC and handlers)
- [ ] Step 16: Gemini review passes (AI handler modifications)
- [ ] Final Gemini code review passes (`/gemini-review`)
- [ ] Manual testing: CLI availability detection works
- [ ] Manual testing: Clarification workflow completes with CLI
- [ ] Manual testing: Discovery workflow completes with CLI
- [ ] Manual testing: Planning workflow completes with CLI
- [ ] Manual testing: Fallback UI appears on CLI failure

## Notes

1. **CLI Invocation Research Required**: The exact arguments and output format for Claude Code CLI need to be validated. The implementation assumes the CLI accepts prompts via stdin or arguments and returns structured output.

2. **Non-Streaming Behavior**: Unlike API providers, CLI execution is synchronous. The adapter simulates streaming by sending periodic progress updates during execution.

3. **Tool Calls in CLI Mode**: The discovery step uses tools for file search. Research is needed to determine if Claude CLI supports tool use or if tools must be handled differently (e.g., passing tool results back through multiple CLI invocations).

4. **Authentication**: Claude CLI handles its own authentication. The application only needs to detect availability and authenticated status, not manage credentials.

5. **Platform Compatibility**: CLI spawning should work on Windows, macOS, and Linux. The implementation must handle platform-specific path and process differences.

6. **Timeout Considerations**: CLI execution may take longer than API calls. Default timeout values should be generous (60+ seconds) with user visibility into execution status.
