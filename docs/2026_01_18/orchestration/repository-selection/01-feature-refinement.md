# Step 1: Feature Request Refinement

## Metadata

| Field | Value |
|-------|-------|
| Step | 1 - Feature Refinement |
| Status | Completed |
| Started | 2026-01-18 |
| Duration | ~20 seconds |

## Original Request

Add repository selection to the feature request workflow with the following approach:

1. **Optional at creation/editing**: Add an optional "Target repositories" field when creating or editing a feature request. This should show the repositories associated with the project and allow users to select which ones the feature targets. Store this selection with the feature request.

2. **Required at file discovery step**: On the file discovery step of the feature request workflow, show a repository selector that is pre-populated with any repositories previously selected on the feature request. Require at least one repository to be selected before the user can proceed with file discovery. This becomes the "source of truth" for that workflow run.

3. **Sync between both**: If repos are selected during creation, they should appear pre-selected at file discovery. Changes at file discovery should update what's stored on the feature request.

## Context Provided

- Electron + Next.js desktop app using TanStack Form for forms, TanStack Query for data fetching
- Drizzle ORM with SQLite database, repository pattern for data access
- Feature requests stored in `feature-requests` table with workflow steps: entry, refine, research, plan
- Repositories table already exists with `projectId` relationship
- Base UI primitives with CVA for styling, IPC communication between renderer and main process
- Existing form field components: TextField, TextareaField, SelectField, CheckboxField
- JSON text columns used for storing arrays (e.g., clarificationAnswers, clarificationQuestions)

## Agent Prompt

Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections). Using the project context, expand with relevant technical details while maintaining core intent. Output ONLY the refined paragraph (200-500 words).

## Refined Feature Request

Add repository selection to the feature request workflow by implementing a junction table `feature-request-repositories` in the Drizzle schema that links feature requests to repositories through `featureRequestId` and `repositoryId` foreign keys, enabling many-to-many relationships while maintaining referential integrity with cascade deletes. Extend the feature request creation and editing forms (using the existing TanStack Form setup with `useAppForm`) to include an optional multi-select field for "Target repositories" that queries available repositories for the current project via the existing repositories query hooks and displays them as selectable options, storing selections through the new junction table via IPC handlers following the established repository pattern. On the file discovery step of the feature request workflow (the "research" step in the current implementation), render a repository selector component that is pre-populated with any repositories previously associated with the feature request, making this selection required before the user can initiate file discovery—implement this validation at the form level using Zod schemas in `lib/validations/` to ensure at least one repository is selected. The file discovery step becomes the source of truth for that workflow run, meaning any changes to repository selection at this step should persist back to the feature request's stored repository associations through a mutation that updates the junction table, keeping both the creation/editing context and the workflow context synchronized. Create a new IPC handler domain file `feature-request-repositories.handlers.ts` following the existing patterns in `electron/ipc/` that exposes methods for getting, setting, and updating repository associations for a feature request, with corresponding query hooks in `hooks/queries/` that leverage the query key factory pattern for proper cache invalidation when associations change. The UI component for repository selection should follow the CVA pattern used in `components/ui/`, potentially extending or composing with the existing CheckboxField or creating a new MultiSelectField component that renders repository options with checkboxes and supports the required validation state visually. This progressive refinement approach allows users to optionally specify target repositories when they know them upfront during feature request creation, while ensuring repositories are definitively selected before the file discovery step that requires them to scan the codebase for relevant files.

## Length Analysis

| Metric | Value |
|--------|-------|
| Original Word Count | ~180 words |
| Refined Word Count | ~350 words |
| Expansion Ratio | ~2x |

## Validation Results

- Format Check: PASS (single paragraph, no headers/sections)
- Length Check: PASS (350 words, 2x expansion)
- Scope Check: PASS (core intent preserved)
- Quality Check: PASS (technical context added appropriately)
