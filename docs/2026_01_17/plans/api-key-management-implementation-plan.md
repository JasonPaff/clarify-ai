# API Key Management Implementation Plan

Generated: 2026-01-17
Original Request: API key management
Refined Request: The API key management feature enables users to securely store and validate API keys for Claude (Anthropic), OpenAI, and Google AI providers that power the implementation planning workflow. Users should be able to add, update, test, and remove API keys through a dedicated form interface within the app settings, with sensitive keys masked in the UI for security. The system will support three layers of API key resolution: first checking for keys entered in the settings form (encrypted via Electron's safeStorage API for OS-level encryption using Keychain on macOS and Credential Manager on Windows), then falling back to environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_KEY), and finally attempting to use the Vercel AI SDK's default behavior.

## Analysis Summary

- Feature request refined with project context and user clarifications
- Discovered 29 relevant files across multiple directories
- Generated 18-step implementation plan

## Overview

**Estimated Duration**: 2-3 days
**Complexity**: Medium
**Risk Level**: Medium

## Quick Summary

This feature enables secure storage and validation of API keys for Claude (Anthropic), OpenAI, and Google AI providers. Users can add, test, and manage API keys through the settings page, with keys encrypted using Electron's safeStorage API. The system supports three-layer resolution: user-provided encrypted keys, environment variables, and Vercel AI SDK defaults.

## Prerequisites

- [ ] Verify Electron's safeStorage module is available (built into Electron 35.1.0)
- [ ] Confirm the `components/settings/` directory does not exist and will be created
- [ ] Review environment variable names: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_KEY`

## Implementation Steps

### Step 1: Define IPC Channels for API Keys

**What**: Add the `apiKeys` namespace to `electron/ipc/channels.ts` with channels for CRUD operations and connection testing
**Why**: Establishes the typed channel constants needed for main-renderer communication
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add apiKeys namespace with channels for getAll, get, set, delete, test, and checkEncryption

**Changes:**
- Add `apiKeys` object to `IpcChannels` with channels: `getAll`, `get`, `set`, `delete`, `test`, `isEncryptionAvailable`
- Follow existing naming convention pattern (e.g., `apiKeys:getAll`, `apiKeys:set`)

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] IpcChannels object includes complete apiKeys namespace
- [ ] All channel names follow existing naming convention
- [ ] All validation commands pass

---

### Step 2: Create API Key Types and Validation Schemas

**What**: Create Zod validation schemas and TypeScript types for API key data structures
**Why**: Provides type-safe validation for form inputs and API key storage format
**Confidence**: High

**Files to Create:**
- `lib/validations/api-key.ts` - Zod schemas for API key forms

**Changes:**
- Define `ApiProvider` type enum: `'anthropic' | 'openai' | 'google'`
- Create `ApiKeySource` type: `'user' | 'environment'`
- Create `createApiKeySchema` with fields: provider (enum), apiKey (string, min 1), notes (optional string)
- Create `updateApiKeySchema` for edit operations
- Create `ApiKeyEntry` type for stored/displayed keys with fields: provider, maskedKey, source, notes, createdAt, updatedAt
- Export inferred types for form values

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All schemas properly validate provider, apiKey, and notes fields
- [ ] Types are exported and importable from the module
- [ ] All validation commands pass

---

### Step 3: Create API Keys IPC Handlers with safeStorage Encryption

**What**: Implement IPC handlers for API key CRUD operations with encryption via Electron's safeStorage
**Why**: Provides secure storage for sensitive API keys using OS-level encryption and handles environment variable fallback
**Confidence**: High

**Files to Create:**
- `electron/ipc/api-keys.handlers.ts` - IPC handlers for API key operations

**Changes:**
- Import `safeStorage` from electron and `Store` from electron-store
- Implement `registerApiKeysHandlers()` function
- Create handler for `isEncryptionAvailable` that returns `safeStorage.isEncryptionAvailable()`
- Create handler for `getAll` that returns list of configured keys (both user and environment) with masked values
- Create handler for `get` that retrieves and decrypts a specific key by provider
- Create handler for `set` that encrypts key with `safeStorage.encryptString()` and stores as base64 in electron-store
- Create handler for `delete` that removes a key from electron-store
- Create handler for `test` that validates key by making lightweight API call to provider
- Implement environment variable detection for each provider
- Mask keys for display (show only last 4 characters)
- Store keys in electron-store under `apiKeys.{provider}` namespace with structure: `{ encrypted: string, notes?: string, createdAt: string, updatedAt: string }`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Handler encrypts keys before storing in electron-store
- [ ] Handler decrypts keys when needed for API calls
- [ ] Handler detects and reports environment variable keys
- [ ] Handler masks keys appropriately for UI display
- [ ] All validation commands pass

---

### Step 4: Implement API Key Test Connection Logic

**What**: Add provider-specific connection testing to validate API keys
**Why**: Allows users to verify their API keys work before relying on them for plan generation
**Confidence**: Medium

**Files to Modify:**
- `electron/ipc/api-keys.handlers.ts` - Add test connection implementation

**Changes:**
- Implement test function for Anthropic using a minimal messages API call (e.g., list models or minimal completion)
- Implement test function for OpenAI using models.list() or minimal completion
- Implement test function for Google AI using a minimal generateContent call
- Return structured result: `{ success: boolean, error?: string, provider: string }`
- Handle network errors, authentication errors, and rate limits gracefully
- Use dynamic imports for SDK clients to avoid bundling issues

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Each provider has working test function
- [ ] Errors are caught and returned with meaningful messages
- [ ] Test does not consume significant API quota
- [ ] All validation commands pass

---

### Step 5: Register API Keys Handlers

**What**: Register the new API keys handlers in the handler registration system
**Why**: Ensures the handlers are active when the Electron app starts
**Confidence**: High

**Files to Modify:**
- `electron/ipc/register-handlers.ts` - Import and call registerApiKeysHandlers

**Changes:**
- Import `registerApiKeysHandlers` from `./api-keys.handlers`
- Call `registerApiKeysHandlers()` in the `registerAllHandlers` function

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] API keys handlers are registered on app startup
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

### Step 6: Update Electron Type Definitions

**What**: Add TypeScript interface definitions for the new apiKeys API
**Why**: Enables type-safe access to API keys methods from the renderer process
**Confidence**: High

**Files to Modify:**
- `types/electron.d.ts` - Add apiKeys interface to ElectronAPI

**Changes:**
- Add `ApiProvider` type
- Add `ApiKeySource` type
- Add `ApiKeyEntry` interface for displayed key data
- Add `ApiKeyTestResult` interface for test connection results
- Add `apiKeys` object to ElectronAPI interface with methods: `getAll()`, `get(provider)`, `set(provider, key, notes?)`, `delete(provider)`, `test(provider)`, `isEncryptionAvailable()`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All method signatures are correctly typed
- [ ] Types match the handler implementations
- [ ] All validation commands pass

---

### Step 7: Expose API Keys Methods in Preload Script

**What**: Add apiKeys methods to the contextBridge exposure
**Why**: Makes the API keys functionality accessible from the renderer process
**Confidence**: High

**Files to Modify:**
- `electron/preload.ts` - Add apiKeys object to electronAPI

**Changes:**
- Add `apiKeys` object to the `electronAPI` constant
- Implement each method using `ipcRenderer.invoke()` with the corresponding channel
- Match the interface defined in types/electron.d.ts

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] All apiKeys methods are exposed via contextBridge
- [ ] Methods use correct IPC channels
- [ ] All validation commands pass

---

### Step 8: Create useElectronApiKeys Hook

**What**: Create a React hook for accessing API keys functionality
**Why**: Provides a clean, typed interface for React components to interact with API keys
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Add useElectronApiKeys hook

**Changes:**
- Add `useElectronApiKeys` function following the pattern of existing hooks
- Implement memoized methods: `getAll`, `get`, `set`, `delete`, `test`, `isEncryptionAvailable`
- Return the methods object along with `isElectron` boolean

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hook follows existing useElectron pattern
- [ ] All methods are properly memoized with useCallback
- [ ] All validation commands pass

---

### Step 9: Create Query Key Factory for API Keys

**What**: Define TanStack Query key factory for API keys queries
**Why**: Enables organized cache invalidation and query management
**Confidence**: High

**Files to Create:**
- `lib/queries/api-keys.ts` - Query key factory for API keys

**Changes:**
- Import `createQueryKeys` from `@lukemorales/query-key-factory`
- Create `apiKeyKeys` with queries: `list` (all keys), `detail` (by provider), `encryptionAvailable`
- Follow the pattern from `lib/queries/projects.ts`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Query keys follow existing pattern
- [ ] Keys properly differentiate list and detail queries
- [ ] All validation commands pass

---

### Step 10: Create TanStack Query Hooks for API Keys

**What**: Implement React Query hooks for fetching, mutating, and testing API keys
**Why**: Provides reactive data fetching with caching and optimistic updates
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-api-keys.ts` - TanStack Query hooks

**Changes:**
- Create `useApiKeys` query hook for fetching all configured keys
- Create `useApiKey` query hook for fetching a specific provider's key
- Create `useSetApiKey` mutation hook with cache invalidation
- Create `useDeleteApiKey` mutation hook with cache invalidation
- Create `useTestApiKey` mutation hook for connection testing
- Create `useEncryptionAvailable` query hook
- Follow patterns from `hooks/queries/use-projects.ts`

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Hooks follow existing TanStack Query patterns
- [ ] Mutations properly invalidate relevant queries
- [ ] All validation commands pass

---

### Step 11: Add Provider Badge Variants

**What**: Add badge variants for API provider display (Anthropic, OpenAI, Google)
**Why**: Provides visual distinction between different AI providers in the UI
**Confidence**: High

**Files to Modify:**
- `components/ui/badge.tsx` - Add provider-specific variants

**Changes:**
- Add `anthropic` variant with appropriate coloring (coral/orange tones)
- Add `openai` variant with appropriate coloring (green tones)
- Add `google` variant with appropriate coloring (blue/multi tones)
- Add `environment` variant for environment variable indicator
- Add `user` variant for user-provided key indicator

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Each provider has distinct, accessible color variant
- [ ] Source type badges (environment/user) are distinguishable
- [ ] All validation commands pass

---

### Step 12: Create API Key Table Component

**What**: Build the table component displaying all configured API keys
**Why**: Provides the main view of all API keys with their status and actions
**Confidence**: High

**Files to Create:**
- `components/settings/api-key-table.tsx` - Table component

**Changes:**
- Create table with columns: Provider (with badge), Key (masked), Source (environment/user badge), Notes, Actions
- Display provider name with colored badge
- Show masked key value (last 4 characters visible)
- Show source type badge
- Show truncated notes if present
- Include Edit and Delete action buttons per row
- Handle empty state when no keys configured
- Use existing Button component for actions

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Table displays all key types (user and environment)
- [ ] Keys are properly masked
- [ ] Action buttons trigger appropriate callbacks
- [ ] All validation commands pass

---

### Step 13: Create API Key Form Component

**What**: Build the form for adding and editing API keys
**Why**: Provides the input interface for API key configuration with validation
**Confidence**: High

**Files to Create:**
- `components/settings/api-key-form.tsx` - Form component

**Changes:**
- Use `useAppForm` hook with createApiKeySchema or updateApiKeySchema
- Create SelectField for provider selection (disabled in edit mode)
- Create TextField for API key input with type="password" for masking
- Create TextareaField for optional notes
- Add "Test Connection" button that validates before save
- Show test result feedback (success/error message)
- Include SubmitButton and Cancel button
- Handle loading states during test and submit

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Form validates all required fields
- [ ] Test connection provides immediate feedback
- [ ] Form resets properly after successful submission
- [ ] All validation commands pass

---

### Step 14: Create API Key Dialog Component

**What**: Build the dialog wrapper for the API key form
**Why**: Provides modal interface for add/edit operations consistent with app design
**Confidence**: High

**Files to Create:**
- `components/settings/api-key-dialog.tsx` - Dialog component

**Changes:**
- Use existing Dialog components from `components/ui/dialog.tsx`
- Accept mode prop: `'add' | 'edit'`
- Accept optional existingKey prop for edit mode
- Include DialogTitle and DialogDescription
- Render ApiKeyForm inside DialogPopup
- Handle open/close state with controllable pattern
- Close dialog on successful form submission

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog opens and closes properly
- [ ] Form submits and closes dialog on success
- [ ] Edit mode pre-populates existing values
- [ ] All validation commands pass

---

### Step 15: Create Delete API Key Confirmation Dialog

**What**: Build confirmation dialog for API key deletion
**Why**: Prevents accidental deletion of API keys with confirmation step
**Confidence**: High

**Files to Create:**
- `components/settings/delete-api-key-dialog.tsx` - Delete confirmation dialog

**Changes:**
- Use AlertDialog from Base UI (follow pattern from delete-feature-request-dialog.tsx)
- Accept apiKey prop with provider and display info
- Show warning about deletion being permanent
- Include Cancel and Delete buttons
- Handle deletion via useDeleteApiKey mutation
- Close dialog on successful deletion

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Dialog warns user about permanent deletion
- [ ] Delete button triggers mutation
- [ ] Dialog closes after successful deletion
- [ ] All validation commands pass

---

### Step 16: Create API Keys Section Component

**What**: Build the main section component that orchestrates all API key UI components
**Why**: Provides the complete API keys management interface for the settings page
**Confidence**: High

**Files to Create:**
- `components/settings/api-keys-section.tsx` - Main section component

**Changes:**
- Use useApiKeys hook to fetch all configured keys
- Render "Add API Key" button that opens ApiKeyDialog in add mode
- Render ApiKeyTable with configured keys
- Handle edit action by opening ApiKeyDialog in edit mode
- Handle delete action by opening DeleteApiKeyDialog
- Show loading skeleton while fetching
- Show encryption warning if safeStorage not available
- Show helpful message when no keys configured

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Section displays all configured keys
- [ ] Add, edit, and delete operations work correctly
- [ ] Loading and empty states are handled
- [ ] All validation commands pass

---

### Step 17: Integrate API Keys Section into Settings Page

**What**: Replace the placeholder in settings page with the API Keys Section component
**Why**: Makes the feature accessible to users through the settings page
**Confidence**: High

**Files to Modify:**
- `app/(app)/settings/page.tsx` - Replace placeholder with ApiKeysSection

**Changes:**
- Import ApiKeysSection from `@/components/settings/api-keys-section`
- Replace the placeholder div inside CardContent with `<ApiKeysSection />`
- Remove the hardcoded placeholder text

**Validation Commands:**
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria:**
- [ ] Settings page renders ApiKeysSection
- [ ] No console errors on page load
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Electron app starts without errors (`pnpm electron:dev`)
- [ ] API keys can be added, edited, and deleted
- [ ] Connection testing works for valid keys
- [ ] Keys are encrypted in electron-store (not plaintext)
- [ ] Environment variables are properly detected
- [ ] UI properly masks sensitive key values

## Notes

**Security Considerations:**
- API keys are encrypted using Electron's safeStorage API which uses OS-level encryption (Keychain on macOS, Credential Manager on Windows)
- Keys are stored as base64-encoded encrypted buffers in electron-store
- Keys are only decrypted when needed for API calls, never exposed in plaintext to the renderer
- The UI only receives masked key values (e.g., `...abc123`)

**Environment Variable Names:**
- Anthropic: `ANTHROPIC_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Google: `GOOGLE_GENERATIVE_AI_KEY`

**Provider Test Endpoints:**
- For testing, use the most lightweight API call available for each provider to minimize quota usage
- Handle rate limits gracefully with appropriate error messages

**Assumptions Requiring Confirmation:**
- The three AI SDK packages (@ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google) are already installed
- The test connection calls can be made from the main process without CORS issues
