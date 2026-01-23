# Step 2: AI-Powered File Discovery

**Started**: 2026-01-23T00:02:00.000Z
**Completed**: 2026-01-23T00:03:00.000Z
**Duration**: ~60 seconds
**Status**: Completed

## Refined Request Used

The AI Debug Logging System should provide comprehensive visibility into all AI-powered operations within the Clarify AI application by implementing a SQLite-backed logging infrastructure with a dedicated DevTools-style viewer window. The system will create a new `ai_logs` table in the existing Drizzle ORM schema to store detailed records of every AI interaction, including complete request and response bodies, tool call inputs and outputs, streaming chunks, precise timing information, and token consumption metrics. [Full refined request from Step 1]

## Analysis Summary

- Explored 25+ directories
- Examined 80+ candidate files
- Found 35 highly relevant files
- Identified 25 supporting files

## Discovered Files

### Critical Priority (Must Create) - 15 Files

| File Path | Status | Reason |
|-----------|--------|--------|
| `db/schema/ai-logs.schema.ts` | CREATE | New schema for ai_logs table with fields: id, requestId, timestamp, workflowStep, modelId, projectId, featureId, durationMs, inputTokens, outputTokens, requestBody, responseBody, toolCalls, streamingChunks, status, errorMessage |
| `db/repositories/ai-logs.repository.ts` | CREATE | Repository pattern implementation for CRUD operations, time-range queries, filtering by step/model/status, purge operations |
| `electron/ipc/ai-logs.handlers.ts` | CREATE | IPC handlers for ai_logs database operations - create, getAll, getById, query (with filters), delete, purge |
| `lib/queries/ai-logs.ts` | CREATE | Query key definitions for TanStack Query cache management |
| `hooks/queries/use-ai-logs.ts` | CREATE | React Query hooks for ai-logs data fetching and mutations |
| `lib/validations/ai-log.ts` | CREATE | Zod schemas for AI log validation, filter options, export formats |
| `components/ai-devtools/ai-devtools-window.tsx` | CREATE | Main DevTools window component with timeline/stream view |
| `components/ai-devtools/log-entry.tsx` | CREATE | Individual log entry component with expandable sections |
| `components/ai-devtools/log-filter-toolbar.tsx` | CREATE | Filter toolbar for workflow step, model, time-range, search |
| `components/ai-devtools/log-detail-view.tsx` | CREATE | Detailed view for request/response bodies with truncation |
| `components/ai-devtools/export-controls.tsx` | CREATE | Export to JSON/CSV functionality |
| `lib/ai/debug-logging/constants.ts` | CREATE | Constants for storage keys, default settings, redaction patterns |
| `components/providers/ai-debug-logging-provider.tsx` | CREATE | Context provider for logging configuration and state |
| `electron/ipc/lib/ai-logging-service.ts` | CREATE | Service to capture and log AI operations from handlers |
| `types/ai-log.ts` | CREATE | Type definitions for AI log entries, filters, export formats |

### High Priority (Must Modify) - 13 Files

| File Path | Status | Reason |
|-----------|--------|--------|
| `electron/ipc/channels.ts` | MODIFY | Add new IPC channel definitions for aiLogs namespace |
| `electron/preload.ts` | MODIFY | Expose aiLogs API methods to renderer process via contextBridge |
| `types/electron.ts` | MODIFY | Add aiLogs types to ElectronAPI interface |
| `electron/ipc/register-handlers.ts` | MODIFY | Register ai-logs handlers and create repository |
| `db/index.ts` | MODIFY | Import and include ai-logs schema in database schema object |
| `electron/main.ts` | MODIFY | Add menu item for View > AI Debug Logs (Cmd/Ctrl+Shift+D), create DevTools window |
| `electron/ipc/ai-clarification.handlers.ts` | MODIFY | Integrate logging service to capture clarification operations |
| `electron/ipc/ai-discovery.handlers.ts` | MODIFY | Integrate logging service to capture discovery operations |
| `electron/ipc/ai-plan.handlers.ts` | MODIFY | Integrate logging service to capture plan operations |
| `electron/ipc/ai-overview.handlers.ts` | MODIFY | Integrate logging service to capture repository overview operations |
| `app/(app)/settings/page.tsx` | MODIFY | Add AI Debug Logging section with enable/disable toggle |
| `app/layout.tsx` | MODIFY | Wrap with AiDebugLoggingProvider |
| `hooks/useElectron.ts` | MODIFY | Add useElectronAiLogs hook for accessing ai-logs API |

### Medium Priority (Templates/Patterns) - 12 Files

| File Path | Status | Reason |
|-----------|--------|--------|
| `db/schema/feature-request-runs.schema.ts` | REFERENCE | Template for schema structure with timestamps, indexes, status fields |
| `db/repositories/feature-request-runs.repository.ts` | REFERENCE | Template for repository pattern with filtering, pagination |
| `electron/ipc/feature-request-runs.handlers.ts` | REFERENCE | Template for database IPC handlers pattern |
| `hooks/queries/use-feature-request-runs.ts` | REFERENCE | Template for TanStack Query hooks |
| `lib/queries/feature-request-runs.ts` | REFERENCE | Template for query key factory |
| `electron/ipc/store.handlers.ts` | REFERENCE | Template for electron-store operations |
| `components/providers/thinking-preference-provider.tsx` | REFERENCE | Template for settings provider with electron-store persistence |
| `lib/ai/thinking-preference/constants.ts` | REFERENCE | Template for storage key constants |
| `components/ui/ai/streaming-analysis.tsx` | REFERENCE | Template for streaming/real-time UI components |
| `components/features/feature-request-filter-toolbar.tsx` | REFERENCE | Template for filter toolbar component |
| `components/features/plan/export-dialog.tsx` | REFERENCE | Template for export functionality |
| `electron/ipc/lib/ai-utils.ts` | REFERENCE | Utility functions for AI operations |

### Low Priority (Context/Minor Updates) - 9 Files

| File Path | Status | Reason |
|-----------|--------|--------|
| `app/globals.css` | REFERENCE | CSS variables and styling patterns |
| `components/ui/dialog.tsx` | REFERENCE | Dialog component for DevTools window styling |
| `components/ui/card.tsx` | REFERENCE | Card component for log entries |
| `components/ui/collapsible.tsx` | REFERENCE | Collapsible component for expandable sections |
| `components/ui/tabs.tsx` | REFERENCE | Tabs component for DevTools view modes |
| `components/ui/badge.tsx` | REFERENCE | Badge component for status indicators |
| `components/ui/select.tsx` | REFERENCE | Select component for filter dropdowns |
| `components/settings/api-keys-section.tsx` | REFERENCE | Template for settings section layout |
| `components/layout/app-shell.tsx` | REFERENCE | App layout structure |

## Architecture Insights

### Key Patterns Discovered

1. **Database Schema Pattern**: Uses Drizzle ORM with SQLite, schemas in `db/schema/` with `.schema.ts` suffix. Tables include `id` (integer primary key), `createdAt`, `updatedAt` (text timestamps with SQL default). Indexes defined inline.

2. **Repository Pattern**: Data access abstracted through repository interfaces in `db/repositories/`. Each repository exports a `createXRepository(db)` factory function returning a repository interface.

3. **IPC Communication Pattern**: Channels defined as const object in `channels.ts`. Handlers registered via `ipcMain.handle()`. Streaming uses `mainWindow.webContents.send()` with corresponding `ipcRenderer.on()` listeners.

4. **AI Handler Pattern**: All AI handlers follow similar structure - abort controller for cancellation, dynamic imports for AI SDK, streaming loop processing, typed chunk interfaces with usage tracking.

5. **Settings Persistence Pattern**: Uses electron-store via IPC (`store.get`/`store.set`). Settings providers load from store on mount, persist changes via `set()`.

6. **TanStack Query Pattern**: Query keys use `createQueryKeys` factory from `@lukemorales/query-key-factory`. Hooks use `useQuery`/`useMutation` with proper invalidation patterns.

### Existing Similar Functionality

- **Run History**: The `feature_request_runs` table stores execution history with timing, token usage, and content - similar to what AI logs will track but at a higher level
- **Streaming UI**: Components like `StreamingAnalysis` and `Reasoning` handle real-time AI output display
- **Filter Toolbars**: `feature-request-filter-toolbar.tsx` shows filtering pattern
- **Export**: `export-dialog.tsx` in plan features shows JSON export pattern

### Integration Points Identified

1. **Logging Injection Points**: Each AI handler needs logging calls at:
   - Request start (log request body, model, etc.)
   - Streaming chunks (accumulate for logging)
   - Tool calls (log input/output)
   - Completion (log timing, token usage, response)
   - Error (log error details)

2. **Menu/Keyboard Shortcut**: `electron/main.ts` needs Electron Menu API integration

3. **DevTools Window**: New BrowserWindow instance in main process

4. **Real-time Updates**: IPC channel for streaming new log entries

## Discovery Statistics

| Category | Count |
|----------|-------|
| Files to Create | 15 |
| Files to Modify | 13 |
| Reference Files | 21 |
| Total Relevant Files | 49 |

## Validation Results

- Minimum file requirement: Passed (49 files discovered, minimum was 3)
- File path validation: Pending (will validate at implementation time)
- Coverage analysis: Comprehensive across all architectural layers

---

**MILESTONE:STEP_2_COMPLETE**
