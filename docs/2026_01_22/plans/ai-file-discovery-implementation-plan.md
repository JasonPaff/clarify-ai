# AI-Assisted File Discovery - Implementation Plan

**Generated**: 2026-01-22
**Original Request**: AI‑Assisted File Discovery — Requirements (Final)
**Refined Request**: AI-Assisted File Discovery introduces an intelligent, model-driven file identification system that complements the existing pattern-based Fast Discovery functionality...

---

## Analysis Summary

- Feature request refined with project context (2x expansion ratio)
- Discovered 45 files across 12 directories
- Generated 21-step implementation plan with Gemini review quality gates

## File Discovery Results

### Critical Priority (8 files)

| File | Justification |
|------|---------------|
| `components/features/discover-step.tsx` | Main discovery step UI component - integration point for AI Discovery |
| `hooks/use-discovery.ts` | Core discovery hook with streaming - pattern for useAiDiscovery |
| `electron/ipc/ai-discovery.handlers.ts` | IPC handlers for AI operations - extend for AI-assisted discovery |
| `lib/ai/prompts/discovery.ts` | Prompt templates - reference for AI discovery prompts |
| `lib/ai/tools/discovery-tool.ts` | AI tool definition - pattern for AI discovery tool |
| `lib/validations/discovery.ts` | Zod schemas - reference for AI discovery validation |
| `electron/ipc/channels.ts` | IPC channel constants - extend with new channels |
| `electron/preload.ts` | Electron API exposure - add AI discovery methods |

### High Priority (15 files)

- **UI**: discovery-results.tsx, discovery-progress.tsx, scope-selector.tsx, discovery-cost-estimate.tsx, add-file-dialog.tsx, file-card.tsx, file-card-editor.tsx
- **Data**: use-feature-request-context-files.ts, feature-request-context-files.schema.ts, feature-request-context-files.repository.ts, feature-request-context-files.handlers.ts, feature-request-context-files.ts (queries)
- **Settings**: step-configurations.schema.ts, use-step-configurations.ts, models.ts

---

## Implementation Plan

## Overview

**Estimated Duration**: 5-7 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

This feature enhances the existing discovery workflow by adding an AI-powered file identification system that uses model reasoning to surface contextually relevant files from linked repositories. The implementation extends the current Fast Discovery pattern-based approach with intelligent file analysis, structured justifications, and seamless integration with the context files system for batch selection and inclusion.

## Prerequisites

- [ ] Review existing discovery implementation in `discover-step.tsx` and `use-discovery.ts`
- [ ] Understand the current IPC handler patterns in `electron/ipc/ai-discovery.handlers.ts`
- [ ] Verify tokenlens integration patterns from `discovery-cost-estimate.tsx`
- [ ] Confirm context files schema supports batch updates via `useBulkAddContextFiles` mutation

## Implementation Steps

### Step 1: Define AI Discovery Settings Schema Extension

**What**: Extend the step configurations schema to support AI discovery-specific settings including max files, token budget limits, and file tree pruning preferences at global, project, and step levels.
**Why**: The settings hierarchy pattern is already established for other steps; AI discovery needs its own configurable parameters following the same pattern.
**Confidence**: High

**Files to Modify:**

- `db/schema/step-configurations.schema.ts` - Add AI discovery configuration fields

**Changes:**

- Add `aiDiscoveryMaxFiles` integer field with default 50
- Add `aiDiscoveryTokenBudget` integer field for configurable token cap
- Add `aiDiscoveryIgnorePatterns` text field for JSON array of additional ignore patterns

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New fields added to step_configurations table schema
- [ ] Types correctly inferred via `$inferSelect` and `$inferInsert`
- [ ] All validation commands pass

---

### Step 2: Generate Database Migration

**What**: Generate and apply Drizzle migration for the schema changes from Step 1.
**Why**: Database schema must be updated before new fields can be used by the application.
**Confidence**: High

**Files Created by Migration:**

- `drizzle/XXXX_migration_name.sql` - Auto-generated migration file

**Changes:**

- Run `pnpm db:generate` to create migration file
- Migration will add new columns to step_configurations table

**Validation Commands:**

```bash
pnpm db:generate
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Migration file generated successfully in drizzle/ directory
- [ ] Migration SQL contains ALTER TABLE statements for new columns
- [ ] Application starts without database errors (migrations run on app start)
- [ ] All validation commands pass

---

### Step 3: Create AI Discovery Validation Schemas

**What**: Create Zod validation schemas for AI discovery request/response types, file tree pruning configuration, and discovery result structures with justifications.
**Why**: Type-safe validation ensures data integrity across IPC boundaries and provides clear contracts for the AI discovery workflow.
**Confidence**: High

**Files to Create:**

- `lib/validations/ai-discovery.ts` - AI discovery-specific validation schemas

**Changes:**

- Add `aiDiscoveryRequestSchema` for generate request validation
- Add `aiDiscoveryResultSchema` for structured response with file justifications
- Add `aiDiscoveryFileEntrySchema` extending discovered file entry with 1-2 line justification field
- Add `fileTreePruneConfigSchema` for ignore pattern configuration
- Add `aiDiscoveryProgressSchema` for streaming progress updates
- Add helper parse/stringify functions following existing patterns

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All schemas export correctly with proper TypeScript types
- [ ] Justification field included in file entry schema as 1-2 sentence string
- [ ] Parse functions handle null/undefined gracefully
- [ ] All validation commands pass

---

### Step 4: Implement File Tree Pruning Utility

**What**: Create a utility module that generates a pruned file tree structure from repository paths, applying configurable ignore patterns to exclude non-source directories.
**Why**: AI discovery needs a condensed view of repository structure that fits within token budgets while excluding irrelevant directories like node_modules, .git, dist, etc.
**Confidence**: High

**Files to Create:**

- `lib/ai/utils/file-tree-pruner.ts` - File tree generation and pruning utilities

**Changes:**

- Implement `buildPrunedFileTree` function using fast-glob patterns
- Implement `DEFAULT_IGNORE_PATTERNS` constant array matching existing file-search patterns
- Implement `mergeIgnorePatterns` to combine default and user-provided patterns
- Implement `countFileTreeTokens` using tokenlens for token estimation
- Implement `truncateFileTree` to trim tree when exceeding token budget

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] File tree output formatted as readable directory structure string
- [ ] Default ignore patterns include node_modules, .git, dist, build, coverage
- [ ] Token counting integrates with tokenlens estimation
- [ ] Truncation preserves most relevant portions of tree
- [ ] All validation commands pass

---

### Step 5: Create AI Discovery Prompt Template

**What**: Create the prompt template and builder function for AI-assisted file discovery, including structured instructions for returning files with justifications.
**Why**: The AI needs clear instructions to analyze repository context and return relevant files with 1-2 line explanations of why each file matters.
**Confidence**: High

**Files to Create:**

- `lib/ai/prompts/ai-discovery.ts` - AI discovery prompt template and builder

**Changes:**

- Define `DEFAULT_AI_DISCOVERY_PROMPT` with instructions for file identification with justifications
- Implement `buildAiDiscoveryPrompt` function accepting feature request, file tree, repository overviews, optional hints
- Include template placeholders for {fileTree}, {featureRequest}, {repositoryOverviews}, {userHints}, {maxFiles}
- Structure prompt to require 1-2 sentence justifications per file

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Prompt template includes clear instructions for justification format
- [ ] Builder function replaces all placeholders correctly
- [ ] Prompt emphasizes contextual relevance and reasoning
- [ ] All validation commands pass

---

### Step 6: Create AI Discovery Tool Definition

**What**: Create the Vercel AI SDK tool definition for AI-assisted file discovery that structures the AI's output to include files with justifications.
**Why**: The tool schema defines the expected output structure, ensuring the AI returns properly formatted results with justification text for each file.
**Confidence**: High

**Files to Create:**

- `lib/ai/tools/ai-discovery-tool.ts` - AI discovery tool definition

**Changes:**

- Create Zod schema for tool input matching expected file discovery output
- Include `files` array with path, relevance score, and justification fields
- Include `summary` field for overall analysis summary
- Include `confidence` score and `totalFilesAnalyzed` count
- Implement tool execute function returning structured result

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Tool schema includes justification as required string field (1-2 sentences)
- [ ] Tool integrates with Vercel AI SDK tool() function
- [ ] Result structure matches ai-discovery validation schemas
- [ ] All validation commands pass

---

### Step 7: Implement AI Discovery IPC Handler

**What**: Create the Electron IPC handler for AI discovery generation with streaming support, cancellation, and progress updates.
**Why**: The main process handles AI SDK streaming calls while the renderer displays real-time progress through IPC communication.
**Confidence**: High

**Files to Create:**

- `electron/ipc/ai-discovery-assisted.handlers.ts` - AI-assisted discovery IPC handlers

**Files to Modify:**

- `electron/ipc/channels.ts` - Add AI discovery channel constants
- `electron/ipc/index.ts` - Register new handlers

**Changes:**

- Define `AiDiscoveryGenerateRequest` interface with file tree, model config, token budget
- Define `AiDiscoveryStreamChunk` interface for progress, results, errors
- Implement `registerAiDiscoveryAssistedHandlers` following existing ai-discovery pattern
- Add streaming via `streamText` with tool calling
- Implement cancellation via AbortController pattern
- Add channels: `ai:aiDiscovery:generate`, `ai:aiDiscovery:cancel`, `ai:aiDiscovery:stream`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler follows existing ai-discovery.handlers.ts patterns
- [ ] Streaming chunks include progress percentage and current step
- [ ] Cancellation properly aborts ongoing requests
- [ ] Error handling sends clear messages to renderer
- [ ] All validation commands pass

---

### Step 8: Update Electron Preload with AI Discovery API

**What**: Expose the AI discovery IPC methods to the renderer process through the contextBridge.
**Why**: The renderer needs typed access to AI discovery methods following the established pattern for other AI operations.
**Confidence**: High

**Files to Modify:**

- `electron/preload.ts` - Add AI discovery API methods

**Changes:**

- Add `aiDiscovery` object under `ai` namespace with generate, cancel, onStream methods
- Define TypeScript types for request and stream chunk matching handler types
- Implement IPC invoke calls for generate and cancel
- Implement IPC listener for stream events with cleanup function

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `electronAPI.ai.aiDiscovery` object exposed to renderer
- [ ] Types match handler definitions
- [ ] Stream listener returns unsubscribe function
- [ ] All validation commands pass

---

### Step 9: Create useAiDiscovery Hook

**What**: Create the React hook for managing AI discovery state, streaming, and integration with TanStack Query mutations.
**Why**: The hook encapsulates discovery logic, state management, and cache invalidation following the established useDiscovery pattern.
**Confidence**: High

**Files to Create:**

- `hooks/use-ai-discovery.ts` - AI discovery React hook

**Changes:**

- Implement state for status, files, progress, error, streamingText
- Implement `startAiDiscovery` function accepting config and repository data
- Implement `cancelAiDiscovery` function for abort handling
- Implement stream chunk processing for progress, results, errors
- Implement `selectFiles` function to batch-add selected files as context files
- Integrate with `useBulkAddContextFiles` mutation for context file creation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Hook returns typed state and action functions
- [ ] Stream processing updates state in real-time
- [ ] File selection creates context files with includedInContext=true
- [ ] Cleanup on unmount stops active streams
- [ ] All validation commands pass

---

### Step 10: Gemini Code Review Checkpoint (Backend Complete)

**What**: Run Gemini code review to validate backend implementation quality before proceeding to UI components.
**Why**: AI-powered code review catches issues early in the backend implementation before building dependent UI components.
**Confidence**: High

**Success Criteria:**

- [ ] Gemini review completes without critical issues
- [ ] IPC handler patterns consistent with existing handlers
- [ ] Schema and validation patterns follow project conventions
- [ ] Any warnings or suggestions addressed or documented

---

### Step 11: Create AiDiscoveryProgress Component

**What**: Create the progress display component showing real-time AI discovery status, token usage, and cancel controls.
**Why**: Users need visibility into the AI operation's progress and ability to cancel if needed.
**Confidence**: High

**Files to Create:**

- `components/features/discovery/ai-discovery-progress.tsx` - AI discovery progress component

**Changes:**

- Build component following existing `discovery-progress.tsx` patterns
- Display current step text, percentage progress bar, file count
- Show token usage estimation during operation
- Include cancel button with confirmation dialog using `CancelAiDialog`
- Use Base UI Progress component with CVA styling

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Progress bar updates smoothly during operation
- [ ] Cancel confirmation prevents accidental cancellation
- [ ] Token usage display helps users understand costs
- [ ] All validation commands pass

---

### Step 12: Create AiDiscoveryResults Component

**What**: Create the results display component showing discovered files with justifications, checkbox selection, and select-all controls.
**Why**: Users need to review AI-discovered files, understand why each is relevant, and select which files to add to context.
**Confidence**: High

**Files to Create:**

- `components/features/discovery/ai-discovery-results.tsx` - AI discovery results component

**Changes:**

- Create scrollable list showing file paths with 1-2 line justifications
- Implement checkbox selection for each file entry
- Add select-all/none controls at top of list
- Add "Add to Context" button to batch-add selected files
- Display file count and selection count in header
- Style using CVA variants with Base UI primitives

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] File list scrolls within max-height container
- [ ] Justifications display clearly below file paths
- [ ] Checkbox selection state managed correctly
- [ ] Select-all toggles all checkboxes
- [ ] All validation commands pass

---

### Step 13: Create AiDiscoveryCostWarning Component

**What**: Create a warning component that displays when the pruned file tree exceeds token budget thresholds.
**Why**: Users need to be warned before execution if the operation might exceed their configured token budget.
**Confidence**: High

**Files to Create:**

- `components/features/discovery/ai-discovery-cost-warning.tsx` - Token budget warning component

**Changes:**

- Create alert banner component with warning styling
- Display estimated token count vs configured budget
- Provide suggestions to narrow scope (add more exclusions, select fewer repos)
- Include "Proceed Anyway" and "Adjust Scope" action buttons
- Use Alert component with CVA destructive/warning variants

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Warning displays when tokens exceed threshold
- [ ] Clear messaging about cost implications
- [ ] Action buttons trigger appropriate callbacks
- [ ] All validation commands pass

---

### Step 14: Create AiDiscoveryPanel Component

**What**: Create the main panel component that orchestrates the AI discovery workflow, including scope configuration, progress display, and results.
**Why**: The panel provides the primary UI for AI File Discovery, presented adjacent to the existing Fast Discovery button.
**Confidence**: High

**Files to Create:**

- `components/features/discovery/ai-discovery-panel.tsx` - Main AI discovery panel

**Changes:**

- Create panel with "AI File Discovery" header and description
- Integrate ScopeSelector for configuration
- Integrate cost estimate display using tokenlens
- Show AiDiscoveryCostWarning when budget exceeded
- Show AiDiscoveryProgress during operation
- Show AiDiscoveryResults when complete
- Handle state transitions between idle, running, complete, error
- Include "Start AI Discovery" button with loading state

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Panel transitions smoothly between workflow states
- [ ] Configuration persists between runs
- [ ] Integration with useAiDiscovery hook working
- [ ] All validation commands pass

---

### Step 15: Integrate AI Discovery into Discover Step

**What**: Add the AI Discovery panel to the existing discover-step.tsx, presenting it alongside the existing Fast Discovery functionality.
**Why**: Users should see both discovery options (Fast/pattern-based and AI-assisted) and choose based on their needs.
**Confidence**: High

**Files to Modify:**

- `components/features/discover-step.tsx` - Add AI discovery integration

**Changes:**

- Add tab or toggle UI to switch between "Fast Discovery" and "AI Discovery"
- Integrate AiDiscoveryPanel component for AI discovery mode
- Ensure both modes share repository selection context
- Add visual indicator distinguishing the two approaches
- Maintain existing Fast Discovery functionality unchanged

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Both discovery modes accessible from same step
- [ ] Clear visual distinction between modes
- [ ] Existing Fast Discovery continues to work
- [ ] Mode selection persists during session
- [ ] All validation commands pass

---

### Step 16: Add AI Discovery Settings to Step Settings Panel

**What**: Extend the StepSettingsPanel to include AI discovery-specific settings like max files and token budget.
**Why**: Users need to configure AI discovery parameters through the existing step settings interface.
**Confidence**: High

**Files to Modify:**

- `components/features/workflow/step-settings-panel.tsx` - Add AI discovery settings

**Changes:**

- Add collapsible section for AI Discovery settings when research step is selected
- Add NumberInput for max files configuration (default 50)
- Add NumberInput for token budget limit
- Add text area for additional ignore patterns
- Connect to step configuration upsert mutation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Settings section visible for research step
- [ ] Changes persist via step configuration mutations
- [ ] Default values applied when no configuration exists
- [ ] All validation commands pass

---

### Step 17: Implement Batch Context File Addition

**What**: Ensure the context file batch addition from AI discovery results properly creates records with includedInContext=true.
**Why**: Users selecting files from AI discovery results need those files added to the feature request context for the planning step.
**Confidence**: High

**Files to Modify:**

- `hooks/use-ai-discovery.ts` - Implement batch add logic

**Changes:**

- Implement `confirmSelection` function in useAiDiscovery hook
- Map selected AI discovery files to NewFeatureRequestContextFile records
- Set fileType to 'repository' for all entries
- Set includedInContext to true for all entries
- Call bulkCreate mutation and handle success/error
- Invalidate context files cache on success

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Selected files create context file records
- [ ] Records have correct fileType and includedInContext values
- [ ] Cache invalidation triggers UI updates
- [ ] Error handling shows user-friendly messages
- [ ] All validation commands pass

---

### Step 18: Add Error Handling with QueryErrorBoundary

**What**: Wrap AI discovery components with QueryErrorBoundary for consistent error handling.
**Why**: Following established patterns, error boundaries provide graceful degradation and clear error messages.
**Confidence**: High

**Files to Modify:**

- `components/features/discovery/ai-discovery-panel.tsx` - Add error boundaries

**Changes:**

- Wrap main panel content with ErrorBoundary from react-error-boundary
- Use StreamingErrorFallback component for AI operation errors
- Implement error recovery by resetting hook state
- Add handleErrorBoundaryReset callback for retry functionality

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Errors display clear user-facing messages
- [ ] Recovery resets component to idle state
- [ ] API failures, timeouts handled gracefully
- [ ] All validation commands pass

---

### Step 19: Update Electron Types Definition

**What**: Update the electron.d.ts types file to include AI discovery API types.
**Why**: TypeScript definitions ensure type safety when accessing electron API from renderer.
**Confidence**: High

**Files to Modify:**

- `types/electron.d.ts` - Add AI discovery types (if separate from preload types)

**Changes:**

- Add AiDiscoveryGenerateRequest type re-export
- Add AiDiscoveryStreamChunk type re-export
- Add AiDiscoveryFileEntry type for results with justifications
- Ensure types match preload implementation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All AI discovery types available in renderer
- [ ] No type errors when using electronAPI.ai.aiDiscovery
- [ ] All validation commands pass

---


**Success Criteria:**

- [ ] Complete workflow executes without errors
- [ ] UI transitions smoothly between states
- [ ] Selected files appear in context file list
- [ ] Settings save and restore correctly
- [ ] Build completes without errors
- [ ] All validation commands pass

---

### Step 20: Final Gemini Code Review (Quality Gate)

**What**: Run final Gemini code review to validate complete implementation quality.
**Why**: Final AI-powered review ensures code quality, consistency, and catches any issues before the feature is considered complete.
**Confidence**: High

**Validation Commands:**

```bash
/gemini-review
```

**Success Criteria:**

- [ ] Gemini review completes without critical issues
- [ ] Code follows project conventions and patterns
- [ ] No security or performance concerns identified
- [ ] Any warnings or suggestions addressed or documented
- [ ] Code quality approved by GPT 5.2 review

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Database migration generates and applies successfully
- [ ] Backend implementation Gemini review passes (Step 10)
- [ ] Build completes without errors (`pnpm run build`)
- [ ] Final Gemini code review passes

## Notes

**Architecture Decisions:**

- AI discovery is implemented as a separate pathway alongside existing Fast Discovery, not replacing it
- The feature uses the existing 'research' step configuration with added AI-specific fields
- File tree pruning happens in the main process before sending to AI for token efficiency
- Results use the existing context files system for seamless integration with planning step

**Assumptions Requiring Confirmation:**

- Token budget defaults (suggested: 100k tokens for file tree input)
- Max files default (suggested: 50 files)
- User hint input field is optional and may be deferred to a future enhancement

**Potential Risks:**

- Token estimation accuracy may vary between models; actual costs could differ
- Large repositories may still exceed budgets even with aggressive pruning
- AI response quality depends on model selection and repository overview quality
