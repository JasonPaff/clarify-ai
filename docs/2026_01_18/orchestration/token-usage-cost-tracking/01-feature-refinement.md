# Step 1: Feature Request Refinement

## Metadata
- **Started**: 2026-01-18T00:01:00Z
- **Completed**: 2026-01-18T00:01:30Z
- **Status**: Completed
- **Duration**: ~30 seconds

## Original Request Summary
Token Usage & Cost Tracking Feature with:
- TokenLens integration for token counting and cost estimation
- Project-scoped tracking with per-operation logs
- UI integration: dedicated page, model selector hints, confirmation dialogs, post-operation footers
- Database schema for ai_usage_logs table

## Project Context Provided
- Electron + Next.js desktop app with TypeScript
- Drizzle ORM with SQLite, repository pattern
- TanStack Query for server state
- TanStack Form with useAppForm hook
- CVA for component variants
- IPC handlers for native operations

## Refined Feature Request

Implement a token usage and cost tracking feature that logs all AI operations (clarifications, repository overviews, and future AI features) with accurate token counting and USD cost estimation using the TokenLens library (v1.3.1) already installed in the project. Create a new `ai_usage_logs` table in the SQLite database with fields tracking the operation type, model provider and ID, input/output/total token counts, estimated USD cost, duration in milliseconds, success/failure status with optional error messages, timestamps, and associated project ID, following the project's standard schema pattern of integer primary key, createdAt, and updatedAt text fields. Integrate token capture into all AI handlers by extracting `result.usage` after streaming completes and logging to the database through a new repository pattern implementation in `db/repositories/`. Enhance the model selector component throughout the application with visual cost tier indicators (`$` / `$$` / `$$$`) that display actual `$/1K tokens` pricing on hover using tooltips. Add a pre-operation confirmation dialog component that shows estimated cost before users proceed with or cancel any AI generation request. Include a persistent footer below all generated content displaying the actual tokens consumed and final cost of the completed operation. Create a new dedicated usage page at route `/projects/[projectId]/usage` with a chronological table or list view of all logged operations per project, sorted by operation timestamp. Add a "Usage" navigation item to the sidebar for each project linking to this usage dashboard. Integrate TokenLens for accurate token counting across all supported models (Claude, OpenAI, Google) and USD cost estimation aligned with the Vercel AI SDK's usage fields. Structure the logging to capture per-operation records while supporting future aggregation queries for per-project rollups and time-based summaries (daily, weekly, monthly), with usage data retained indefinitely and no automatic pruning, ensuring both successful and failed operations are logged since they still consume tokens. All database operations should follow the repository pattern, IPC handlers in `electron/ipc/` should manage database access from the main process, TanStack Query hooks in `hooks/queries/` should handle data fetching with query key factories from `lib/queries/`, and form components should use the `useAppForm` hook with CVA-based styling consistent with existing project patterns.

## Validation
- **Format**: Single paragraph ✓
- **Length**: ~450 words (within 200-500 range) ✓
- **Intent Preserved**: Core feature scope maintained ✓
- **Technical Context**: Project patterns incorporated ✓
