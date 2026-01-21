# Phase 7: Discover Step Implementation Plan

**Generated**: 2026-01-20
**Original Request**: Implement Phase 7 of the feature request workflow: Discover Step Implementation
**Status**: Ready for Implementation

---

## Overview

**Estimated Duration**: 4-5 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

- Transform the placeholder `research-step.tsx` into a fully functional file discovery system with AI-powered analysis
- Implement scope selector UI with folder tree navigation, glob pattern filtering, and per-repository configuration
- Build discovery AI integration with streaming progress, tool-based file analysis, and parallel repository processing
- Create comprehensive results UI with file cards, expandable details, inline editing, and manual file addition
- Add Zod validation schemas for type-safe data flow from AI responses through database storage to UI rendering

## Prerequisites

- [x] Repository overview generation system is functional (existing)
- [x] TanStack Query setup is configured (existing)
- [x] IPC channels for discovery are defined in `electron/ipc/channels.ts` (existing)
- [x] Step configuration system supports 'research' step (existing)
- [x] Feature request schema has `researchFindings` field (existing)

---

## Implementation Steps

### Step 1: Create Discovery Validation Schemas

**What**: Define Zod schemas for discovery file entries and results to ensure type safety throughout the data flow.
**Why**: Establishes the foundational types that all other components will depend on, enabling type-safe parsing of AI responses and database serialization.
**Confidence**: High

**Files to Create:**
- `lib/validations/discovery.ts` - Validation schemas and parser/serializer functions

**Changes:**
- Define `discoveryStatusSchema` with status enum values (idle, scanning, analyzing, completed, failed)
- Define `discoveryFileActionSchema` with action enum (create, modify, delete, review)
- Define `discoveryRiskLevelSchema` with risk levels (low, medium, high)
- Define `discoveredFileEntrySchema` with path, action, risk, reason, dependencies, snippets, repositoryId, confidence fields
- Define `discoveryResultsSchema` wrapping file array with metadata (timestamp, modelUsed, totalFiles, scopeConfig)
- Define `discoveryScopeConfigSchema` for include/exclude patterns and maxFiles
- Create parse functions: `parseDiscoveryResults`, `parseDiscoveryStatus`, `parseDiscoveredFiles`
- Create stringify functions: `stringifyDiscoveryResults`, `stringifyDiscoveredFiles`

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All schema types are exported and usable
- [ ] Parse functions handle null/undefined inputs gracefully
- [ ] Stringify functions produce valid JSON
- [ ] All validation commands pass

---

### Step 2: Create Discovery AI Prompt Builder

**What**: Implement the prompt construction logic for the discovery AI, following the pattern established in clarification prompts.
**Why**: Provides the AI with structured instructions for analyzing repositories and discovering relevant files, ensuring consistent and high-quality output.
**Confidence**: High
**Notes** The prompt template to base the new prompt on is defined in the .claude/agents/file-discovery-agent.md file

**Files to Create:**
- `lib/ai/prompts/discovery.ts` - Prompt templates and builder function

**Changes:**
- Define `DEFAULT_DISCOVERY_PROMPT` constant with instructions for file discovery analysis
- Include repository overview context placeholder
- Include feature request description placeholder
- Include clarification context placeholder (optional)
- Include scope configuration instructions
- Create `buildDiscoveryPrompt` function accepting featureRequest, repositoryOverviews, clarificationContext, scopeConfig, and optional customPrompt

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Prompt template includes all necessary placeholders
- [ ] Builder function correctly substitutes all parameters
- [ ] Custom prompt override works correctly
- [ ] All validation commands pass

---

### Step 3: Create Discovery AI Tool Schema

**What**: Define the AI tool schema for file discovery that the model will call to report discovered files.
**Why**: Enables structured output from the AI using Vercel AI SDK's tool-calling pattern, ensuring consistent data format.
**Confidence**: High

**Files to Create:**
- `lib/ai/tools/discovery-tool.ts` - Discovery tool definition

**Changes:**
- Define Zod schema for discovery tool input matching the DiscoveredFile interface
- Include fields for: files array, summary, confidence scores, reasoning
- Create `discoveryTool` using Vercel AI SDK `tool()` function
- Implement execute function that returns structured discovery results
- Export tool type definitions for use in handlers

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Tool schema matches expected AI output format
- [ ] Execute function returns properly typed results
- [ ] Tool integrates with Vercel AI SDK streamText
- [ ] All validation commands pass

---

### Step 4: Implement Discovery IPC Handler with AI Integration

**What**: Replace the placeholder implementation in `ai-discovery.handlers.ts` with actual AI-powered file discovery logic.
**Why**: Provides the backend functionality for streaming AI analysis results to the renderer, including progress updates and file discovery.
**Confidence**: Medium

**Files to Modify:**
- `electron/ipc/ai-discovery.handlers.ts` - Full implementation of AI discovery handler

**Changes:**
- Import discovery tool and prompt builder from lib/ai
- Parse model ID and get provider credentials (following clarification handler pattern)
- Build discovery prompt with repository overviews and context
- Configure streamText with discovery tool and proper model settings
- Implement stream processing loop sending progress, reasoning, and result chunks
- Handle tool_call and tool_result events to extract discovered files
- Send proper usage statistics on finish
- Implement error handling with detailed error chunks
- Update abort controller logic for clean cancellation

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handler processes requests and streams responses
- [ ] Progress updates sent during analysis
- [ ] Tool results parsed and sent as result chunks
- [ ] Cancellation works cleanly
- [ ] All validation commands pass

---

### Step 5: Create Discovery Query Key Factory

**What**: Add query key definitions for discovery-related queries following the existing pattern.
**Why**: Enables proper cache management and invalidation for discovery data through TanStack Query.
**Confidence**: High

**Files to Create:**
- `lib/queries/discovery.ts` - Discovery query key factory

**Changes:**
- Import createQueryKeys from @lukemorales/query-key-factory
- Define discoveryKeys with byFeatureRequestId scope
- Export query key factory for use in hooks

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Query keys follow existing project patterns
- [ ] Keys properly scoped to feature request
- [ ] All validation commands pass

---

### Step 6: Create useDiscovery Hook

**What**: Implement the main discovery workflow hook following the pattern established by `useClarification`.
**Why**: Centralizes discovery state management, streaming handling, run tracking, and database persistence.
**Confidence**: Medium

**Files to Create:**
- `hooks/use-discovery.ts` - Discovery workflow hook

**Changes:**
- Define hook interface with status, files, progress, error, and action methods
- Initialize state from feature request's researchFindings field
- Set up stream listener for discovery chunks
- Handle progress updates (percentage, currentStep)
- Handle result chunks to populate discovered files
- Handle reasoning chunks for AI thinking display
- Implement startDiscovery function with run creation
- Implement cancelDiscovery function with clean abort
- Implement saveDiscoveryResults to persist to database
- Implement restoreFromRun for run history restoration
- Implement file editing methods (updateFile, removeFile, addFile)
- Track run IDs and update run records on completion/failure

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Hook manages discovery lifecycle correctly
- [ ] Stream chunks processed and state updated
- [ ] Runs created and updated appropriately
- [ ] File editing operations work correctly
- [ ] All validation commands pass

---

### Step 7: Create Discovery Progress UI Component

**What**: Build the progress display component showing per-repository scanning status and overall progress.
**Why**: Provides user feedback during the AI discovery process, showing what stage the analysis is in and estimated completion.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/discovery-progress.tsx` - Progress display component

**Changes:**
- Accept progress props (percentage, currentStep, isLoading)
- Display progress bar with percentage
- Show current step text (Scanning, Analyzing, etc.)
- Display per-repository status indicators
- Include real-time file count display
- Add cancel button with CancelAiDialog integration
- Style using existing Tailwind patterns

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Progress bar animates smoothly
- [ ] Current step text updates correctly
- [ ] Cancel button triggers cancellation
- [ ] Styling consistent with project design
- [ ] All validation commands pass

---

### Step 8: Create File Card Component

**What**: Build the individual file card component displaying discovered file information.
**Why**: Presents each discovered file with its action, risk level, and summary in a scannable format.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/file-card.tsx` - File card display component

**Changes:**
- Accept discoveredFile props with path, action, risk, reason, dependencies, snippets
- Display file path with appropriate icon (create/modify/review/delete)
- Show action badge using existing Badge component with appropriate variant
- Display risk level badge (low=green, medium=amber, high=red)
- Show truncated reason text
- Include expand/collapse trigger for details
- Add "edited" badge display for modified entries
- Implement hover and focus states

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] File cards display all key information
- [ ] Badges show correct variants for action/risk
- [ ] Cards are keyboard accessible
- [ ] All validation commands pass

---

### Step 9: Create File Card Editor Component

**What**: Build the expanded editor view for modifying discovered file entries.
**Why**: Allows users to edit AI-discovered file recommendations, adding or modifying details as needed.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/file-card-editor.tsx` - Expandable file editor

**Changes:**
- Accept file data and onChange callback
- Display editable action select dropdown
- Display editable risk level select
- Include editable reason textarea
- Show dependency list with add/remove capability
- Display code snippets with syntax indication
- Include AI reasoning section (read-only)
- Add save and cancel buttons

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All fields are editable
- [ ] Changes trigger onChange callback
- [ ] Dependencies can be added/removed
- [ ] All validation commands pass

---

### Step 10: Create Add File Dialog Component

**What**: Build the dialog for manually adding files that the AI may have missed.
**Why**: Gives users control to include files they know are relevant but weren't discovered by AI analysis.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/add-file-dialog.tsx` - Manual file addition dialog

**Changes:**
- Use existing Dialog components from components/ui/dialog
- Include file path input with validation
- Add repository selector for multi-repo projects
- Include action type select dropdown
- Add risk level select dropdown
- Include reason textarea for user justification
- Implement form validation using Zod schema
- Add submit handler that calls onAdd callback

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog opens and closes correctly
- [ ] Form validates file path format
- [ ] All required fields enforced
- [ ] Submit creates properly typed file entry
- [ ] All validation commands pass

---

### Step 11: Create Discovery Results UI Component

**What**: Build the main results container displaying all discovered files with filtering and actions.
**Why**: Presents the complete discovery output in an organized, actionable format with editing capabilities.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/discovery-results.tsx` - Results container component

**Changes:**
- Accept discoveredFiles array and editing callbacks
- Display summary statistics (total files, by action, by risk)
- Implement scrollable file card list
- Integrate file card components with expand/collapse
- Integrate file card editor for expanded cards
- Add filter controls (by action, by risk, by repository)
- Include "Add File" button opening add file dialog
- Show empty state when no files discovered

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] File list renders correctly
- [ ] Filtering works for all criteria
- [ ] Editing propagates changes correctly
- [ ] Add file dialog integration works
- [ ] All validation commands pass

---

### Step 12: Create Discovery Cost Estimate Component

**What**: Build a cost estimation component for discovery operations following the clarification cost estimate pattern.
**Why**: Provides users with projected API costs before running discovery, helping them make informed decisions.
**Confidence**: High

**Files to Create:**
- `components/features/discovery/discovery-cost-estimate.tsx` - Cost estimation display

**Changes:**
- Accept modelId, repositoryOverviews, featureRequest, and customPrompt props
- Calculate estimated input tokens from all context sources
- Estimate output tokens based on expected file discovery size
- Use tokenlens for pricing lookup (following clarification pattern)
- Display cost estimate with token breakdown
- Show warning for high-cost estimates
- Support compact and full variants

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Token estimation accounts for all inputs
- [ ] Cost calculation matches clarification pattern
- [ ] Warning threshold displays correctly
- [ ] Both variants render properly
- [ ] All validation commands pass

---

### Step 13: Create Scope Selector Component

**What**: Build the scope configuration panel for defining discovery boundaries.
**Why**: Allows users to control which files and directories are included/excluded from discovery analysis.
**Confidence**: Medium

**Files to Create:**
- `components/features/discovery/scope-selector.tsx` - Scope configuration panel

**Changes:**
- Accept scopeConfig and onChange callback props
- Display glob pattern input for include patterns
- Display glob pattern input for exclude patterns
- Include preset pattern buttons (common exclusions like node_modules, .git)
- Add max files limit input
- Show per-repository scope toggle for multi-repo projects
- Use Collapsible component for expandable sections
- Implement validation for glob pattern syntax

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Glob patterns can be entered and validated
- [ ] Preset buttons add common patterns
- [ ] Max files limit enforced
- [ ] Changes propagate via onChange
- [ ] All validation commands pass

---

### Step 14: Create Discover Step Main Component

**What**: Build the main discover step component that integrates all sub-components into a cohesive workflow.
**Why**: Serves as the primary UI for the discovery phase, orchestrating settings, progress, and results display.
**Confidence**: Medium

**Files to Create:**
- `components/features/discover-step.tsx` - Main discover step component

**Changes:**
- Accept featureRequest and projectId props
- Use useDiscovery hook for state management
- Use useStepConfig for 'research' step configuration
- Use useCurrentRun for 'research' step run tracking
- Use useStaleSteps for stale state handling
- Use useFeatureRequestRepositories for selected repositories
- Check repository overview status using useRepositoryOverviewStatuses
- Display StaleWarningBanner when research step is stale
- Display header with StepSettingsPanel, cost estimate, and RunHistoryDropdown
- Display RepositoryOverviewStatusPanel showing overview requirements
- Show missing overview warning when repositories lack overviews
- Display scope selector in collapsible panel
- Show discovery progress during active runs
- Display discovery results after completion
- Include action buttons (Start Discovery, Cancel)
- Handle run restoration via RunHistoryDropdown

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Component integrates all sub-components correctly
- [ ] Step settings panel configured for 'research' step
- [ ] Repository overview requirements enforced
- [ ] Progress and results display at correct times
- [ ] Run history restoration works
- [ ] All validation commands pass

---

### Step 15: Integrate Discover Step into Feature Page

**What**: Replace the placeholder ResearchStep with the new DiscoverStep component in the feature workflow page.
**Why**: Connects the new discovery functionality to the main application workflow.
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Feature workflow page

**Changes:**
- Update import from ResearchStep to DiscoverStep
- Replace ResearchStep usage with DiscoverStep component
- Pass featureRequest prop (changed from featureRequestId) for full data access
- Ensure projectId prop is passed correctly

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] DiscoverStep renders in research workflow position
- [ ] Props passed correctly from page component
- [ ] Navigation between steps works
- [ ] All validation commands pass

---

### Step 16: Remove Legacy Research Step Component

**What**: Delete the old placeholder research-step.tsx file since it has been replaced.
**Why**: Removes unused code and prevents confusion with the new implementation.
**Confidence**: High

**Files to Delete:**
- `components/features/research-step.tsx` - Legacy placeholder component

**Changes:**
- Delete the file entirely
- Verify no other imports reference this file

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] File is deleted
- [ ] No broken imports
- [ ] Application builds successfully
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Application builds successfully with `pnpm run build`

## Notes

**Architectural Decisions:**
- The discover step follows the established clarify step pattern closely for consistency
- File editing uses local state with explicit save to avoid accidental data loss
- The scope selector is kept simple initially; folder tree navigation can be enhanced later
- Repository overview requirement is enforced at the UI level with helpful messaging

**Risk Mitigations:**
- AI responses are validated through Zod schemas before use
- Streaming errors are caught and displayed to users
- Cancel operations clean up resources properly
- Run history provides fallback to previous results

**Dependencies:**
- No new npm packages required - leverages existing Vercel AI SDK, TanStack Query, and UI components
- Relies on existing repository overview system for context data
- Uses established IPC channel patterns

**Future Enhancements (Out of Scope):**
- Interactive folder tree component for visual scope selection
- Dependency graph visualization for discovered files
- Code snippet syntax highlighting in file card details
- Batch file actions (select multiple, bulk edit)

---

## File Summary

### Files to Create (13)

| File | Purpose |
|------|---------|
| `lib/validations/discovery.ts` | Zod validation schemas |
| `lib/ai/prompts/discovery.ts` | AI prompt builder |
| `lib/ai/tools/discovery-tool.ts` | AI tool definition |
| `lib/queries/discovery.ts` | Query key factory |
| `hooks/use-discovery.ts` | Discovery workflow hook |
| `components/features/discovery/discovery-progress.tsx` | Progress display |
| `components/features/discovery/file-card.tsx` | File card display |
| `components/features/discovery/file-card-editor.tsx` | File editor |
| `components/features/discovery/add-file-dialog.tsx` | Add file dialog |
| `components/features/discovery/discovery-results.tsx` | Results container |
| `components/features/discovery/discovery-cost-estimate.tsx` | Cost estimation |
| `components/features/discovery/scope-selector.tsx` | Scope configuration |
| `components/features/discover-step.tsx` | Main step component |

### Files to Modify (2)

| File | Changes |
|------|---------|
| `electron/ipc/ai-discovery.handlers.ts` | Full AI implementation |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Integration |

### Files to Delete (1)

| File | Reason |
|------|--------|
| `components/features/research-step.tsx` | Replaced by discover-step.tsx |
