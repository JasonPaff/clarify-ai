# Step 2: AI-Powered File Discovery

**Status**: Completed
**Started**: 2026-01-28T00:02:00Z
**Completed**: 2026-01-28T00:04:00Z
**Duration**: ~120 seconds

## Refined Request Used

This feature enables users to leverage their locally installed Claude Code CLI as an alternative to API key-based AI providers for executing the application's three-step orchestration workflow (Clarification → Discovery → Planning). A new "Claude CLI" provider option will be added to the existing provider selection UI alongside the current API-based providers (Anthropic, OpenAI, Google, etc.), allowing users to toggle between CLI and API modes without changing their workflow.

## Discovery Analysis Summary

- **Directories explored**: 15+
- **Candidate files examined**: 50+
- **Highly relevant files found**: 22
- **Supporting files identified**: 13

## Discovered Files

### Critical Priority (Core Implementation - Must Modify)

| File | Reason |
|------|--------|
| `electron/ipc/lib/provider-types.ts` | Central provider type definitions - must add `'claude-cli'` to `ApiKeyProvider` type, add new auth type (`'cli'`), update `PROVIDER_CONFIGS`, `PROVIDER_DISPLAY_NAMES`, etc. |
| `electron/ipc/lib/provider-factory.ts` | Creates provider instances via `createProvider()` - must add CLI adapter that spawns CLI process instead of using SDK |
| `electron/ipc/ai-clarification.handlers.ts` | Handles clarification step - uses `streamText` from AI SDK, must support CLI adapter pattern |
| `electron/ipc/ai-discovery.handlers.ts` | Handles discovery step - uses AI tools, must adapt for CLI execution |
| `electron/ipc/ai-plan.handlers.ts` | Handles planning step - must adapt for non-streaming CLI responses |
| `electron/ipc/api-keys.handlers.ts` | Manages API key storage/testing - must add CLI availability check method |

### High Priority (Supporting Infrastructure - Need Updates)

| File | Reason |
|------|--------|
| `electron/ipc/channels.ts` | IPC channel constants - may need new CLI-specific channels |
| `electron/ipc/register-handlers.ts` | Registers all IPC handlers - may need CLI handler registration |
| `electron/preload.ts` | Exposes Electron API to renderer - must expose CLI-related methods |
| `types/electron.ts` | TypeScript types for renderer - must update `ElectronAPI` interface |
| `lib/ai/models.ts` | Contains `AI_MODELS` list per provider - must add CLI models |
| `electron/ipc/lib/ai-utils.ts` | Shared AI utilities - may need CLI-specific configuration |

### Medium Priority (UI/UX - Settings and Display)

| File | Reason |
|------|--------|
| `components/settings/api-keys-section.tsx` | Main API keys settings UI - must show CLI as provider option |
| `components/settings/api-key-table.tsx` | Displays provider list - must handle CLI availability indicator |
| `components/settings/api-key-form.tsx` | Form for configuring API keys - must handle CLI-specific config |
| `components/settings/api-key-dialog.tsx` | Dialog for adding/editing - must conditionally show CLI setup |
| `components/features/clarification/model-selector.tsx` | Model selection combobox - must include CLI models |
| `components/ai-settings/ai-settings-panel.tsx` | AI settings panel - may need CLI-specific settings |
| `hooks/use-available-models.ts` | Filters available models - must include CLI when available |
| `hooks/queries/use-api-keys.ts` | TanStack Query hooks - may need CLI availability query |
| `hooks/useElectron.ts` | Wrapper hooks for Electron API - must expose CLI methods |
| `app/(app)/settings/page.tsx` | Global settings page - may need CLI settings section |

### Low Priority (Reference/Context)

| File | Reason |
|------|--------|
| `electron/main.ts` | Electron main process entry - may spawn CLI process |
| `electron/ipc/store.handlers.ts` | Electron store handlers - CLI config storage |
| `components/providers/workflow-provider.tsx` | Workflow context - handle CLI operation states |
| `lib/ai/prompts/clarification.ts` | Prompt building - CLI may need different formatting |
| `lib/ai/prompts/discovery.ts` | Discovery prompts - CLI context adaptation |
| `lib/ai/prompts/plan.ts` | Planning prompts - CLI formatting |

## Architecture Insights

### Key Patterns Discovered

1. **Provider Factory Pattern**: The codebase uses a factory pattern in `provider-factory.ts` to create provider instances. A new CLI adapter should fit this pattern by implementing a `ProviderInstance` interface.

2. **Auth Type System**: Providers use `authType` to determine credential requirements (`'api_key'`, `'aws'`, `'azure'`, `'none'`). CLI should use a new type (e.g., `'cli'`) with `requiresAdditionalConfig: false`.

3. **Streaming via IPC**: AI handlers stream results via `mainWindow.webContents.send()` with typed stream chunks. CLI adapter must emit compatible chunks or use progress indicators.

4. **Centralized Type Definitions**: All provider types originate from `provider-types.ts` and are re-exported through `types/electron.ts`.

### Existing Similar Functionality

The **Ollama provider** (`authType: 'none'`) is the closest existing pattern:
- No API key required
- Uses endpoint configuration (optional)
- Has `testOllamaConnection()` for availability checking
- Listed in `PROVIDER_CONFIGS` with `category: 'local'`

### Integration Points

1. **CLI Availability Check**: Similar to `testOllamaConnection()` - run `claude --version`
2. **CLI Invocation**: Use Node.js `child_process.spawn()` in Electron main process
3. **Output Parsing**: Parse CLI output into expected response formats
4. **Progress Indicators**: Replace streaming tokens with execution status updates

### Potential Challenges

1. **Non-streaming Output**: CLI returns complete response, not token stream
2. **Tool Calling**: Discovery step uses AI tools - CLI may not support same interface
3. **Error Handling**: CLI failures need graceful fallback with user notification
4. **Cross-platform Support**: CLI invocation path differs on Windows vs. macOS/Linux

## File Path Validation

All discovered files have been validated to exist in the codebase.

## Discovery Statistics

- **Total files discovered**: 28
- **Critical priority**: 6 files
- **High priority**: 6 files
- **Medium priority**: 10 files
- **Low priority**: 6 files
- **Architecture coverage**: Provider system, IPC, UI, Types, Hooks
