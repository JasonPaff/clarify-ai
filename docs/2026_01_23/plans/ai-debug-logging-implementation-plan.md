# AI Debug Logging System - Implementation Plan

**Generated**: 2026-01-23
**Original Request**: AI Debug Logging System - Extensive logging for all AI-powered actions with a DevTools-style viewer window
**Complexity**: High
**Risk Level**: Medium

---

## Overview

**Estimated Duration**: 30 implementation steps
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

- Build a SQLite-backed logging infrastructure with a new `ai_logs` table to capture all AI operations including requests, responses, tool calls, streaming chunks, timing, and token metrics
- Implement a DevTools-style Electron window accessible via View menu (Cmd/Ctrl+Shift+D) displaying real-time log entries in a timeline view with filtering, search, and export capabilities
- Create an AI logging service that integrates with existing AI handlers to capture operations at streaming points
- Add configuration options to the Settings page for enabling/disabling logging with sensible defaults (enabled in development, disabled in production)
- Implement automatic sensitive data redaction and large content truncation for security and performance

## Prerequisites

- [ ] Existing database infrastructure with Drizzle ORM and SQLite is functioning
- [ ] AI handlers (`ai-clarification.handlers.ts`, `ai-discovery.handlers.ts`, `ai-plan.handlers.ts`, `ai-overview.handlers.ts`) are operational
- [ ] Electron IPC channel registration pattern is established
- [ ] TanStack Query and React Query providers are configured

## Implementation Steps

### Step 1: Create AI Log Type Definitions

**What**: Define TypeScript types for AI log entries, workflow steps, and configuration
**Why**: Establishes the type foundation that all other components will build upon
**Confidence**: High

**Files to Create:**
- `types/ai-log.ts` - Type definitions for AI logs

**Changes:**
- Define `AiLogWorkflowStep` type union for 'discovery' | 'clarification' | 'planning' | 'overview'
- Define `AiLogStatus` type for 'pending' | 'streaming' | 'completed' | 'failed'
- Define `AiLogEntry` interface with fields: id, requestId, workflowStep, modelId, status, timestamps, tokens, duration, request/response bodies, tool calls
- Define `AiLogToolCall` interface for tool invocation tracking
- Define `AiLogStreamChunk` interface for streaming chunk records
- Define `AiLogConfig` interface for logging configuration settings
- Define filter and query parameter types for the DevTools viewer

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All type definitions compile without errors
- [ ] Types cover all required log metadata fields
- [ ] All validation commands pass

---

### Step 2: Create Database Schema for AI Logs

**What**: Define the Drizzle ORM schema for the `ai_logs` table with all required columns and indexes
**Why**: Provides persistent storage for AI operation logs with efficient querying capabilities
**Confidence**: High

**Files to Create:**
- `db/schema/ai-logs.schema.ts` - Drizzle schema definition

**Changes:**
- Create `aiLogs` table with columns: id (primary key), requestId (text, unique), workflowStep, modelId, status, createdAt, startedAt, completedAt, durationMs, inputTokens, outputTokens, reasoningTokens, requestBody (text/JSON), responseBody (text/JSON), toolCalls (text/JSON), streamChunks (text/JSON), errorMessage, featureRequestId (optional FK), projectId (optional FK)
- Add indexes on: workflowStep, modelId, createdAt, status, featureRequestId, projectId
- Export `AiLog` and `NewAiLog` types using `$inferSelect` and `$inferInsert`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schema compiles without TypeScript errors
- [ ] Schema follows existing patterns from `feature-request-runs.schema.ts`
- [ ] All validation commands pass

---

### Step 3: Update Database Index to Include AI Logs Schema

**What**: Register the new AI logs schema in the database initialization
**Why**: Ensures the schema is available for migrations and queries
**Confidence**: High

**Files to Modify:**
- `db/index.ts` - Add AI logs schema import and registration

**Changes:**
- Import `aiLogsSchema` from `./schema/ai-logs.schema`
- Add to the combined schema object spread

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Database initialization includes AI logs schema
- [ ] No import or type errors
- [ ] All validation commands pass

---

### Step 4: Generate Database Migration

**What**: Generate SQL migration for the new `ai_logs` table
**Why**: Creates the actual database table structure
**Confidence**: High

**Changes:**
- Run migration generation command
- Migration will be applied automatically on app start

**Validation Commands:**
```bash
pnpm run db:generate
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Migration file generated in `drizzle/` directory
- [ ] Migration SQL contains CREATE TABLE statement with all columns
- [ ] Migration SQL contains CREATE INDEX statements
- [ ] All validation commands pass

---

### Step 5: Create AI Logs Repository

**What**: Implement repository pattern for AI logs database operations
**Why**: Provides clean abstraction for CRUD operations and complex queries
**Confidence**: High

**Files to Create:**
- `db/repositories/ai-logs.repository.ts` - Repository implementation

**Changes:**
- Define `AiLogsRepository` interface with methods: create, update, delete, getById, getByRequestId, getByWorkflowStep, getByModelId, getByTimeRange, getByFeatureRequestId, getByProjectId, query (with filtering), purgeOlderThan, getCount, getLatest
- Implement `createAiLogsRepository` factory function following existing pattern
- Include query builder for complex filtering (step, model, time range, status)
- Implement purge method for retention policy enforcement

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Repository follows pattern from `feature-request-runs.repository.ts`
- [ ] All CRUD operations implemented
- [ ] Query filtering supports all required filters
- [ ] All validation commands pass

---

### Step 6: Create Debug Logging Constants and Configuration

**What**: Define constants, default settings, and storage keys for the debug logging system
**Why**: Centralizes configuration values and provides type-safe defaults
**Confidence**: High

**Files to Create:**
- `lib/ai/debug-logging/constants.ts` - Constants and defaults

**Changes:**
- Define `AI_DEBUG_LOGGING_STORAGE_KEY` for electron-store persistence
- Define `DEFAULT_AI_DEBUG_LOGGING_CONFIG` with enabled based on NODE_ENV
- Define retention policy defaults (max entries, max age in ms)
- Define truncation thresholds for large content display
- Define sensitive data patterns for redaction (API keys, tokens)
- Export workflow step display names mapping

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Constants follow pattern from `thinking-preference/constants.ts`
- [ ] Sensible defaults configured (enabled in dev, disabled in prod)
- [ ] All validation commands pass

---

### Step 7: Add IPC Channel Definitions for AI Logs

**What**: Define IPC channel constants for AI logs operations
**Why**: Enables typed communication between main and renderer processes
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add aiLogs channels

**Changes:**
- Add `aiLogs` object under `db` namespace with channels: create, update, delete, getById, getByRequestId, query, purge, getCount, getLatest
- Add `aiDebugLogging` object at root level with channels: getConfig, setConfig, openWindow

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Channel names follow existing naming convention
- [ ] All CRUD and query operations have channels defined
- [ ] Config and window channels defined
- [ ] All validation commands pass

---

### Step 8: Create AI Logs IPC Handlers

**What**: Implement IPC handlers for AI logs database operations and configuration
**Why**: Bridges renderer process requests to database operations
**Confidence**: High

**Files to Create:**
- `electron/ipc/ai-logs.handlers.ts` - IPC handlers

**Changes:**
- Import required types and repository
- Create `registerAiLogsHandlers` function accepting repository
- Implement handlers for: create, update, delete, getById, getByRequestId, query (with filter params), purge, getCount, getLatest
- Implement getConfig handler reading from electron-store
- Implement setConfig handler writing to electron-store
- Implement openWindow handler to create/focus DevTools window

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handlers follow pattern from `feature-request-runs.handlers.ts`
- [ ] All database operations properly delegated to repository
- [ ] Config operations use electron-store
- [ ] All validation commands pass

---

### Step 9: Register AI Logs Handlers and Update Preload

**What**: Register the AI logs handlers and expose API to renderer
**Why**: Completes the IPC bridge for AI logs functionality
**Confidence**: High

**Files to Modify:**
- `electron/ipc/register-handlers.ts` - Register AI logs handlers
- `electron/preload.ts` - Expose aiLogs and aiDebugLogging APIs
- `types/electron.ts` - Add types to ElectronAPI interface

**Changes:**
- In `register-handlers.ts`: Import and call `registerAiLogsHandlers` with repository
- In `preload.ts`: Add `aiLogs` object under `db` with all CRUD methods, add `aiDebugLogging` object with config and window methods
- In `types/electron.ts`: Add type definitions for new API surfaces, re-export AI log types

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handlers registered in correct order with dependencies
- [ ] Preload exposes all required methods
- [ ] TypeScript types match preload implementation
- [ ] All validation commands pass

---

### Step 10: Create AI Logging Service

**What**: Implement the core service that captures AI operations and writes logs
**Why**: Provides the integration point for AI handlers to log their operations
**Confidence**: High

**Files to Create:**
- `electron/ipc/lib/ai-logging-service.ts` - Logging service

**Changes:**
- Create `AiLoggingService` class with methods: startOperation, recordStreamChunk, recordToolCall, recordToolResult, completeOperation, failOperation
- Implement request ID generation (UUID)
- Implement sensitive data redaction using patterns from constants
- Implement batched chunk recording for performance
- Manage active operations map for tracking in-flight requests
- Accept repository instance in constructor for database writes
- Include config checking to skip logging when disabled

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Service provides clean API for logging AI operations
- [ ] Sensitive data properly redacted before storage
- [ ] Batching prevents excessive database writes during streaming
- [ ] All validation commands pass

---

### Step 11: Integrate Logging Service into AI Handlers

**What**: Add logging calls to existing AI handlers at key operation points
**Why**: Captures actual AI operations as they occur
**Confidence**: Medium

**Files to Modify:**
- `electron/ipc/ai-clarification.handlers.ts` - Add logging
- `electron/ipc/ai-discovery.handlers.ts` - Add logging
- `electron/ipc/ai-plan.handlers.ts` - Add logging
- `electron/ipc/ai-overview.handlers.ts` - Add logging

**Changes:**
- Import logging service in each handler file
- Call `startOperation` at the beginning of generate handlers with request details
- Call `recordStreamChunk` for text-delta and reasoning-delta events
- Call `recordToolCall` for tool-call events
- Call `recordToolResult` for tool-result events
- Call `completeOperation` on successful finish with usage stats
- Call `failOperation` on errors with error message
- Pass logging service instance from handler registration

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All four AI handlers instrumented with logging
- [ ] Logging calls placed at appropriate stream processing points
- [ ] Error cases properly captured
- [ ] All validation commands pass

---

### Step 12: Create Zod Validation Schemas for AI Logs

**What**: Define Zod schemas for AI log data validation
**Why**: Ensures data integrity for queries and mutations
**Confidence**: High

**Files to Create:**
- `lib/validations/ai-log.ts` - Validation schemas

**Changes:**
- Create `aiLogWorkflowStepSchema` enum validation
- Create `aiLogStatusSchema` enum validation
- Create `aiLogFilterSchema` for query parameters (step, model, timeRange, status, search)
- Create `aiLogConfigSchema` for settings validation
- Export inferred types from schemas

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Schemas follow pattern from `feature-request.ts`
- [ ] All filter options validated
- [ ] Config schema matches constants defaults
- [ ] All validation commands pass

---

### Step 13: Create Query Key Definitions for AI Logs

**What**: Define TanStack Query key factory for AI logs
**Why**: Enables organized cache management for AI log queries
**Confidence**: High

**Files to Create:**
- `lib/queries/ai-logs.ts` - Query keys

**Changes:**
- Create `aiLogKeys` using `createQueryKeys` from `@lukemorales/query-key-factory`
- Define keys for: list (with filters), detail (by id), byRequestId, count, latest, config
- Follow existing pattern from `feature-request-runs.ts`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Query keys follow established pattern
- [ ] Keys support all required query variations
- [ ] All validation commands pass

---

### Step 14: Create React Query Hooks for AI Logs

**What**: Implement TanStack Query hooks for AI logs data fetching
**Why**: Provides React components with data access
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-ai-logs.ts` - Query hooks

**Changes:**
- Create `useAiLogs` hook for filtered log list
- Create `useAiLog` hook for single log by ID
- Create `useAiLogByRequestId` hook
- Create `useAiLogsCount` hook
- Create `useLatestAiLogs` hook with limit parameter
- Create `useDeleteAiLog` mutation hook
- Create `usePurgeAiLogs` mutation hook
- Create `useAiDebugLoggingConfig` hook for settings

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Hooks follow pattern from `use-feature-request-runs.ts`
- [ ] Proper cache invalidation on mutations
- [ ] Config hook uses electron-store
- [ ] All validation commands pass

---

### Step 15: Add useElectronAiLogs Hook

**What**: Create Electron API wrapper hook for AI logs operations
**Why**: Provides consistent API access pattern for renderer components
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Add AI logs hook

**Changes:**
- Add `useElectronAiLogs` function following existing `useElectronDb` pattern
- Expose all database methods: create, update, delete, getById, getByRequestId, query, purge, getCount, getLatest
- Add `useElectronAiDebugLogging` function for config and window operations

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Hook follows established pattern
- [ ] All methods properly wrapped with null checks
- [ ] All validation commands pass

---

### Step 16: Create AI Debug Logging Context Provider

**What**: Implement React context provider for debug logging configuration
**Why**: Makes logging config available throughout the app with persistence
**Confidence**: High

**Files to Create:**
- `components/providers/ai-debug-logging-provider.tsx` - Context provider

**Changes:**
- Create `AiDebugLoggingContext` with config state and setters
- Create `AiDebugLoggingProvider` component following `thinking-preference-provider.tsx` pattern
- Load config from electron-store on mount
- Persist config changes to electron-store
- Export `useAiDebugLogging` hook for consuming the context
- Handle loading state to prevent flash

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Provider follows existing pattern
- [ ] Config properly loaded and persisted
- [ ] Loading state handled
- [ ] All validation commands pass

---

### Step 17: Create Log Entry Component

**What**: Build the individual log entry display component
**Why**: Renders a single log entry with expandable details
**Confidence**: High

**Files to Create:**
- `components/ai-devtools/log-entry.tsx` - Log entry component

**Changes:**
- Create `LogEntry` component with props for log data and expansion state
- Display summary line: timestamp, workflow step badge, model badge, status indicator, duration
- Implement expandable sections for: request body, response body, tool calls, stream chunks
- Add "Show more/less" buttons for truncated content
- Implement copy-to-clipboard for individual fields
- Apply sensitive data masking in display (not storage)
- Use CVA for variant-based styling (status colors, step badges)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Component follows project component conventions
- [ ] Expandable sections work correctly
- [ ] Copy functionality implemented
- [ ] All validation commands pass

---

### Step 18: Create Log Filter Toolbar Component

**What**: Build the filter toolbar for the DevTools viewer
**Why**: Enables users to filter and search logs
**Confidence**: High

**Files to Create:**
- `components/ai-devtools/log-filter-toolbar.tsx` - Filter toolbar

**Changes:**
- Create `LogFilterToolbar` component with filter state management
- Add workflow step multi-select filter (Discovery, Clarification, Planning, Overview)
- Add model filter dropdown
- Add time range picker (last hour, last 24h, last 7 days, custom)
- Add status filter (pending, streaming, completed, failed)
- Add full-text search input with debounce
- Add clear filters button
- Emit filter changes via callback prop

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All filter types implemented
- [ ] Search has appropriate debounce
- [ ] Filters properly cleared
- [ ] All validation commands pass

---

### Step 19: Create Log Detail View Component

**What**: Build the detailed view panel for a selected log entry
**Why**: Shows full log information with proper formatting
**Confidence**: High

**Files to Create:**
- `components/ai-devtools/log-detail-view.tsx` - Detail view

**Changes:**
- Create `LogDetailView` component for full log display
- Show all metadata: request ID, timestamps, duration, token counts
- Display request body with JSON formatting and syntax highlighting
- Display response body with truncation and "Show more" for large content
- Display tool calls in timeline format with inputs and outputs
- Display stream chunks (collapsed by default due to volume)
- Add copy-all button for entire log entry

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] JSON properly formatted and highlighted
- [ ] Large content handled with truncation
- [ ] Tool calls displayed in readable format
- [ ] All validation commands pass

---

### Step 20: Create Export Controls Component

**What**: Build export and management controls for logs
**Why**: Enables users to export, copy, and purge logs
**Confidence**: High

**Files to Create:**
- `components/ai-devtools/export-controls.tsx` - Export controls

**Changes:**
- Create `ExportControls` component with export functionality
- Implement Export to JSON button (full log data)
- Implement Export to CSV button (summary data)
- Add Copy Selected button for multi-select
- Add Clear All button with confirmation dialog
- Add Purge Old Logs button with retention policy selector
- Use native file save dialog for exports

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] JSON export includes all log data
- [ ] CSV export properly formatted
- [ ] Confirmation required for destructive actions
- [ ] All validation commands pass

---

### Step 21: Create Main DevTools Window Component

**What**: Build the main DevTools window layout combining all viewer components
**Why**: Provides the complete DevTools experience
**Confidence**: High

**Files to Create:**
- `components/ai-devtools/ai-devtools-window.tsx` - Main window

**Changes:**
- Create `AiDevtoolsWindow` component as main layout
- Include filter toolbar at top
- Include log list with virtual scrolling for performance
- Include detail panel (split view or drawer)
- Include export controls in toolbar
- Implement real-time updates using TanStack Query refetching
- Add log count display
- Handle empty state with helpful message
- Implement keyboard navigation (up/down arrows, enter to expand)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All sub-components properly composed
- [ ] Virtual scrolling handles large log volumes
- [ ] Real-time updates working
- [ ] All validation commands pass

---

### Step 22: Add DevTools Window to Electron Main Process

**What**: Create the DevTools window management in Electron main process
**Why**: Opens the DevTools as a separate Electron window
**Confidence**: High

**Files to Modify:**
- `electron/main.ts` - Add window creation and menu

**Changes:**
- Add `devToolsWindow` variable to track window instance
- Create `createDevToolsWindow` function with appropriate window config
- Add View menu to application menu bar
- Add "AI Debug Logs" menu item with Cmd/Ctrl+Shift+D accelerator
- Handle window close to clear reference
- Implement focus-or-create behavior for menu item
- Load DevTools route in the window

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] View menu added with correct accelerator
- [ ] Window opens at correct size
- [ ] Keyboard shortcut works
- [ ] All validation commands pass

---

### Step 23: Create DevTools Page Route

**What**: Add Next.js page route for the DevTools window content
**Why**: Provides the page that loads in the DevTools window
**Confidence**: High

**Files to Create:**
- `app/devtools/page.tsx` - DevTools page
- `app/devtools/layout.tsx` - DevTools layout

**Changes:**
- Create minimal layout without app shell (DevTools is standalone)
- Create page that renders `AiDevtoolsWindow` component
- Include necessary providers (Query, Theme)
- Style appropriately for standalone window

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Route loads correctly in standalone window
- [ ] Required providers included
- [ ] Page renders DevTools component
- [ ] All validation commands pass

---

### Step 25: Add Debug Logging Settings to Settings Page

**What**: Add debug logging configuration section to the app settings
**Why**: Allows users to enable/disable logging and configure retention
**Confidence**: High

**Files to Modify:**
- `app/(app)/settings/page.tsx` - Add debug logging section

**Changes:**
- Import `useAiDebugLogging` hook
- Add new Card section for "Developer Tools"
- Add toggle switch for "Enable AI Debug Logging"
- Add description explaining logging behavior
- Add retention settings (max entries, max age)
- Add "Open Debug Logs" button to launch DevTools window
- Add "Clear All Logs" button with confirmation

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Settings section follows existing page patterns
- [ ] Toggle properly controls logging enabled state
- [ ] Open button launches DevTools window
- [ ] All validation commands pass

---

### Step 26: Wrap App with Debug Logging Provider

**What**: Add the debug logging provider to the app's provider hierarchy
**Why**: Makes logging config available throughout the application
**Confidence**: High

**Files to Modify:**
- `app/layout.tsx` - Add provider

**Changes:**
- Import `AiDebugLoggingProvider`
- Wrap existing providers with `AiDebugLoggingProvider`
- Place after `ThinkingPreferenceProvider` in hierarchy

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Provider added without breaking existing providers
- [ ] Provider hierarchy maintained
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Database migration generates without errors
- [ ] Gemini Code Review Step 10 passes (database/IPC infrastructure)
- [ ] Gemini Code Review Step 17 passes (hooks/queries)
- [ ] Gemini Code Review Step 26 passes (UI components)
- [ ] Final Gemini Code Review Step 30 passes (`/gemini-review`)
- [ ] Application builds successfully with `pnpm run build`
- [ ] Manual verification of logging flow
- [ ] Manual verification of DevTools window functionality

## Notes

- **Performance Consideration**: The logging service uses batching for stream chunks to prevent excessive database writes during streaming operations. Consider configurable batch sizes if performance issues arise.

- **Security**: Sensitive data redaction patterns should be reviewed and expanded based on actual API key formats used by configured providers. The current implementation uses regex patterns for common formats.

- **Retention Policy**: Default retention limits should be generous enough for debugging but prevent unbounded growth. Recommend 1000 entries or 7 days as starting defaults.

- **Window Management**: The DevTools window is a separate Electron BrowserWindow to allow viewing logs while the main window is focused on other tasks. Consider persisting window position/size preferences.

- **Real-time Updates**: Log list uses TanStack Query with refetchInterval for real-time updates. Consider WebSocket or IPC-based push updates if polling creates performance issues.

- **Export Format**: JSON export includes full log data for debugging. CSV export includes summary fields only (id, timestamp, step, model, status, duration, tokens) for spreadsheet analysis.

---

## File Summary

### Files to Create (15)

| File | Purpose |
|------|---------|
| `types/ai-log.ts` | Type definitions |
| `db/schema/ai-logs.schema.ts` | Database schema |
| `db/repositories/ai-logs.repository.ts` | Repository pattern |
| `lib/ai/debug-logging/constants.ts` | Constants and config |
| `electron/ipc/ai-logs.handlers.ts` | IPC handlers |
| `electron/ipc/lib/ai-logging-service.ts` | Logging service |
| `lib/validations/ai-log.ts` | Zod schemas |
| `lib/queries/ai-logs.ts` | Query keys |
| `hooks/queries/use-ai-logs.ts` | Query hooks |
| `components/providers/ai-debug-logging-provider.tsx` | Context provider |
| `components/ai-devtools/log-entry.tsx` | Log entry component |
| `components/ai-devtools/log-filter-toolbar.tsx` | Filter toolbar |
| `components/ai-devtools/log-detail-view.tsx` | Detail view |
| `components/ai-devtools/export-controls.tsx` | Export controls |
| `components/ai-devtools/ai-devtools-window.tsx` | Main window |
| `app/devtools/page.tsx` | DevTools page |
| `app/devtools/layout.tsx` | DevTools layout |

### Files to Modify (13)

| File | Changes |
|------|---------|
| `db/index.ts` | Add schema import |
| `electron/ipc/channels.ts` | Add channel definitions |
| `electron/ipc/register-handlers.ts` | Register handlers |
| `electron/preload.ts` | Expose APIs |
| `types/electron.ts` | Add types |
| `electron/main.ts` | Add menu and window |
| `electron/ipc/ai-clarification.handlers.ts` | Add logging |
| `electron/ipc/ai-discovery.handlers.ts` | Add logging |
| `electron/ipc/ai-plan.handlers.ts` | Add logging |
| `electron/ipc/ai-overview.handlers.ts` | Add logging |
| `hooks/useElectron.ts` | Add hooks |
| `app/(app)/settings/page.tsx` | Add settings section |
| `app/layout.tsx` | Add provider |
