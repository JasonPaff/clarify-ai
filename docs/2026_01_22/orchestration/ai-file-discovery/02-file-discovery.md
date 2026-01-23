# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Status | **Completed** |
| Start Time | 2026-01-22T00:01:05Z |
| End Time | 2026-01-22T00:02:30Z |
| Duration | ~85 seconds |

## Input: Refined Request

AI-Assisted File Discovery introduces an intelligent, model-driven file identification system that complements the existing pattern-based Fast Discovery functionality, enabling users to leverage AI reasoning to surface contextually relevant files across all repositories linked to a feature request. This feature integrates seamlessly with the established Vercel AI SDK infrastructure, utilizing the existing provider architecture (Anthropic, OpenAI, Google) and extending the configurable model selection pattern already implemented for the three-step orchestration workflow (Refine, Research, Plan) to support a fourth AI step specifically for file discovery. The UI presents an "AI File Discovery" option adjacent to the existing Fast Discovery button, maintaining visual consistency through Base UI React primitives styled with CVA variants, and renders results in a scrollable, selectable list component showing file paths with accompanying 1-2 line justifications explaining each file's relevance to the feature request. The AI receives a structured prompt containing the raw feature request text, auto-generated repository overview summaries, and a pruned file tree produced by extending the existing directory-tree and fast-glob utilities with ignore patterns that exclude common non-source directories (node_modules, .git, dist, build, coverage, etc.), along with optional user-provided hints for additional guidance. Token counting via tokenlens enforces a configurable budget cap, displaying warnings when the pruned file tree exceeds thresholds and allowing users to narrow scope before execution. Results are capped at a configurable maximum (defaulting to 50 files) stored at global, project, and step levels following the existing settings hierarchy pattern in the Drizzle schema. The discovery process executes as a cancelable streaming operation through IPC handlers, with the main process managing AI SDK streaming calls while the renderer displays real-time progress and provides abort controls through a dedicated cancel mechanism that terminates the underlying AI request. Users select desired files from the ranked results via checkbox selection with select-all/none controls, then confirm to batch-update those files as context files (setting includedInContext=true) through a TanStack Query mutation that invalidates the relevant repository files cache. Error handling follows established patterns with QueryErrorBoundary integration, presenting clear user-facing messages for API failures, timeout conditions, or token budget violations, while the operation state is managed through TanStack Query's mutation status tracking to display appropriate loading, error, and success states throughout the discovery workflow.

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Directories Explored | 12 |
| Candidate Files Examined | 65+ |
| Highly Relevant Files | 32 |
| Supporting Files | 13 |
| Total Files Discovered | 45 |

## Discovered Files by Priority

### Critical Priority (8 files)

| File | Justification |
|------|---------------|
| `components/features/discover-step.tsx` | Main discovery step UI component that orchestrates the existing AI discovery workflow. The new AI File Discovery feature will be integrated here as an alternative discovery method alongside the existing Fast Discovery. |
| `hooks/use-discovery.ts` | Core discovery hook managing streaming AI responses, file discovery state, and result persistence. This is the primary hook that will need to be extended or a parallel hook created for AI-assisted file discovery. |
| `electron/ipc/ai-discovery.handlers.ts` | IPC handlers for AI discovery operations including generate and cancel. Contains streaming implementation with Vercel AI SDK. Core file for extending AI discovery functionality. |
| `lib/ai/prompts/discovery.ts` | Discovery prompt templates and prompt building logic. Contains `DEFAULT_DISCOVERY_PROMPT` and `buildDiscoveryPrompt` function that constructs the AI context. |
| `lib/ai/tools/discovery-tool.ts` | AI tool definition for file discovery using Vercel AI SDK. Defines the Zod schema for tool input and the `discoveryTool` implementation. |
| `lib/validations/discovery.ts` | Zod validation schemas for discovery types including `DiscoveredFileEntry`, `DiscoveryResults`, `DiscoveryScopeConfig`, and parse/stringify utilities. |
| `electron/ipc/channels.ts` | IPC channel constants including `ai.discovery.generate`, `ai.discovery.cancel`, and `ai.discovery.stream`. May need extension for additional AI discovery channels. |
| `electron/preload.ts` | Electron preload script exposing `electronAPI` to renderer. Contains AI discovery API methods (`generate`, `cancel`, `onStream`) that expose IPC functionality. |

### High Priority - UI Components (7 files)

| File | Justification |
|------|---------------|
| `components/features/discovery/discovery-results.tsx` | Results display component with filtering, editing, and file management. Displays discovered files in a scrollable list with action/risk badges. Reference for new AI results display. |
| `components/features/discovery/discovery-progress.tsx` | Progress display during AI discovery showing percentage, current step, and file count with cancel button. Will be used/extended for AI file discovery progress. |
| `components/features/discovery/scope-selector.tsx` | Scope configuration panel for include/exclude patterns and max files limit. Used for configuring discovery boundaries - relevant for AI discovery scope. |
| `components/features/discovery/discovery-cost-estimate.tsx` | Token and cost estimation component using tokenlens library. Displays estimated cost before running AI discovery - directly relevant for new feature. |
| `components/features/discovery/add-file-dialog.tsx` | Dialog for manually adding discovered files. May be referenced for file selection patterns. |
| `components/features/discovery/file-card.tsx` | Individual file card display with action badges and risk indicators. Used in results list. |
| `components/features/discovery/file-card-editor.tsx` | Inline editor for discovered file entries. Referenced for edit functionality. |

### High Priority - Data Layer (5 files)

| File | Justification |
|------|---------------|
| `hooks/queries/use-feature-request-context-files.ts` | TanStack Query hooks for context files including `useBulkAddContextFiles`, `useSetContextFileIncluded`. Critical for batch-updating context files from AI discovery results. |
| `db/schema/feature-request-context-files.schema.ts` | Database schema for context files with `includedInContext` field. Defines the data structure for persisting discovered files as context. |
| `db/repositories/feature-request-context-files.repository.ts` | Repository pattern implementation for context files CRUD operations including `bulkCreate` and `setIncludedInContext`. |
| `electron/ipc/feature-request-context-files.handlers.ts` | IPC handlers for context file database operations. Used for batch updates from discovery. |
| `lib/queries/feature-request-context-files.ts` | Query key definitions for context files cache invalidation. |

### High Priority - Settings & Model Configuration (3 files)

| File | Justification |
|------|---------------|
| `db/schema/step-configurations.schema.ts` | Schema for per-step model configuration including `modelId`, `modelProvider`, `thinkingEnabled`, `customSystemPrompt`. Defines settings hierarchy. |
| `hooks/queries/use-step-configurations.ts` | Query hooks for step configurations (`useStepConfig`, `useUpsertStepConfig`). Used for model selection per step. |
| `lib/ai/models.ts` | AI model definitions for all providers (Anthropic, OpenAI, Google, etc.) with `supportsThinking` flag. Used for model selection UI. |

### Medium Priority - Supporting Infrastructure (9 files)

| File | Justification |
|------|---------------|
| `hooks/useElectron.ts` | React hooks wrapping Electron API access including `useElectronDb`, `useElectronFileSearch`. Foundation for accessing IPC from renderer. |
| `electron/ipc/register-handlers.ts` | Handler registration that calls all individual handler registrations. Entry point for IPC setup. |
| `electron/ipc/file-search.handlers.ts` | Existing file search handlers with fast-glob usage and exclude patterns. Reference for file tree generation and ignore patterns. |
| `lib/validations/file-search.ts` | File search validation schemas and types. Reference for file type filtering patterns. |
| `hooks/queries/use-file-search.ts` | File search hook with progress tracking and cancellation. Reference pattern for cancelable streaming operations. |
| `lib/queries/discovery.ts` | Query key factory for discovery operations. May need extension for AI discovery caching. |
| `hooks/queries/use-repositories.ts` | Repository data hooks for getting repo paths/names. |
| `hooks/queries/use-repository-overviews.ts` | Repository overview hooks for getting overview content fed to AI. |
| `hooks/queries/use-feature-request-repositories.ts` | Feature request repository associations. |

### Medium Priority - Workflow Components (6 files)

| File | Justification |
|------|---------------|
| `components/features/workflow/step-settings-panel.tsx` | Step settings panel component used for model configuration display. Reference for settings UI integration. |
| `components/features/workflow/cancel-ai-dialog.tsx` | Confirmation dialog for canceling AI operations. Used in discovery progress for cancel flow. |
| `components/features/workflow/streaming-error-fallback.tsx` | Error boundary fallback for streaming operations. Error handling pattern reference. |
| `electron/ipc/fs.handlers.ts` | File system handlers including `collectRepositoryData` for file tree generation. |
| `lib/ai/clarification-context.ts` | Clarification context builder passed to discovery prompt. |
| `components/providers/workflow-provider.tsx` | Workflow context provider for AI operation tracking. |

### Low Priority - UI Primitives (7 files)

| File | Justification |
|------|---------------|
| `components/ui/button.tsx` | Button component with CVA variants. Used throughout discovery UI. |
| `components/ui/checkbox.tsx` | Checkbox component for file selection. Used for select-all/none controls. |
| `components/ui/alert.tsx` | Alert component for error display and warnings. |
| `components/ui/badge.tsx` | Badge component for file action/risk indicators. |
| `components/ui/tooltip.tsx` | Tooltip component used in cost estimate compact view. |
| `components/ui/empty-state.tsx` | Empty state component for no results scenarios. |
| `components/skeletons/discovery-skeleton.tsx` | Loading skeleton for discovery step. |

## Architecture Insights

### Key Patterns Discovered

1. **AI Streaming Pattern**: The existing discovery uses Vercel AI SDK's `streamText` with tool calling. Stream chunks are sent via IPC to renderer using `mainWindow.webContents.send()`. The renderer subscribes via `ipcRenderer.on()` exposed through preload.

2. **Cancelable Operations**: AbortController pattern is used for cancellation with `activeAbortController` module-level variable in handlers.

3. **State Management**: TanStack Query mutations handle cache invalidation. Feature request state uses `researchFindings` field to store JSON-stringified discovery results.

4. **Settings Hierarchy**: Step configurations support per-project, per-step model selection. The schema already has `research` step type for discovery.

5. **Context Files Flow**: Discovery results can be converted to context files via `useBulkAddContextFiles` mutation which calls `featureRequestContextFiles.bulkCreate`.

6. **Token Estimation**: The `tokenlens` library is already integrated for cost estimation using `costFromUsage` and `modelMeta`.

### Existing Similar Functionality

- **Fast Discovery**: The existing `DiscoverStep` already implements AI-assisted discovery with repository overviews, scope configuration, and streaming results
- **File Search**: `file-search.handlers.ts` provides pattern-based file discovery with fast-glob that can be extended for file tree pruning

### Integration Points Identified

1. **Model Selection**: Uses `useStepConfig(projectId, 'research')` to get configured model
2. **Repository Overviews**: Fetched via `useRepositoryOverviewContents` and passed to AI prompt
3. **Results Persistence**: Stored in `featureRequest.researchFindings` as JSON
4. **Run History**: Uses `useCreateRun`, `useUpdateRun`, `useSetCurrentRun` for run tracking

## Validation Results

| Check | Result |
|-------|--------|
| Minimum Files (3+) | PASS - 45 files discovered |
| File Path Validation | PASS - All paths verified via agent exploration |
| Priority Categorization | PASS - Critical/High/Medium/Low assigned |
| Comprehensive Coverage | PASS - All architectural layers covered |

---

**MILESTONE:STEP_2_COMPLETE**
