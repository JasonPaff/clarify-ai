# Implementation Plan: AI Thinking/Reasoning Toggle Feature

**Generated**: 2026-01-19
**Original Request**: the user should be able to toggle whether they want to use thinking/reasoning or not when the model supports it / supports turning it on/off.

## Analysis Summary

- Feature request refined with project context
- Discovered 26 relevant files across 4 priority levels
- Generated 11-step implementation plan

## File Discovery Results

### Critical Files

- `app/(app)/settings/page.tsx` - Add thinking toggle in Preferences section
- `electron/ipc/ai-overview.handlers.ts` - Has `buildThinkingProviderOptions()`, needs parameter
- `electron/ipc/ai-clarification.handlers.ts` - Needs thinking support added
- `electron/ipc/store.handlers.ts` - Persist global thinking preference
- `lib/ai/models.ts` - Already has `supportsThinking` property on models

### High Priority Files

- `electron/preload.ts` - Update request types
- `components/ui/ai/reasoning.tsx` - Already exists
- `components/repositories/repository-overview-generator.tsx` - Add per-request toggle
- `components/features/clarification/clarification-panel.tsx` - Add reasoning display

### Supporting Files

- `hooks/useElectron.ts` - useElectronStore for preferences
- `hooks/use-clarification.ts` - Update for thinking preference
- `components/providers/theme-provider.tsx` - Pattern reference

---

## Overview

**Estimated Duration**: 3-4 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This feature adds user control over AI thinking/reasoning capabilities through a global settings toggle with per-request override support. The implementation follows existing patterns for electron-store preferences (similar to theme provider) and extends the AI handler request interfaces to accept a thinking preference parameter. When enabled, reasoning content is already being streamed and displayed via the existing `Reasoning` component - this plan adds the control mechanism.

## Prerequisites

- [ ] Verify all referenced files exist in the codebase (confirmed via analysis)
- [ ] Ensure `useElectronStore` hook is available for preference persistence (confirmed in `hooks/useElectron.ts`)
- [ ] Confirm `Switch` component exists for toggle UI (confirmed in `components/ui/switch.tsx`)

## Implementation Steps

### Step 1: Create Thinking Preference Constants and Provider

**What**: Create constants file for thinking preference storage key and types, then build a ThinkingPreferenceProvider following the ThemeProvider pattern.
**Why**: Centralizes preference management and provides React context for accessing/updating the thinking preference across the application.
**Confidence**: High

**Files to Create:**

- `lib/ai/thinking-preference/constants.ts` - Storage key and type definitions
- `components/providers/thinking-preference-provider.tsx` - Context provider for thinking preference state

**Changes:**

- Define `THINKING_PREFERENCE_STORAGE_KEY` constant (e.g., `'app:thinking-enabled'`)
- Define `ThinkingPreference` type as boolean
- Define `DEFAULT_THINKING_PREFERENCE` as `true` (enabled by default)
- Create `ThinkingPreferenceProvider` component that:
  - Uses `useElectronStore` to persist preference
  - Provides `thinkingEnabled` boolean and `setThinkingEnabled` function via context
  - Follows the `ThemeProvider` pattern for loading/persistence
- Create `useThinkingPreference` hook for consuming the context

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Constants file exports storage key, type, and default value
- [ ] Provider component compiles without errors
- [ ] Hook is accessible and properly typed
- [ ] All validation commands pass

---

### Step 2: Integrate ThinkingPreferenceProvider into App Layout

**What**: Add the ThinkingPreferenceProvider to the application's provider hierarchy.
**Why**: Makes thinking preference state available throughout the application.
**Confidence**: High

**Files to Modify:**

- `app/(app)/layout.tsx` - Add ThinkingPreferenceProvider wrapper

**Changes:**

- Import `ThinkingPreferenceProvider` from the new provider module
- Wrap existing providers with `ThinkingPreferenceProvider` (inside QueryProvider, alongside ThemeProvider)

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Provider is properly nested in the component tree
- [ ] Application still loads without errors
- [ ] All validation commands pass

---

### Step 3: Add Thinking Toggle to Settings Page Preferences Section

**What**: Replace the placeholder content in the Preferences section with a functional thinking toggle.
**Why**: Provides users with the global control point for enabling/disabling AI thinking capabilities.
**Confidence**: High

**Files to Modify:**

- `app/(app)/settings/page.tsx` - Add thinking preference toggle

**Changes:**

- Import `useThinkingPreference` hook
- Import `Switch` component from `@/components/ui/switch`
- Import `Brain` icon from `lucide-react` for visual context
- Replace the "Preferences configuration coming soon" placeholder with:
  - A toggle row containing a label, description, and Switch component
  - Label: "Enable AI Thinking"
  - Description: "When enabled, models that support extended thinking will show their reasoning process"
  - Switch bound to `thinkingEnabled` state and `setThinkingEnabled` handler

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Toggle appears in the Preferences section
- [ ] Toggle state reflects the persisted preference
- [ ] Toggling updates the preference via electron-store
- [ ] All validation commands pass

---

### Step 4: Extend AI Request Interfaces with Thinking Parameter

**What**: Add optional `enableThinking` parameter to both AI handler request interfaces.
**Why**: Allows per-request control over thinking behavior, overriding the global default.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/ai-overview.handlers.ts` - Add `enableThinking` to `RepositoryOverviewGenerateRequest`
- `electron/ipc/ai-clarification.handlers.ts` - Add `enableThinking` and reasoning stream types to `ClarificationGenerateRequest` and `ClarificationStreamChunk`

**Changes:**

- In `ai-overview.handlers.ts`:
  - Add `enableThinking?: boolean` to `RepositoryOverviewGenerateRequest` interface
- In `ai-clarification.handlers.ts`:
  - Add `enableThinking?: boolean` to `ClarificationGenerateRequest` interface
  - Add `'reasoning' | 'reasoning_start' | 'reasoning_end'` to `ClarificationStreamChunk.type` union
  - Add `reasoningTokens?: number` to `ClarificationUsageData` interface

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Request interfaces accept optional `enableThinking` parameter
- [ ] TypeScript compilation succeeds
- [ ] All validation commands pass

---

### Step 5: Update AI Overview Handler to Use Thinking Parameter

**What**: Modify the repository overview handler to respect the `enableThinking` parameter.
**Why**: Enables the handler to conditionally apply thinking configuration based on user preference.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/ai-overview.handlers.ts` - Implement thinking preference logic

**Changes:**

- Extract `enableThinking` from the request payload (default to `true` for backward compatibility)
- Modify the `buildThinkingProviderOptions` call to pass `supportsThinking && enableThinking` instead of just `supportsThinking`
- This ensures thinking is only enabled when both the model supports it AND the user has enabled it

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Handler respects `enableThinking` parameter
- [ ] When `enableThinking` is false, no thinking provider options are added
- [ ] When `enableThinking` is true or undefined, existing behavior is preserved
- [ ] All validation commands pass

---

### Step 6: Update AI Clarification Handler to Support Thinking

**What**: Add thinking/reasoning support to the clarification handler, mirroring the overview handler pattern.
**Why**: Ensures clarification operations also support thinking capabilities with user control.
**Confidence**: High

**Files to Modify:**

- `electron/ipc/ai-clarification.handlers.ts` - Add thinking support

**Changes:**

- Import `getModelInfo` from `@/lib/ai/models`
- Define a local `buildThinkingProviderOptions` function (same implementation as overview handler) or extract to shared utility
- Extract `enableThinking` from request payload
- Get model info to check `supportsThinking`
- Apply provider options to `streamText` call when thinking is enabled
- Add handling for `reasoning-start`, `reasoning-delta`, and `reasoning-end` events in the stream processing loop
- Update finish event to capture `reasoningTokens` from usage details

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Clarification handler supports thinking provider options
- [ ] Reasoning stream events are properly sent to renderer
- [ ] Reasoning tokens are captured in usage data
- [ ] All validation commands pass

---

### Step 7: Extract Shared Thinking Provider Options Builder

**What**: Create a shared utility function for building thinking provider options to avoid code duplication.
**Why**: Both handlers use identical logic; extracting it improves maintainability.
**Confidence**: High

**Files to Create:**

- `electron/lib/ai-utils.ts` - Shared AI utility functions

**Files to Modify:**

- `electron/ipc/ai-overview.handlers.ts` - Import and use shared utility
- `electron/ipc/ai-clarification.handlers.ts` - Import and use shared utility

**Changes:**

- Create new file with:
  - `DEFAULT_THINKING_BUDGET` constant
  - `buildThinkingProviderOptions(provider, supportsThinking, enableThinking)` function
- Update both handlers to import from shared module
- Remove duplicate `buildThinkingProviderOptions` function from `ai-overview.handlers.ts`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Shared utility is properly typed and exported
- [ ] Both handlers use the shared utility
- [ ] No duplicate code remains
- [ ] All validation commands pass

---

### Step 8: Update Preload Script and Type Definitions

**What**: Update the ElectronAPI types to reflect the new request interfaces.
**Why**: Ensures type safety across the IPC boundary for renderer-side code.
**Confidence**: High

**Files to Modify:**

- `types/electron.ts` - Re-exports handle the types automatically via handler imports

**Changes:**

- Verify that the type re-exports in `types/electron.ts` correctly reflect the updated handler types
- No explicit changes should be needed since types are re-exported from handlers
- If needed, update the `ElectronAPI` interface method signatures

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Type re-exports are correct
- [ ] Renderer code has access to updated types
- [ ] All validation commands pass

---

### Step 9: Update Repository Overview Generator Component

**What**: Add per-request thinking toggle to the repository overview generator UI.
**Why**: Allows users to override the global thinking preference for individual generation requests.
**Confidence**: High

**Files to Modify:**

- `components/repositories/repository-overview-generator.tsx` - Add thinking toggle UI

**Changes:**

- Import `useThinkingPreference` hook
- Add local state for per-request thinking override: `const [thinkingOverride, setThinkingOverride] = useState<boolean | null>(null)`
- Compute effective thinking state: `const effectiveThinking = thinkingOverride ?? thinkingEnabled`
- Add a thinking toggle in the idle state configuration section (only shown when model supports thinking):
  - Use existing model info check: `supportsThinking`
  - Display Switch with label "Enable thinking for this request"
  - Bind to local override state
- Pass `enableThinking: effectiveThinking` to the generate request

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Toggle appears only for thinking-capable models
- [ ] Toggle defaults to global preference
- [ ] Override is passed to generation request
- [ ] All validation commands pass

---

### Step 10: Update Clarification Hook and Panel for Thinking Support

**What**: Add thinking/reasoning support to the clarification workflow.
**Why**: Enables reasoning display during clarification generation with user preference support.
**Confidence**: High

**Files to Modify:**

- `hooks/use-clarification.ts` - Add reasoning state and stream handling
- `components/features/clarification/clarification-panel.tsx` - Add reasoning display and thinking toggle

**Changes:**

In `use-clarification.ts`:

- Add state for reasoning: `reasoningText`, `isReasoningStreaming`
- Add reasoning stream handlers in the `onStream` callback:
  - Handle `'reasoning_start'`, `'reasoning'`, `'reasoning_end'` chunk types
- Update `startClarification` signature to accept optional `enableThinking` parameter
- Pass `enableThinking` to the generate request
- Export `reasoningText` and `isReasoningStreaming` from hook
- Reset reasoning state in `resetClarification`

In `clarification-panel.tsx`:

- Import `useThinkingPreference` hook
- Import `Reasoning`, `ReasoningTrigger`, `ReasoningContent` components
- Add local state for thinking override
- Add thinking toggle in idle state (conditional on model supporting thinking)
- Add reasoning display above or within the streaming analysis section when reasoning content exists
- Pass `enableThinking` to `startClarification` call

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Hook exposes reasoning state
- [ ] Reasoning is streamed and displayed during clarification
- [ ] Thinking toggle works for clarification requests
- [ ] All validation commands pass

---

### Step 11: Update useElectron Hook Type Exports

**What**: Ensure the useElectron hooks properly export the updated request types.
**Why**: Maintains type safety for components using the electron hooks.
**Confidence**: High

**Files to Modify:**

- `hooks/useElectron.ts` - Verify type imports are correct

**Changes:**

- Verify imports from `@/types/electron` include updated types
- No explicit changes should be needed since types flow through from handlers
- Test that `RepositoryOverviewGenerateRequest` and `ClarificationGenerateRequest` have `enableThinking`

**Validation Commands:**

```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**

- [ ] Type imports are correct
- [ ] Hooks accept `enableThinking` parameter
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Global thinking toggle persists across sessions
- [ ] Per-request override functions correctly
- [ ] Reasoning content streams and displays when thinking is enabled
- [ ] Thinking is properly disabled when user opts out
- [ ] Existing functionality (models without thinking support) continues to work

## Notes

- **Backward Compatibility**: The `enableThinking` parameter defaults to `true` when not provided, preserving existing behavior for any code paths that haven't been updated
- **Model-Specific Behavior**: The thinking toggle only appears in the UI when the selected model has `supportsThinking: true`, preventing confusion for models that don't support this feature
- **Provider Options**: Each AI provider has different thinking configuration formats (Anthropic uses `thinking`, Google uses `thinkingConfig`, OpenAI uses `reasoningEffort`), which is already handled by the `buildThinkingProviderOptions` function
- **Existing Reasoning Component**: The `components/ui/ai/reasoning.tsx` component is already implemented with proper streaming support, collapsible UI, and duration tracking - this plan leverages that existing component
- **Storage Pattern**: Following the established `ThemeProvider` pattern for electron-store persistence ensures consistency and reliability
