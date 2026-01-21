# Phase 9: Workflow Navigation & State - Feature Refinement

**Step**: 1 - Feature Refinement
**Start Time**: 2026-01-21T00:01:00.000Z
**End Time**: 2026-01-21T00:01:30.000Z
**Duration**: ~30 seconds
**Status**: Completed

## Original Request

Plan the implementation of Phase 9 of the feature request workflow from `docs/2026_01_20/plans/feature-request-workflow-implementation-order.md`

## Clarification Context

Clarification phase was skipped (score 5/5) - request was sufficiently detailed.

## Agent Prompt Sent

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections): 'Plan the implementation of Phase 9 (Workflow Navigation & State) of the feature request workflow from docs/2026_01_20/plans/feature-request-workflow-implementation-order.md'

**Project Context**:
- Tech Stack: Next.js 16.1.2, React 19.2.3, TypeScript 5, Electron 35, TanStack Query 5.90, TanStack Form 1.27, Drizzle ORM 0.45, Vercel AI SDK 6.0, Base UI React 1.1, CVA 0.7
- This is an Electron + Next.js desktop app for AI-powered feature planning
- Uses IPC communication between Electron main and renderer processes
- State management via TanStack Query for server state

**Phase 9 Specific Requirements**:
1. Step transition logic with soft validation and warning dialogs for incomplete data
2. Leave warning when AI is running (beforeunload + confirmation dialog)
3. Auto-save status indicators standardized across all steps
4. Save error handling with user feedback
5. Create centralized stale detection logic in lib/workflow/stale-detection.ts

**Already Implemented**:
- Stepper with checkmarks, stale icons, click navigation, current step highlighting (workflow-steps.tsx)
- Stale state management hooks (use-stale-steps.ts) with markStale, clearStale, isStale
- Auto-save in describe-step with isSaving state and saveStatusText pattern
- Cancel AI dialog component exists but not integrated for navigation

**Output ONLY the refined paragraph (200-500 words), nothing else. Do NOT use headers, bullet points, or sections. Focus on technical details while preserving the original scope.**
```

## Agent Response

Implement Phase 9 (Workflow Navigation & State) to establish comprehensive workflow-level behaviors for the four-step AI orchestration pipeline (Describe, Clarify, Discover, Plan) in this Electron-based Next.js desktop application. The existing workflow-steps.tsx component already provides the stepper UI with checkmarks, stale warning icons (via AlertTriangle), click navigation to completed steps, and current step highlighting using the stale steps passed from the parent component. The use-stale-steps.ts hook provides markStale, clearStale, and isStale utilities that persist stale state as JSON in the feature request's staleSteps field. Building on this foundation, Phase 9 requires implementing step transition logic with soft validation that warns users about incomplete data (such as missing repository selection, empty feature description, or incomplete clarification answers) while still allowing them to proceed by acknowledging warnings through confirmation dialogs. A critical requirement is the leave warning system that detects when AI operations are running (streaming clarification, discovery, or plan generation) and prevents navigation away from the step by showing a confirmation dialog that integrates the existing cancel-ai-dialog.tsx component, which currently exists but is not wired into the navigation flow. This should also implement beforeunload handling to prevent browser/Electron window closure during active AI operations. The auto-save status indicators need standardization across all workflow steps, using the saveStatusText pattern already established in describe-step.tsx (showing "Saving...", "Last saved X ago", or "Not saved yet") for consistency. Save error handling must provide clear user feedback through Alert components with retry messaging, following the existing pattern in describe-step.tsx that displays "Failed to save changes. Your content is preserved locally and will be retried automatically." Finally, create a centralized stale detection utility in lib/workflow/stale-detection.ts that encapsulates the step dependency graph (Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan) and provides functions to determine which downstream steps should be marked stale when an upstream step's output changes, consolidating the scattered stale marking logic currently embedded in individual step components.

## Refined Feature Request

Implement Phase 9 (Workflow Navigation & State) to establish comprehensive workflow-level behaviors for the four-step AI orchestration pipeline (Describe, Clarify, Discover, Plan) in this Electron-based Next.js desktop application. The existing workflow-steps.tsx component already provides the stepper UI with checkmarks, stale warning icons (via AlertTriangle), click navigation to completed steps, and current step highlighting using the stale steps passed from the parent component. The use-stale-steps.ts hook provides markStale, clearStale, and isStale utilities that persist stale state as JSON in the feature request's staleSteps field. Building on this foundation, Phase 9 requires implementing step transition logic with soft validation that warns users about incomplete data (such as missing repository selection, empty feature description, or incomplete clarification answers) while still allowing them to proceed by acknowledging warnings through confirmation dialogs. A critical requirement is the leave warning system that detects when AI operations are running (streaming clarification, discovery, or plan generation) and prevents navigation away from the step by showing a confirmation dialog that integrates the existing cancel-ai-dialog.tsx component, which currently exists but is not wired into the navigation flow. This should also implement beforeunload handling to prevent browser/Electron window closure during active AI operations. The auto-save status indicators need standardization across all workflow steps, using the saveStatusText pattern already established in describe-step.tsx (showing "Saving...", "Last saved X ago", or "Not saved yet") for consistency. Save error handling must provide clear user feedback through Alert components with retry messaging, following the existing pattern in describe-step.tsx that displays "Failed to save changes. Your content is preserved locally and will be retried automatically." Finally, create a centralized stale detection utility in lib/workflow/stale-detection.ts that encapsulates the step dependency graph (Describe affects Clarify/Discover/Plan, Clarify affects Discover/Plan, Discover affects Plan) and provides functions to determine which downstream steps should be marked stale when an upstream step's output changes, consolidating the scattered stale marking logic currently embedded in individual step components.

## Length Analysis

- **Original word count**: 27 words
- **Refined word count**: 330 words
- **Expansion ratio**: 12.2x

## Scope Analysis

**Intent Preservation**: Core intent preserved - implementing Phase 9 workflow navigation & state
**Technical Context Added**: Yes - specific components, patterns, and dependencies identified
**Feature Creep**: None - focused on Phase 9 requirements only

## Validation Results

- Format: Single paragraph (no headers, bullet points, sections) ✓
- Length: 330 words (within 200-500 target) ✓
- Technical detail: Specific file references and patterns included ✓
- Scope: Aligned with Phase 9 requirements ✓
