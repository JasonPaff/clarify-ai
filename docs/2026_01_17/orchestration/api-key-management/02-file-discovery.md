# Step 2: AI-Powered File Discovery

## Step Metadata

| Field      | Value                    |
| ---------- | ------------------------ |
| Start Time | 2026-01-17T00:02:00.000Z |
| End Time   | 2026-01-17T00:03:30.000Z |
| Duration   | ~90 seconds              |
| Status     | Completed                |

## Input

### Refined Feature Request

The API key management feature enables users to securely store and validate API keys for Claude (Anthropic), OpenAI, and Google AI providers that power the implementation planning workflow. Users should be able to add, update, test, and remove API keys through a dedicated form interface within the app settings, with sensitive keys masked in the UI for security. The system will support three layers of API key resolution: first checking for keys entered in the settings form (encrypted via Electron's safeStorage API for OS-level encryption using Keychain on macOS and Credential Manager on Windows), then falling back to environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_GENERATIVE_AI_KEY), and finally attempting to use the Vercel AI SDK's default behavior. Each API key entry should include a "Test Connection" button that validates the key by making a lightweight API call to the corresponding provider, providing immediate feedback on validity before persisting. The implementation will extend the existing settings page with an API Keys section containing a table of configured keys with provider badges, key type indicators (environment variable vs. user-provided), masked key display, and action buttons for edit and delete operations. A modal form will allow adding or editing keys with fields for provider selection, API key input with real-time masking, and optional notes. The feature will store user-provided keys in Electron store with encryption via safeStorage, separate from the Zod validation schemas used for other app forms. Error handling must gracefully inform users when API keys are invalid or when the connection test fails, and the system should prevent plan generation if required API keys are not configured or valid, guiding users to settings to complete the setup.

## Discovery Statistics

| Metric                   | Value |
| ------------------------ | ----- |
| Directories Explored     | 6     |
| Candidate Files Examined | 45+   |
| Critical Priority Files  | 5     |
| High Priority Files      | 4     |
| Medium Priority Files    | 10    |
| Low Priority Files       | 10    |
| New Files to Create      | 9     |

## Discovered Files

### Critical Priority (Must Modify)

| File Path                        | Relevance                                                                                         | Modification Required                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `app/(app)/settings/page.tsx`    | Settings page with placeholder "API key configuration coming soon" - main UI entry point          | Yes - replace placeholder with API keys section |
| `electron/ipc/store.handlers.ts` | Electron store handlers - currently has basic get/set/delete but needs encryption via safeStorage | Yes - add encrypted storage handlers            |
| `electron/ipc/channels.ts`       | IPC channels definition - needs new channels for API key operations and connection testing        | Yes - add apiKeys namespace                     |
| `types/electron.d.ts`            | ElectronAPI type definitions - needs types for API key operations                                 | Yes - add apiKeys interface                     |
| `electron/preload.ts`            | Context bridge implementation - needs to expose new API key methods                               | Yes - add apiKeys methods                       |

### High Priority (Likely Need Modification)

| File Path                           | Relevance                                                         | Modification Required             |
| ----------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| `electron/ipc/register-handlers.ts` | Handler registration - needs to register new API key handlers     | Yes - register apiKeys handlers   |
| `hooks/useElectron.ts`              | Electron hooks - needs new `useElectronApiKeys()` hook            | Yes - add API keys hook           |
| `electron/main.ts`                  | Main process entry - may need to import safeStorage from Electron | Likely - import safeStorage       |
| `lib/forms/form-hook.ts`            | Form hook configuration - may need additional field components    | Maybe - if new field types needed |

### Medium Priority (Reference/May Need Updates)

| File Path                               | Relevance                                                | Modification Required       |
| --------------------------------------- | -------------------------------------------------------- | --------------------------- |
| `components/ui/dialog.tsx`              | Dialog components for API key modal                      | Reference only              |
| `components/ui/button.tsx`              | Button component with variants                           | Reference only              |
| `components/ui/badge.tsx`               | Badge component - needs new variants for provider badges | Yes - add provider variants |
| `components/ui/icon-button.tsx`         | Icon button for edit/delete actions                      | Reference only              |
| `components/ui/card.tsx`                | Card components used in settings page                    | Reference only              |
| `components/ui/tooltip.tsx`             | Tooltip for masked key display                           | Reference only              |
| `components/ui/form/text-field.tsx`     | Text field for API key input (supports type="password")  | Reference only              |
| `components/ui/form/select-field.tsx`   | Select field for provider selection                      | Reference only              |
| `components/ui/form/textarea-field.tsx` | Textarea for optional notes                              | Reference only              |
| `components/ui/form/submit-button.tsx`  | Submit button for forms                                  | Reference only              |

### Low Priority (Pattern Reference Only)

| File Path                                               | Relevance                                           | Modification Required |
| ------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| `components/features/new-feature-request-dialog.tsx`    | Pattern for dialog + form integration               | Reference only        |
| `components/features/delete-feature-request-dialog.tsx` | Pattern for delete confirmation dialog              | Reference only        |
| `components/features/create-feature-request-form.tsx`   | Pattern for form with TanStack Form                 | Reference only        |
| `hooks/queries/use-projects.ts`                         | Pattern for TanStack Query hooks                    | Reference only        |
| `lib/queries/projects.ts`                               | Pattern for query key factories                     | Reference only        |
| `lib/validations/project.ts`                            | Pattern for Zod validation schemas                  | Reference only        |
| `lib/validations/feature-request.ts`                    | Pattern for form validation schemas                 | Reference only        |
| `components/ui/theme-selector.tsx`                      | Pattern for settings page UI components             | Reference only        |
| `types/component-types.ts`                              | Global type definitions                             | Reference only        |
| `lib/queries/index.ts`                                  | Query key merger - needs to include API key queries | Maybe                 |

## New Files to Create

| New File Path                                   | Purpose                                              |
| ----------------------------------------------- | ---------------------------------------------------- |
| `electron/ipc/api-keys.handlers.ts`             | IPC handlers for API key CRUD and connection testing |
| `components/settings/api-keys-section.tsx`      | Main API keys section component for settings page    |
| `components/settings/api-key-form.tsx`          | Form for adding/editing API keys                     |
| `components/settings/api-key-dialog.tsx`        | Dialog wrapper for API key form                      |
| `components/settings/api-key-table.tsx`         | Table displaying configured API keys                 |
| `components/settings/delete-api-key-dialog.tsx` | Confirmation dialog for deleting API keys            |
| `lib/validations/api-key.ts`                    | Zod validation schemas for API key forms             |
| `hooks/queries/use-api-keys.ts`                 | TanStack Query hooks for API key operations          |
| `lib/queries/api-keys.ts`                       | Query key factory for API keys                       |

## Architecture Insights

### Existing Patterns Discovered

1. **IPC Communication Pattern**: All Electron operations go through typed IPC channels defined in `channels.ts`, implemented in domain-specific handlers, and exposed via the preload script.

2. **Form Pattern**: Forms use TanStack Form via `useAppForm` hook with Zod validation schemas. Forms are separated from dialogs.

3. **Dialog Pattern**: Dialogs use `DialogRoot` from Base UI with controlled `open` state. Consistent structure: Trigger, Portal, Backdrop, Popup with Title, Description, and content.

4. **Hook Pattern**: React hooks for Electron operations wrap the raw API with null checks and return typed results.

5. **Query Pattern**: TanStack Query with query key factories from `@lukemorales/query-key-factory`. Mutations invalidate relevant query keys on success.

6. **Badge Variants**: Existing badge component has status-based variants that can be extended for provider badges.

### Key Integration Points

1. **Store Handlers**: Existing `store.handlers.ts` uses plain `electron-store` without encryption. For API keys, need to use `safeStorage.encryptString()` and `safeStorage.decryptString()` from Electron.

2. **Environment Variable Fallback**: Need to implement resolution chain: encrypted store -> environment variables -> Vercel AI SDK default.

3. **Connection Testing**: Need handlers that make lightweight API calls to validate keys:
   - Anthropic: `POST /v1/messages` with minimal payload
   - OpenAI: `GET /v1/models`
   - Google AI: Similar lightweight endpoint

4. **Settings Page**: Existing placeholder at line 17-44 in `settings/page.tsx` should be replaced with the API keys section component.

## File Validation Results

| File                                | Exists | Accessible |
| ----------------------------------- | ------ | ---------- |
| `app/(app)/settings/page.tsx`       | ✅     | ✅         |
| `electron/ipc/store.handlers.ts`    | ✅     | ✅         |
| `electron/ipc/channels.ts`          | ✅     | ✅         |
| `types/electron.d.ts`               | ✅     | ✅         |
| `electron/preload.ts`               | ✅     | ✅         |
| `electron/ipc/register-handlers.ts` | ✅     | ✅         |
| `hooks/useElectron.ts`              | ✅     | ✅         |
| `electron/main.ts`                  | ✅     | ✅         |
| `components/ui/badge.tsx`           | ✅     | ✅         |
| `components/ui/dialog.tsx`          | ✅     | ✅         |
| `components/ui/button.tsx`          | ✅     | ✅         |

---

**MILESTONE:STEP_2_COMPLETE**
