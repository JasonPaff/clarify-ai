# Token Usage and Cost Tracking - Implementation Plan

**Generated**: 2026-01-18
**Original Request**: Token Usage & Cost Tracking Feature
**Complexity**: High | **Risk**: Medium | **Duration**: 3-4 days

---

## Overview

Implement comprehensive token usage and cost tracking for all AI operations by creating a new database schema for usage logs, integrating token capture into AI handlers via Vercel AI SDK's `usage` promise, adding model pricing data with cost tier indicators to the UI, and building a dedicated usage dashboard page per project with pre-operation cost confirmations and post-operation usage footers.

## Quick Summary

- Create `ai_usage_logs` database table to track all AI operations
- Integrate TokenLens for accurate token counting and cost estimation
- Add cost tier indicators ($ / $$ / $$$) to model selector with pricing tooltips
- Show confirmation dialog with estimated cost before AI operations
- Display usage footer with actual tokens/cost after operations complete
- Build dedicated usage dashboard page per project
- Track both successful and failed operations

## Prerequisites

- [ ] Verify TokenLens v1.3.1 is installed (confirmed in package.json)
- [ ] Understand Vercel AI SDK's `result.usage` promise pattern for token extraction
- [ ] Review existing AI handler patterns in `electron/ipc/ai-clarification.handlers.ts` and `electron/ipc/ai-overview.handlers.ts`

---

## Implementation Steps

### Step 1: Create AI Usage Logs Database Schema

**What**: Create the `ai_usage_logs` table schema following existing Drizzle ORM patterns with all required fields for tracking token usage, costs, and operation metadata.

**Why**: The database schema is the foundation for all usage tracking functionality and must be created first.

**Confidence**: High

**Files**:
- `db/schema/ai-usage-logs.schema.ts` (NEW)

**Changes**:
- Define `aiUsageLogs` table with fields: id (integer primary key), projectId (integer, foreign key to projects, nullable), operationType (text), modelProvider (text), modelId (text), inputTokens (integer), outputTokens (integer), totalTokens (integer), estimatedCostUsd (real), durationMs (integer), success (boolean), errorMessage (text, nullable), createdAt (text), updatedAt (text)
- Add indexes on projectId, operationType, createdAt for efficient querying
- Export `AiUsageLog` and `NewAiUsageLog` types using `$inferSelect` and `$inferInsert`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schema file compiles without TypeScript errors
- [ ] Schema follows existing patterns from `projects.schema.ts`
- [ ] All required fields are defined with appropriate types

---

### Step 2: Update Database Index and Generate Migration

**What**: Import the new schema into the database index file and generate the database migration.

**Why**: The schema must be registered with Drizzle and migrated to the database before it can be used.

**Confidence**: High

**Files**:
- `db/index.ts` (MODIFY)

**Changes**:
- Add import for `aiUsageLogsSchema` from `./schema/ai-usage-logs.schema`
- Spread `aiUsageLogsSchema` into the `schema` object

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck && pnpm db:generate
```

**Success Criteria**:
- [ ] Migration file generated in `drizzle/` directory
- [ ] Schema properly included in database initialization

---

### Step 3: Create AI Usage Logs Repository

**What**: Implement the repository pattern for AI usage logs with CRUD operations and aggregation queries.

**Why**: Following the existing repository pattern ensures consistent data access patterns and clean separation of concerns.

**Confidence**: High

**Files**:
- `db/repositories/ai-usage-logs.repository.ts` (NEW)

**Changes**:
- Define `AiUsageLogsRepository` interface with methods: `create`, `getByProjectId`, `getByProjectIdPaginated`, `deleteByProjectId`, `getTotalsByProjectId`, `getRecentByProjectId`
- Implement `createAiUsageLogsRepository` factory function following patterns from `projects.repository.ts`
- Add aggregation query for per-project totals (total tokens, total cost)
- Add time-based filtering support for future daily/weekly/monthly summaries

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Repository interface and implementation complete
- [ ] Follows existing repository patterns

---

### Step 4: Add IPC Channel Constants for AI Usage Logs

**What**: Add IPC channel constants for the new AI usage logs handlers.

**Why**: All IPC communication must use defined channel constants for type safety and consistency.

**Confidence**: High

**Files**:
- `electron/ipc/channels.ts` (MODIFY)

**Changes**:
- Add `aiUsageLogs` object under `db` namespace with channels: `create`, `getByProjectId`, `delete`, `getTotalsByProjectId`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Channel constants follow existing naming patterns

---

### Step 5: Create AI Usage Logs IPC Handlers

**What**: Implement IPC handlers for AI usage logs database operations.

**Why**: Database operations must run in the Electron main process and be exposed via IPC.

**Confidence**: High

**Files**:
- `electron/ipc/ai-usage-logs.handlers.ts` (NEW)

**Changes**:
- Implement `registerAiUsageLogsHandlers` function following pattern from `projects.handlers.ts`
- Add handlers for create, getByProjectId, delete, getTotalsByProjectId operations
- Export handler registration function

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Handlers follow existing patterns
- [ ] All CRUD operations implemented

---

### Step 6: Register AI Usage Logs Handlers

**What**: Register the new AI usage logs handlers in the handler registration file.

**Why**: Handlers must be registered for IPC communication to work.

**Confidence**: High

**Files**:
- `electron/ipc/register-handlers.ts` (MODIFY)

**Changes**:
- Import `createAiUsageLogsRepository` from repository file
- Import `registerAiUsageLogsHandlers` from handlers file
- Instantiate repository and call registration function in `registerAllHandlers`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Handlers properly registered
- [ ] No circular dependency issues

---

### Step 7: Update Electron Preload Script and Type Definitions

**What**: Expose AI usage logs methods via the Electron context bridge and update TypeScript type definitions.

**Why**: Renderer process needs typed access to the new IPC methods.

**Confidence**: High

**Files**:
- `electron/preload.ts` (MODIFY)
- `types/electron.d.ts` (MODIFY)

**Changes**:
- Add `aiUsageLogs` object to `electronAPI.db` with typed methods matching the handlers
- Add type definitions in `electron.d.ts` for the new methods
- Export `AiUsageLog` and `NewAiUsageLog` types for renderer use

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Preload script exposes all new methods
- [ ] Type definitions match handler signatures

---

### Step 8: Update useElectronDb Hook

**What**: Add AI usage logs methods to the useElectronDb hook.

**Why**: React components access database operations through this hook.

**Confidence**: High

**Files**:
- `hooks/useElectron.ts` (MODIFY)

**Changes**:
- Add `aiUsageLogs` useMemo block with typed methods following existing patterns
- Include methods: create, getByProjectId, delete, getTotalsByProjectId
- Add to return object

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Hook provides typed access to all usage log operations
- [ ] Follows existing patterns in the file

---

### Step 9: Create Model Pricing Data

**What**: Add comprehensive pricing information for all supported AI models with cost tier classifications.

**Why**: Cost estimation and tier indicators require accurate per-model pricing data.

**Confidence**: Medium (pricing may need verification)

**Files**:
- `lib/ai/pricing.ts` (NEW)
- `lib/ai/models.ts` (MODIFY)

**Changes**:
- Define `ModelPricing` interface with inputCostPer1k, outputCostPer1k fields (USD)
- Create `MODEL_PRICING` constant mapping model IDs to pricing
- Define `CostTier` type ('$' | '$$' | '$$$') and `getCostTier` function based on average cost
- Add `estimateCost` function to calculate USD from token counts
- Add `formatCost` function for display formatting
- Extend `AIModel` interface in models.ts to include optional pricing reference

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Pricing data for all models in AI_MODELS
- [ ] Cost tier classification logic implemented
- [ ] Cost estimation and formatting utilities complete

---

### Step 10: Create TokenLens Integration Utility

**What**: Create utility functions that integrate TokenLens for accurate token counting.

**Why**: TokenLens provides more accurate token counts than estimates, especially for different model tokenizers.

**Confidence**: Medium (depends on TokenLens API)

**Files**:
- `lib/ai/token-counting.ts` (NEW)

**Changes**:
- Import TokenLens library
- Create `countTokens` function that uses TokenLens to count tokens for a given text and model
- Create `estimateInputTokens` function for pre-operation estimates
- Handle fallback to Vercel AI SDK usage when TokenLens unavailable
- Export utility functions for use in handlers and UI

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] TokenLens properly integrated
- [ ] Fallback mechanism in place

---

### Step 11: Update AI Clarification Handler with Token Capture

**What**: Modify the AI clarification handler to capture and log token usage after streaming completes.

**Why**: This is one of the two existing AI handlers that needs usage tracking.

**Confidence**: High

**Files**:
- `electron/ipc/ai-clarification.handlers.ts` (MODIFY)

**Changes**:
- Accept `AiUsageLogsRepository` as parameter to `registerAiClarificationHandlers`
- Capture start time at beginning of operation
- After stream completes, await `result.usage` to get token counts
- Calculate duration from start time
- Calculate estimated cost using pricing utilities
- Log usage to database via repository (success or failure case)
- Include token usage data in the finish stream chunk sent to renderer
- Export `ClarificationUsageData` interface for the usage information

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Token usage captured after streaming
- [ ] Usage logged to database for both success and failure
- [ ] Duration calculated accurately
- [ ] Cost estimation using pricing data

---

### Step 12: Update AI Overview Handler with Token Capture

**What**: Modify the AI repository overview handler to capture and log token usage after streaming completes.

**Why**: This is the second existing AI handler that needs usage tracking.

**Confidence**: High

**Files**:
- `electron/ipc/ai-overview.handlers.ts` (MODIFY)

**Changes**:
- Accept `AiUsageLogsRepository` as parameter to `registerAiOverviewHandlers`
- Capture start time at beginning of operation
- After stream completes, await `result.usage` to get token counts
- Calculate duration from start time
- Calculate estimated cost using pricing utilities
- Log usage to database via repository (success or failure case)
- Include token usage data in the finish stream chunk sent to renderer
- Export `OverviewUsageData` interface for the usage information

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Token usage captured after streaming
- [ ] Usage logged to database for both success and failure
- [ ] Duration calculated accurately

---

### Step 13: Update Handler Registration with Repository Injection

**What**: Update the handler registration to pass the AI usage logs repository to AI handlers.

**Why**: Handlers need repository access to log usage data.

**Confidence**: High

**Files**:
- `electron/ipc/register-handlers.ts` (MODIFY)

**Changes**:
- Pass `aiUsageLogsRepository` to `registerAiClarificationHandlers`
- Pass `aiUsageLogsRepository` to `registerAiOverviewHandlers`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Repository properly injected to AI handlers

---

### Step 14: Create Query Key Factory for AI Usage Logs

**What**: Define TanStack Query key factory for AI usage logs queries.

**Why**: Query keys enable proper cache management and invalidation.

**Confidence**: High

**Files**:
- `lib/queries/ai-usage-logs.ts` (NEW)
- `lib/queries/index.ts` (MODIFY)

**Changes**:
- Create `aiUsageLogKeys` using `createQueryKeys` with queries: `byProject(projectId)`, `totalsByProject(projectId)`
- Import and merge into main queries object in index.ts

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Query keys follow existing patterns
- [ ] Keys merged into main queries object

---

### Step 15: Create TanStack Query Hooks for AI Usage Logs

**What**: Create React hooks for fetching and mutating AI usage log data.

**Why**: Components need hooks to access usage data with caching and invalidation.

**Confidence**: High

**Files**:
- `hooks/queries/use-ai-usage-logs.ts` (NEW)

**Changes**:
- Create `useAiUsageLogs(projectId)` hook for fetching logs by project
- Create `useAiUsageLogsTotals(projectId)` hook for fetching aggregated totals
- Create `useDeleteAiUsageLogs` mutation hook for deleting logs
- Follow patterns from `use-projects.ts`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Hooks follow existing patterns
- [ ] Proper query key usage
- [ ] Cache invalidation on mutations

---

### Step 16: Create Zod Validation Schema for AI Usage Logs

**What**: Define Zod validation schema for AI usage log data.

**Why**: Form validation and data validation require Zod schemas.

**Confidence**: High

**Files**:
- `lib/validations/ai-usage-log.ts` (NEW)

**Changes**:
- Define `aiUsageLogSchema` matching the database schema
- Define `aiUsageLogFilterSchema` for filtering/query parameters
- Export types using `z.infer`

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Schema matches database types

---

### Step 17: Update Model Selector with Cost Tier Indicators

**What**: Enhance the model selector component to show cost tier indicators and pricing tooltips.

**Why**: Users need visibility into cost differences between models before selection.

**Confidence**: High

**Files**:
- `components/features/clarification/model-selector.tsx` (MODIFY)
- `hooks/use-available-models.ts` (MODIFY)

**Changes**:
- Update `useAvailableModels` to include pricing data from `pricing.ts` in returned models
- Add cost tier ($ / $$ / $$$) indicator next to model names in the dropdown
- Wrap each model item with Tooltip showing exact $/1K tokens pricing on hover
- Style tier indicators with appropriate colors (green for $, yellow for $$, red for $$$)

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Cost tier indicators visible in dropdown
- [ ] Tooltips show pricing on hover

---

### Step 18: Create Cost Confirmation Dialog Component

**What**: Create a reusable dialog component that shows estimated cost before AI operations.

**Why**: Users should see and confirm estimated costs before proceeding with AI generation.

**Confidence**: High

**Files**:
- `components/ui/cost-confirmation-dialog.tsx` (NEW)

**Changes**:
- Create dialog using existing Base UI Dialog primitives
- Display: operation type, selected model, estimated input tokens, estimated cost
- Include "Proceed" and "Cancel" action buttons
- Accept props: isOpen, onClose, onConfirm, operationType, modelId, estimatedInputTokens
- Calculate and display estimated cost using pricing utilities

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Dialog follows existing component patterns
- [ ] Shows all required information
- [ ] Proper action handlers

---

### Step 19: Create Usage Footer Component

**What**: Create a footer component that displays actual tokens consumed and cost after AI operations.

**Why**: Users need visibility into actual costs after generation completes.

**Confidence**: High

**Files**:
- `components/ui/usage-footer.tsx` (NEW)

**Changes**:
- Create component accepting: inputTokens, outputTokens, totalTokens, costUsd, durationMs
- Display formatted token counts and cost
- Include visual indicator for cost (color-coded based on amount)
- Make component collapsible or minimal by default with expand option
- Use CVA for variant styling

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Footer displays all usage information
- [ ] Clean, non-intrusive design

---

### Step 20: Integrate UI Components into Repository Overview Generator

**What**: Add cost confirmation dialog and usage footer to the repository overview generator.

**Why**: This component needs pre-operation confirmation and post-operation usage display.

**Confidence**: High

**Files**:
- `components/repositories/repository-overview-generator.tsx` (MODIFY)

**Changes**:
- Add state for tracking usage data received from stream finish chunk
- Show CostConfirmationDialog before starting generation
- Update stream handler to capture usage data from finish chunk
- Display UsageFooter below content when generation completes
- Update finish chunk handling to extract and store usage information

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Confirmation dialog shown before generation
- [ ] Usage footer shown after completion

---

### Step 21: Integrate UI Components into Clarification Panel

**What**: Add cost confirmation dialog and usage footer to the clarification panel.

**Why**: This component needs pre-operation confirmation and post-operation usage display.

**Confidence**: High

**Files**:
- `components/features/clarification/clarification-panel.tsx` (MODIFY)
- `hooks/use-clarification.ts` (MODIFY)

**Changes**:
- Update `useClarification` hook to capture and expose usage data from stream
- Add state for confirmation dialog visibility
- Show CostConfirmationDialog when user clicks "Analyze Request"
- Display UsageFooter after analysis completes
- Handle usage data in questions_ready, skipped, and completed states

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Confirmation dialog shown before analysis
- [ ] Usage footer shown after completion
- [ ] Hook properly captures usage data

---

### Step 22: Create Usage Page Route Type

**What**: Define route type schema for the usage page.

**Why**: Type-safe routing requires Zod schemas for dynamic params.

**Confidence**: High

**Files**:
- `app/(app)/projects/[projectId]/usage/route-type.ts` (NEW)

**Changes**:
- Define `Route` object with `routeParams` schema requiring `projectId: z.number()`
- Export `PageProps`, `RouteType` types following pattern from settings/route-type.ts

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck && pnpm next-typesafe-url
```

**Success Criteria**:
- [ ] Route type matches existing patterns
- [ ] Type generation succeeds

---

### Step 23: Create Usage Dashboard Page

**What**: Create the main usage dashboard page showing all logged operations for a project.

**Why**: Users need a dedicated view to review their AI usage history.

**Confidence**: High

**Files**:
- `app/(app)/projects/[projectId]/usage/page.tsx` (NEW)

**Changes**:
- Use `withParamValidation` HOC following pattern from settings page
- Fetch usage logs using `useAiUsageLogs` hook
- Display summary totals at top (total tokens, total cost, operation count)
- Create table/list view with columns: timestamp, operation type, model, tokens (in/out/total), cost, status, duration
- Sort by timestamp descending (most recent first)
- Add loading and error states
- Include empty state when no usage data exists

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Page renders usage data in table format
- [ ] Proper loading and error states
- [ ] Follows existing page patterns

---

### Step 24: Add Usage Tab to Project Navigation

**What**: Add "Usage" tab to the project tabs navigation component.

**Why**: Users need navigation access to the usage dashboard.

**Confidence**: High

**Files**:
- `components/projects/project-tabs.tsx` (MODIFY)

**Changes**:
- Add new tab object for usage page with href using `$path` helper
- Position tab after "Repositories" and before "Settings"
- Tab label: "Usage"
- Tab value: "usage"

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck
```

**Success Criteria**:
- [ ] Usage tab appears in navigation
- [ ] Tab navigates to correct route
- [ ] Active state works correctly

---

### Step 25: Run Database Migration

**What**: Apply the database migration to create the ai_usage_logs table.

**Why**: The table must exist in the database for the feature to function.

**Confidence**: High

**Validation Commands**:
```bash
pnpm db:migrate
```

**Success Criteria**:
- [ ] Migration runs successfully
- [ ] Table created in SQLite database
- [ ] No migration errors

---

### Step 26: End-to-End Testing and Validation

**What**: Manually test the complete feature flow.

**Why**: Integration testing ensures all components work together correctly.

**Confidence**: High

**Validation Commands**:
```bash
pnpm lint && pnpm typecheck && pnpm electron:dev
```

**Success Criteria**:
- [ ] Model selector shows cost tier indicators
- [ ] Tooltip shows pricing on hover
- [ ] Cost confirmation dialog appears before AI operations
- [ ] Token usage logged to database after operations
- [ ] Usage footer displays after generation completes
- [ ] Usage page shows logged operations
- [ ] Failed operations are also logged
- [ ] Navigation to usage page works

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm typecheck`
- [ ] All files pass `pnpm lint`
- [ ] Database migration applied successfully with `pnpm db:migrate`
- [ ] Application starts without errors with `pnpm electron:dev`
- [ ] Manual verification of complete feature flow
- [ ] Both success and failure AI operations logged correctly
- [ ] Usage data persists across application restarts

## Notes

- **Pricing Data Accuracy**: Model pricing should be verified against current provider pricing pages. The pricing data may need periodic updates as providers change their rates.
- **TokenLens Integration**: If TokenLens has issues with certain models, the implementation falls back to Vercel AI SDK's usage data which is provided directly by the API response.
- **Database Retention**: Usage data is retained indefinitely as specified. Consider adding a future feature for optional data export or manual cleanup.
- **Operation Types**: Currently supports 'clarification' and 'repository_overview'. The schema is designed to accommodate future AI operation types by using a text field rather than an enum.
- **Cost Estimation Accuracy**: Pre-operation cost estimates are based on input token estimates only. Actual costs will differ as they include output tokens. Consider adding a disclaimer in the confirmation dialog.
- **Stream Finish Handling**: The finish chunk type in both AI handlers will be extended to include usage data. This is backward compatible as the UI gracefully handles missing data.
- **Aggregation Queries**: The repository includes basic aggregation methods. More complex time-based aggregations (daily/weekly/monthly) can be added in future iterations using the existing schema.
