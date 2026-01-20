# Step 2: AI-Powered File Discovery

## Step Metadata

| Field | Value |
|-------|-------|
| Start Time | 2026-01-20T00:02:00Z |
| End Time | 2026-01-20T00:03:00Z |
| Duration | ~60 seconds |
| Status | **Completed** |

## Refined Request Used as Input

Phase 5 of the feature request workflow requires refactoring the initial data collection step from a generic entry point into a dedicated "Describe Step" component that integrates repository selection, overview generation, and context file management while maintaining step-level configuration persistence. The implementation should rename entry-step.tsx to describe-step.tsx and restructure it to serve as the first step in the three-step orchestration workflow (Describe → Clarify → Discover → Plan).

## Discovery Analysis

### Exploration Summary
- Explored 12 directories
- Examined 65+ candidate files
- Found 24 highly relevant files
- Identified 18 supporting files

## Discovered Files by Priority

### Critical Priority (Must Modify)

| # | File | Reason |
|---|------|--------|
| 1 | `components/features/entry-step.tsx` | Core file to rename to describe-step.tsx. Currently handles basic feature request text editing. Will need complete restructuring. |
| 2 | `components/features/workflow-steps.tsx` | Defines WORKFLOW_STEPS constant with step IDs. Must update 'entry' to 'describe'. |
| 3 | `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Main feature workflow page that imports EntryStep. Must update to DescribeStep. |

### High Priority (Core Integration)

| # | File | Reason |
|---|------|--------|
| 4 | `components/features/repository-selector.tsx` | Existing component for repository selection. Needs "inherit with edit" enhancement. |
| 5 | `components/features/workflow/step-settings-panel.tsx` | Complete settings panel with model/temperature/tokens/thinking. Ready to integrate. |
| 6 | `components/features/workflow/context-file-picker.tsx` | File selection with native dialogs. Needs token estimation enhancement. |
| 7 | `components/features/workflow/context-file-list.tsx` | Displays selected context files. Used by ContextFilePicker. |
| 8 | `components/repositories/repository-overview-generator.tsx` | Reference for overview regeneration capability. |
| 9 | `hooks/queries/use-feature-request-repositories.ts` | Query hooks for repository associations. Has useSetFeatureRequestRepositories. |
| 10 | `hooks/queries/use-step-configurations.ts` | Query hooks for step config CRUD. Has useUpsertStepConfig. |
| 11 | `hooks/queries/use-repository-overviews.ts` | Has useRepositoryOverviewStatuses for batch status fetching. |
| 12 | `hooks/queries/use-feature-request-context-files.ts` | Context file management hooks. |

### Medium Priority (Supporting/Reference)

| # | File | Reason |
|---|------|--------|
| 13 | `components/features/research-step.tsx` | Reference pattern for step component with repository selection. |
| 14 | `components/features/clarification/clarification-panel.tsx` | Reference for complex step UI with streaming. |
| 15 | `hooks/queries/use-repositories.ts` | Contains useRepositoriesWithOverviewStatus. |
| 16 | `hooks/queries/use-feature-requests.ts` | Has useUpdateFeatureRequest for saving. |
| 17 | `hooks/useElectron.ts` | Central Electron API hooks. |
| 18 | `hooks/use-debounced-callback.ts` | Utility for debounced auto-save. |
| 19 | `lib/forms/form-hook.ts` | TanStack Form configuration with useAppForm. |
| 20 | `lib/validations/feature-request.ts` | Validation schemas including entryStepFormSchema. |
| 21 | `lib/validations/feature-request-repositories.ts` | Repository IDs validation. |

### Low Priority (Schema/Reference)

| # | File | Reason |
|---|------|--------|
| 22 | `db/schema/step-configurations.schema.ts` | May need 'describe' step type added. |
| 23 | `db/schema/feature-request-repositories.schema.ts` | Junction table schema. |
| 24 | `db/schema/feature-request-context-files.schema.ts` | Context files schema. |
| 25 | `db/schema/repository-overviews.schema.ts` | Repository overview schema. |
| 26 | `db/schema/feature-requests.schema.ts` | Feature request schema. |
| 27 | `db/schema/repositories.schema.ts` | Repository schema. |
| 28 | `electron/ipc/channels.ts` | IPC channel definitions. |
| 29 | `electron/preload.ts` | Electron API type definitions. |
| 30 | `lib/queries/step-configurations.ts` | Query key factory. |
| 31 | `types/component-types.ts` | Global type definitions. |
| 32 | `lib/utils.ts` | cn() utility for Tailwind. |

### UI Component References

| # | File | Reason |
|---|------|--------|
| 33 | `components/features/workflow/parameter-slider.tsx` | Reusable slider for settings. |
| 34 | `components/features/workflow/thinking-budget-control.tsx` | Thinking budget control. |
| 35 | `components/features/clarification/model-selector.tsx` | Model selection combobox. |
| 36 | `components/ui/form/multi-select-field.tsx` | Multi-select form field. |
| 37 | `components/ui/collapsible.tsx` | Collapsible component. |
| 38 | `components/ui/textarea.tsx` | Textarea component. |
| 39 | `components/ui/button.tsx` | Button with variants. |
| 40 | `components/ui/alert.tsx` | Alert for warnings. |

### Route Configuration

| # | File | Reason |
|---|------|--------|
| 41 | `app/(app)/projects/[projectId]/features/[featureId]/route-type.ts` | Route parameter schema. |

## Architecture Insights

### Key Patterns Discovered

1. **Step Component Pattern**: Steps use TanStack Form with `useAppForm`, sync with fetched data via `useEffect`, and reset on feature ID change.

2. **Repository Selection Pattern**: research-step.tsx shows pattern for repository selection with form listeners that trigger mutations on change.

3. **Configuration Persistence**: StepSettingsPanel uses `useUpsertStepConfig` for persisting settings immediately on blur/change.

4. **Context File Management**: ContextFilePicker handles file selection via Electron dialogs and mutation-based add/remove.

5. **Overview Status Pattern**: useRepositoryOverviewStatuses uses `useQueries` for parallel fetching with combined status map.

6. **Debounced Save Pattern**: entry-step.tsx uses useDebouncedCallback for auto-saving with flush on blur.

### Existing Similar Functionality

1. **ClarificationPanel**: Complex multi-state component with model selection, streaming, and step navigation.

2. **RepositoryOverviewGenerator**: Full AI generation flow with streaming, thinking support, and save actions.

3. **ResearchStep**: Repository selection with form integration and persistence.

### Integration Points Identified

1. **StepConfigurationStep Type**: Currently only 'plan' | 'refine' | 'research' - may need 'describe' added.

2. **Token Estimation**: tokenlens package available but no existing implementation found - needs creation.

3. **Repository Overview Status**: useRepositoriesWithOverviewStatus provides enriched data with overview status.

## File Validation Results

All discovered file paths validated - files exist and are accessible.

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Total Files Discovered | 41 |
| Critical Priority | 3 |
| High Priority | 9 |
| Medium Priority | 9 |
| Low Priority | 11 |
| UI References | 8 |
| Route Files | 1 |

---

**MILESTONE:STEP_2_COMPLETE**
