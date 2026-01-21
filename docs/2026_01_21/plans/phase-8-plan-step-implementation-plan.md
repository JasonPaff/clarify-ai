# Phase 8: Plan Step Implementation - Implementation Plan

Generated: 2026-01-21
Original Request: Implement Phase 8 of the feature request workflow - Plan Step Implementation

## Overview

**Estimated Duration**: 5-7 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

- Create Zod validation schemas for plan data structures following existing validation patterns
- Build AI integration with prompt builder, tool definition, and IPC handlers using Vercel AI SDK streaming
- Develop React components for plan display with markdown rendering, progress tracking, and quality gates
- Implement export functionality via clipboard, file save dialogs, and direct docs folder export
- Integrate PlanStep component into the feature workflow page to complete the orchestration flow

## Prerequisites

- [ ] Clarify and Discover steps are fully functional and tested
- [ ] Feature request schema has `implementationPlan` field available for storing plan data
- [ ] IPC channels for plan AI are already defined in `electron/ipc/channels.ts`
- [ ] Preload script already exposes `api.ai.plan` methods (generate, cancel, onStream)
- [ ] Understanding of existing discovery and clarification component patterns

## Implementation Steps

### Step 1: Create Plan Validation Schemas

**What**: Define Zod schemas for plan-related data structures including PlanStep, QualityGate, and ImplementationPlan
**Why**: Provides type safety and validation for plan data flowing between AI, UI components, and database storage
**Confidence**: High

**Files to Create:**

- `lib/validations/plan.ts` - Plan validation schemas and parse/stringify helpers

**Changes:**

- Define `planStatusSchema` enum with states: idle, generating, completed, failed
- Define `qualityGateSchema` for validation checkpoints with type (command/manual), description, and optional command
- Define `planStepSchema` with title, description, files array, order, complexity, and quality gates
- Define `implementationPlanSchema` with overview, summary, steps array, prerequisites, risks, and testing strategy
- Create parse helpers: `parsePlanStatus`, `parsePlanSteps`, `parseImplementationPlan`
- Create stringify helpers: `stringifyImplementationPlan`, `stringifyPlanSteps`
- Export all types inferred from schemas

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All schemas validate correctly with valid and invalid input data
- [ ] Parse functions handle null/undefined/malformed JSON gracefully
- [ ] All validation commands pass

---

### Step 2: Create Plan Prompt Template

**What**: Build the plan prompt template with variable substitution for feature context, discovered files, and clarifications
**Why**: Provides a customizable, well-structured prompt that guides the AI to generate actionable implementation plans
**Confidence**: High

**Files to Create:**

- `lib/ai/prompts/plan.ts` - Plan prompt builder following discovery.ts pattern

**Changes:**

- Define `PlanRepositoryOverview` interface matching discovery pattern
- Create `DEFAULT_PLAN_PROMPT` constant with structured sections for implementation planning
- Include template variables: `{featureRequest}`, `{repositoryOverviews}`, `{clarificationContext}`, `{discoveredFiles}`, `{scopeInstructions}`
- Add expert implementation planner persona instructions focusing on actionable steps and quality gates
- Create `buildPlanPrompt` function that accepts feature request, repository overviews, clarification context, discovered files, and optional custom prompt
- Add helper functions for building sections: `buildDiscoveredFilesSection`, `buildRepositoryOverviewsSection`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Prompt template includes all required context sections
- [ ] `buildPlanPrompt` correctly substitutes all template variables
- [ ] All validation commands pass

---

### Step 3: Create Plan Tool Definition

**What**: Define the Vercel AI SDK tool that the AI calls to report the generated implementation plan
**Why**: Structures the AI output into a validated format that can be processed by the IPC handler
**Confidence**: High

**Files to Create:**

- `lib/ai/tools/plan-tool.ts` - Plan tool definition following discovery-tool.ts pattern

**Changes:**

- Import `tool` from 'ai' and `z` from 'zod'
- Define `planToolInputSchema` with Zod schema matching implementation plan structure
- Include fields: overview, summary, steps array (with title, description, files, order, complexity, qualityGates), prerequisites, risks, testingStrategy, confidence, reasoning
- Define `PlanToolInput` and `PlanToolResult` types
- Create `planTool` using Vercel AI SDK `tool()` function with inputSchema and execute handler
- Execute function returns structured plan data with timestamp metadata

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Tool schema validates all required plan fields
- [ ] Tool executes and returns properly structured result
- [ ] All validation commands pass

---

### Step 4: Update Plan IPC Handlers with Real AI Integration

**What**: Replace the placeholder implementation in ai-plan.handlers.ts with real AI streaming using Vercel AI SDK
**Why**: Enables actual plan generation using the configured AI models with proper streaming and tool handling
**Confidence**: High

**Files to Modify:**

- `electron/ipc/ai-plan.handlers.ts` - Replace mock with real AI implementation

**Changes:**

- Update `PlanGenerateRequest` interface to include all necessary fields (maxTokens, temperature, thinkingBudget, enableThinking)
- Update `PlanStreamChunk` interface to include progress updates and tool result data
- Import AI SDK functions: `streamText`, `stepCountIs` from 'ai'
- Import plan tool and prompt builder from lib/ai/tools and lib/ai/prompts
- Import provider utilities from lib modules
- Implement streaming logic following discovery handler pattern
- Handle stream events: text-delta, reasoning-delta, tool-call, tool-result, finish, error
- Send progress updates at key stages: initializing, building prompt, analyzing, generating plan
- Parse and validate tool results before sending to renderer
- Clean up abort controller on completion or cancellation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Handler successfully streams plan generation with progress updates
- [ ] Tool results are properly parsed and sent to renderer
- [ ] Cancellation works correctly via abort controller
- [ ] All validation commands pass

---

### Step 5: Create Plan Workflow Hook

**What**: Build the usePlan hook for managing plan generation state, streaming, and persistence
**Why**: Encapsulates all plan workflow logic including stream handling, run tracking, and database persistence
**Confidence**: High

**Files to Create:**

- `hooks/use-plan.ts` - Plan workflow hook following use-discovery.ts pattern

**Changes:**

- Define `PlanModelConfig` interface with modelId, temperature, maxTokens, thinkingEnabled, thinkingBudget, customPrompt
- Define `UsePlanOptions` interface with featureRequest, currentRun, modelConfig
- Define `UsePlanResult` interface with state values and action functions
- Implement state management for: status, plan, progress, streamingText, reasoningText, error, isLoading
- Set up stream listener subscription/unsubscription with cleanup on unmount
- Handle stream chunks: progress, text, reasoning, tool_result, finish, error
- Implement `startPlanGeneration` function that creates run, sets up stream, and invokes AI
- Implement `cancelPlanGeneration` for aborting ongoing generation
- Implement `savePlanResults` for persisting to feature request's implementationPlan field
- Implement `restoreFromRun` for loading previous run data
- Handle feature request ID changes with state reset
- Track run ID with ref for async callback access

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Hook manages all plan generation state correctly
- [ ] Stream events are properly handled and state is updated
- [ ] Run records are created and updated appropriately
- [ ] All validation commands pass

---

### Step 6: Create Plan Progress Component

**What**: Build the PlanProgress component for displaying generation status and progress
**Why**: Provides visual feedback during the potentially long-running plan generation process
**Confidence**: High

**Files to Create:**

- `components/features/plan/plan-progress.tsx` - Progress display following discovery-progress.tsx pattern

**Changes:**

- Define props interface with status, currentStep, percentage, isLoading, onCancel
- Import Progress from Base UI and status icons from lucide-react
- Render status icon based on current state (loading spinner, checkmark, error)
- Display current step text with progress percentage
- Render Base UI Progress bar when actively generating
- Include cancel button that triggers CancelAiDialog for confirmation
- Handle all status states: idle, generating, completed, failed

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Progress component displays correct status indicators
- [ ] Progress bar updates smoothly during generation
- [ ] Cancel button properly triggers confirmation dialog
- [ ] All validation commands pass

---

### Step 7: Create Plan Step Card Component

**What**: Build the PlanStepCard component for displaying individual implementation steps
**Why**: Provides a clear visual representation of each step with files, complexity, and quality gates
**Confidence**: High

**Files to Create:**

- `components/features/plan/plan-step-card.tsx` - Individual step display component

**Changes:**

- Define props interface with step data, step number, and optional onEdit callback
- Display step number badge, title, and complexity indicator
- Render description with markdown support using prose styling
- List affected files with file type icons and paths
- Display quality gates as a checklist with command/manual type indicators
- Use CVA variants for complexity badge colors (low=green, medium=amber, high=red)
- Include collapsible section for detailed content when step is long

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Step cards display all relevant information clearly
- [ ] Complexity badges use correct color variants
- [ ] Quality gates render as actionable checklist items
- [ ] All validation commands pass

---

### Step 8: Create Quality Gate List Component

**What**: Build the QualityGateList component for displaying and tracking quality validation checkpoints
**Why**: Enables users to verify plan quality through command-based and manual validation checks
**Confidence**: High

**Files to Create:**

- `components/features/plan/quality-gate-list.tsx` - Quality gates checklist component

**Changes:**

- Define props interface with quality gates array and optional onGateToggle callback
- Render list of quality gates with checkbox for tracking completion
- Display command gates with monospace styling and copy-to-clipboard button
- Display manual gates with description and optional guidance text
- Include visual distinction between command type (terminal icon) and manual type (eye icon)
- Track local completion state for gates when onGateToggle is provided

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Quality gates render with appropriate type indicators
- [ ] Command gates have copyable command text
- [ ] Completion tracking works when enabled
- [ ] All validation commands pass

---

### Step 9: Create Plan Cost Estimate Component

**What**: Build the PlanCostEstimate component for displaying token usage and cost estimation
**Why**: Helps users understand the resource implications before generating plans
**Confidence**: Medium

**Files to Create:**

- `components/features/plan/plan-cost-estimate.tsx` - Cost estimation display following discovery-cost-estimate.tsx pattern

**Changes:**

- Define props interface with modelId, featureRequest content, repository overviews, discovered files, and variant
- Calculate estimated input tokens based on prompt template, context, and discovered files
- Display estimated cost based on model pricing
- Support compact and full variants for different display contexts
- Show token breakdown when in full variant mode
- Include loading state when model config is being fetched

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Cost estimates reflect actual prompt size including discovered files context
- [ ] Both compact and full variants render correctly
- [ ] All validation commands pass

---

### Step 10: Create Plan Results Component

**What**: Build the PlanResults component for displaying the complete generated implementation plan
**Why**: Provides a comprehensive view of the plan with navigation, editing, and export capabilities
**Confidence**: High

**Files to Create:**

- `components/features/plan/plan-results.tsx` - Complete plan display following discovery-results.tsx pattern

**Changes:**

- Define props interface with plan data, onExport callback, and optional edit handlers
- Render plan header with title, overview summary, and action buttons (export, regenerate)
- Display prerequisites section with bulleted list
- Render steps using PlanStepCard components with step navigation
- Display risks section with warning styling
- Display testing strategy section
- Include QualityGateList for overall plan quality gates
- Add step navigation sidebar or tabs for easy step switching

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Complete plan renders with all sections visible
- [ ] Step navigation allows jumping between steps
- [ ] Export action triggers properly
- [ ] All validation commands pass

---

### Step 11: Create Export Dialog Component

**What**: Build the ExportDialog component for plan export options (clipboard, file save, docs folder)
**Why**: Provides users with multiple export destinations following project documentation conventions
**Confidence**: High

**Files to Create:**

- `components/features/plan/export-dialog.tsx` - Export options dialog component

**Changes:**

- Define props interface with plan data, featureName, onExport callback, and trigger children
- Create dialog with three export options: Copy to Clipboard, Save to File, Export to Docs
- Implement clipboard copy using navigator.clipboard.writeText with formatted markdown
- Implement file save using existing dialog.saveFile IPC with .md filter
- Implement docs folder export using fs.writeFile IPC to `docs/YYYY_MM_DD/plans/{feature-name}-implementation-plan.md`
- Generate formatted markdown output with all plan sections
- Show success/error toast notifications after export actions
- Include preview of export content in dialog

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All three export options work correctly
- [ ] Markdown output is properly formatted with all plan content
- [ ] Docs folder export follows project naming conventions
- [ ] All validation commands pass

---

### Step 12: Create Plan Panel Component

**What**: Build the PlanPanel component as the main container for plan generation workflow
**Why**: Orchestrates the plan generation UI flow including idle state, progress, and results display
**Confidence**: High

**Files to Create:**

- `components/features/plan/plan-panel.tsx` - Main plan generation panel

**Changes:**

- Define props interface with featureRequest, modelConfig, currentRun, isConfigLoading, and repositoryOverviews
- Use usePlan hook for state management
- Render idle state with "Generate Plan" button when no plan exists
- Render PlanProgress component during generation
- Render PlanResults component when plan is completed
- Display error state with retry option when generation fails
- Handle model configuration validation before allowing generation
- Pass discovered files and clarification context from feature request to plan generation

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Panel correctly transitions between idle, generating, and completed states
- [ ] Error states are properly displayed with recovery options
- [ ] All validation commands pass

---

### Step 13: Create Plan Step Wrapper Component

**What**: Build the PlanStep component that wraps the plan panel with step header, settings, and run history
**Why**: Provides consistent step UI following the pattern established by ClarifyStep and DiscoverStep
**Confidence**: High

**Files to Create:**

- `components/features/plan-step.tsx` - Plan step wrapper following clarify-step.tsx pattern

**Changes:**

- Define props interface with featureRequest and projectId
- Use useStepConfig hook to fetch plan step configuration
- Use useCurrentRun hook to fetch current plan run
- Use useStaleSteps hook for stale state management
- Build modelConfig from step configuration following existing pattern
- Render StaleWarningBanner when plan step is stale
- Render StepSettingsPanel for step configuration
- Render PlanCostEstimate and RunHistoryDropdown in header
- Render PlanPanel as main content
- Handle stale re-run and dismiss callbacks
- Track rerun key for forcing panel remount

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Step settings panel shows plan-specific configuration
- [ ] Run history dropdown shows plan generation history
- [ ] Stale warning appears when dependencies change
- [ ] All validation commands pass

---

### Step 14: Integrate Plan Step into Feature Workflow Page

**What**: Add the PlanStep component to the feature workflow page for the plan step
**Why**: Completes the workflow integration, allowing users to access plan generation from the stepper
**Confidence**: High

**Files to Modify:**

- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Add PlanStep to workflow

**Changes:**

- Import PlanStep component from components/features/plan-step
- Replace placeholder content for plan step with PlanStep component
- Pass featureRequest and projectId props to PlanStep
- Verify step content metadata is correct for plan step

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Plan step renders PlanStep component instead of placeholder
- [ ] Navigation to plan step shows proper UI
- [ ] All validation commands pass

---

### Step 15: Update Type Exports and Re-exports

**What**: Ensure all new types are properly exported from their respective modules for use across the application
**Why**: Maintains clean type imports and prevents circular dependencies
**Confidence**: High

**Files to Modify:**

- `electron/ipc/ai-plan.handlers.ts` - Export types for renderer access

**Changes:**

- Verify PlanStreamChunk, PlanGenerateRequest, ImplementationPlan, PlanStep, PlanQualityGate types are exported
- Update any imports in preload.ts if needed for type references
- Ensure types are accessible from both main and renderer processes

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] All plan-related types are properly exported
- [ ] No circular dependency issues
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Application builds successfully with `pnpm run build`
- [ ] Plan generation streams progress and completes with valid output
- [ ] Export functionality creates properly formatted markdown files
- [ ] Run history correctly persists and restores plan data
- [ ] Stale step detection triggers when clarify/discover results change

## Notes

**Architecture Decisions:**

- Following the established patterns from discovery and clarification steps ensures consistency and maintainability
- The plan tool uses Vercel AI SDK's tool pattern for structured output, matching the discovery implementation
- Export to docs folder follows the project's YYYY_MM_DD naming convention for documentation

**Risk Considerations:**

- Plan generation may take longer than other steps due to the comprehensive output required; ensure progress updates are frequent
- Large discovered file lists may impact token usage significantly; consider adding token limit warnings
- Markdown rendering in plan results should handle edge cases like code blocks and special characters

**Dependencies:**

- The plan step depends on data from both clarify (clarificationAnalysis) and discover (researchFindings) steps
- Repository overviews must be available for context, same as discovery step
- Step configuration must support the 'plan' step type in the database schema
