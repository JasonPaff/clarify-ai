# Step 2: File Discovery

**Status**: Completed
**Started**: 2026-01-20T00:02:00.000Z
**Completed**: 2026-01-20T00:03:00.000Z
**Duration**: ~60 seconds

---

## Refined Request Used as Input

Implement Phase 6 of the feature request workflow to enhance the Clarify Step with comprehensive settings, flow improvements, run history integration, cost estimation, and stale state detection. [Full refined request as documented in Step 1]

---

## Discovery Statistics

| Category                 | Count |
| ------------------------ | ----- |
| Directories Explored     | 15+   |
| Candidate Files Examined | 65+   |
| Highly Relevant Files    | 42    |
| Supporting Files         | 15    |

---

## Discovered Files by Priority

### Critical Priority (22 files - MUST be modified)

#### Clarification Components

| File Path                                                   | Relevance                                                                    | Changes Needed                                                                                                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/features/clarification/clarification-panel.tsx` | Main Clarify step component - orchestrates the entire clarification workflow | Integrate StepSettingsPanel, add RunHistoryDropdown, implement skip/request more buttons, handle streaming completion before showing answers, integrate StaleWarningBanner |
| `components/features/clarification/model-selector.tsx`      | Current model selector used in clarification panel                           | May need to be deprecated or shared with StepSettingsPanel since settings panel already has model selection                                                                |
| `components/features/clarification/advanced-settings.tsx`   | Custom prompt settings                                                       | Migrate into StepSettingsPanel pattern or deprecate                                                                                                                        |
| `components/features/clarification/questions-list.tsx`      | Renders list of AI-generated questions                                       | Add logic to wait for streaming to complete before rendering                                                                                                               |
| `components/features/clarification/question-card.tsx`       | Individual question card with options                                        | No major changes needed                                                                                                                                                    |
| `components/features/clarification/analysis-summary.tsx`    | Displays AI analysis findings                                                | Handle "no clarification needed" scenario with override option                                                                                                             |
| `components/features/clarification/streaming-analysis.tsx`  | Shows streaming analysis text                                                | May need updates for streaming completion detection                                                                                                                        |

#### Workflow Components

| File Path                                                   | Relevance                                                                    | Changes Needed                                                      |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `components/features/workflow-steps.tsx`                    | Workflow step navigation - contains "Refine" label                           | Rename 'Refine' to 'Clarify' in WORKFLOW_STEPS array                |
| `components/features/workflow/step-settings-panel.tsx`      | Reusable settings panel with model, temperature, max tokens, thinking budget | Update stepLabel function to return 'Clarify' for the 'refine' step |
| `components/features/workflow/run-history-dropdown.tsx`     | Run history selection dropdown                                               | Integrate into Clarify step UI                                      |
| `components/features/workflow/restore-run-dialog.tsx`       | Dialog for restoring previous runs                                           | Update stepLabel to show 'Clarification' for 'refine' step          |
| `components/features/workflow/stale-warning-banner.tsx`     | Stale state warning banner                                                   | Integrate into Clarify step when Describe content changes           |
| `components/features/workflow/token-estimation-warning.tsx` | Token/cost estimation display                                                | Adapt for pre-run cost estimation in Clarify step                   |

#### Page Components

| File Path                                                      | Relevance                                                 | Changes Needed                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Feature workflow page - contains step content definitions | Update stepContent for 'refine' to show 'Clarify' title and description        |
| `components/features/describe-step.tsx`                        | Describe step implementation                              | Add stale state detection when content changes after clarification is complete |

#### Hooks

| File Path                                   | Relevance                                                | Changes Needed                                                                                         |
| ------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `hooks/use-clarification.ts`                | Main clarification hook - manages AI streaming and state | Add run history save on completion, implement streaming completion detection, add stale state tracking |
| `hooks/queries/use-feature-request-runs.ts` | Run history query hooks                                  | Use for saving clarification runs with 'clarify' step type                                             |
| `hooks/queries/use-step-configurations.ts`  | Step configuration query hooks                           | Use for Clarify step settings                                                                          |
| `hooks/queries/use-feature-requests.ts`     | Feature request CRUD hooks                               | Add stale steps management                                                                             |

#### Database

| File Path                                  | Relevance                                     | Changes Needed                                                  |
| ------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| `db/schema/feature-requests.schema.ts`     | Feature request schema - has staleSteps field | Use staleSteps field to track when Clarify results become stale |
| `db/schema/feature-request-runs.schema.ts` | Run history schema - step type 'refine'       | Schema already supports 'refine' step type                      |
| `db/schema/step-configurations.schema.ts`  | Step settings schema - step type 'refine'     | Schema already supports 'refine' step type                      |

### High Priority (11 files - Likely need changes)

| File Path                                            | Relevance                            | Changes Needed                                           |
| ---------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `db/repositories/feature-requests.repository.ts`     | Feature request repository           | May need stale steps update methods                      |
| `db/repositories/feature-request-runs.repository.ts` | Run history repository               | Use for saving clarification runs                        |
| `db/repositories/step-configurations.repository.ts`  | Step settings repository             | Use for Clarify step settings persistence                |
| `electron/ipc/ai-clarification.handlers.ts`          | AI clarification streaming handler   | May need token counting for cost estimation              |
| `electron/ipc/feature-request-runs.handlers.ts`      | Run history IPC handlers             | Use for run persistence                                  |
| `electron/ipc/step-configurations.handlers.ts`       | Step config IPC handlers             | Use for settings persistence                             |
| `electron/ipc/channels.ts`                           | IPC channel definitions              | Reference for channel names                              |
| `lib/ai/prompts/clarification.ts`                    | Clarification prompt template        | May need updates for "no clarification needed" detection |
| `lib/ai/tools/clarification-tool.ts`                 | AI tool definition for clarification | May need updates for handling complete requests          |
| `lib/queries/feature-request-runs.ts`                | Query key factory for runs           | Use for cache invalidation                               |
| `lib/queries/step-configurations.ts`                 | Query key factory for configs        | Use for cache invalidation                               |

### Medium Priority (6 files - May need updates or serve as references)

| File Path                                                 | Relevance                           | Changes Needed                               |
| --------------------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `components/features/workflow/discard-results-dialog.tsx` | Dialog for discarding results       | Reference pattern for skip clarification     |
| `components/features/workflow/cancel-ai-dialog.tsx`       | Dialog for canceling AI operations  | Reference pattern                            |
| `components/features/workflow/run-history-item.tsx`       | Individual run history item display | May be used in dropdown                      |
| `lib/validations/clarification.ts`                        | Clarification Zod schemas           | Reference for types; may need status updates |
| `lib/ai/models.ts`                                        | Model definitions and utilities     | Reference for model info and pricing         |
| `hooks/use-available-models.ts`                           | Available models hook               | Reference for model selection                |

### Low Priority (3 files - Might be affected)

| File Path                                           | Relevance                    | Changes Needed                |
| --------------------------------------------------- | ---------------------------- | ----------------------------- |
| `components/features/research-step.tsx`             | Research step implementation | Reference pattern             |
| `components/settings/api-key-table.tsx`             | Contains "Refine" text       | May need label update         |
| `components/features/edit-feature-request-form.tsx` | Feature request form         | May contain Refine references |

---

## Architecture Insights

### Key Patterns Discovered

1. **StepSettingsPanel Pattern**: The `describe-step.tsx` demonstrates how to integrate `StepSettingsPanel` at the top of a step component. The Clarify step should follow this pattern, migrating its current model selector and advanced settings into the collapsible settings panel.

2. **Run History Pattern**: `RunHistoryDropdown` is already built and used in other steps. It takes `featureRequestId` and `step` props, manages current run selection, and shows `RestoreRunDialog` for version switching.

3. **Stale State Pattern**: The `feature-requests.schema.ts` already has a `staleSteps` text field (stored as JSON array). The `workflow-steps.tsx` component reads this and displays warning indicators. `StaleWarningBanner` provides the UI for alerting users.

4. **Streaming Completion**: The `use-clarification.ts` hook tracks streaming state through the `status` field ('idle' -> 'analyzing' -> 'questions_ready'/'skipped'/'completed'). The transition to 'questions_ready' happens when tool_result is received.

5. **Cost Estimation**: The `tokenlens` library is already installed in `package.json`. `TokenEstimationWarning` component demonstrates the pattern for displaying token counts and cost warnings.

6. **Step Type Values**: Database schemas use `'refine'` as the step type value, not `'clarify'`. The UI labels should say "Clarify" but the database/code values remain `'refine'`.

### Existing Similar Functionality

1. **Describe Step Settings**: `describe-step.tsx` already uses `StepSettingsPanel` with step='describe' - same pattern needed for Clarify.

2. **Run History in Other Steps**: The `RunHistoryDropdown` component is ready for use; just needs integration into clarification panel.

3. **Skip Functionality**: The clarification panel already handles the 'skipped' status when AI determines no clarification needed (detailScore >= 4), but needs the "Ask Questions Anyway" override to trigger force clarification.

4. **Token Estimation**: `TokenEstimationWarning` shows context token estimation; similar component needed for pre-run cost estimation.

### Integration Points

1. **Describe -> Clarify Stale Detection**: When `describe-step.tsx` saves content changes, it should mark 'clarify' (stored as 'refine') as stale in the feature request's `staleSteps` field.

2. **Run History Save Point**: After successful clarification completion in `use-clarification.ts`, create a run record in `feature_request_runs` table with step='refine'.

3. **Settings Persistence**: Use `useStepConfig` and `useUpsertStepConfig` hooks with step='refine' to load/save clarification settings.

4. **Cost Calculation**: Use `tokenlens` to count tokens in the raw feature request content, then multiply by selected model's input token price.

---

## File Validation Results

All discovered files exist in the codebase and are accessible. The following key files were verified:

- ✅ `components/features/clarification/clarification-panel.tsx` - exists
- ✅ `components/features/workflow-steps.tsx` - exists
- ✅ `components/features/workflow/step-settings-panel.tsx` - exists
- ✅ `components/features/workflow/run-history-dropdown.tsx` - exists
- ✅ `components/features/workflow/stale-warning-banner.tsx` - exists
- ✅ `hooks/use-clarification.ts` - exists
- ✅ `db/schema/feature-requests.schema.ts` - exists
- ✅ `db/schema/feature-request-runs.schema.ts` - exists

---

**MILESTONE:STEP_2_COMPLETE**
