# Step 2: File Discovery

**Started**: 2026-01-20T10:04:00Z
**Completed**: 2026-01-20T10:06:00Z
**Duration**: ~120 seconds
**Status**: Completed

## Refined Request Used

Implement Phase 4 of the feature request workflow from the implementation order document, which covers the creation of five core UI component groups that form the foundation for all subsequent workflow step enhancements...

## Discovery Statistics

- **Directories Explored**: 12 major directories
- **Candidate Files Examined**: 52
- **Highly Relevant Files**: 25
- **Supporting Files**: 18
- **Total Discovered**: 43 files

## Files to Create (11 new files)

| File                                                       | Component Group           |
| ---------------------------------------------------------- | ------------------------- |
| `components/features/workflow/step-settings-panel.tsx`     | 4.1 Step Settings Panel   |
| `components/features/workflow/thinking-budget-control.tsx` | 4.1 Step Settings Panel   |
| `components/features/workflow/parameter-slider.tsx`        | 4.1 Step Settings Panel   |
| `components/features/workflow/run-history-dropdown.tsx`    | 4.2 Run History Selector  |
| `components/features/workflow/run-history-item.tsx`        | 4.2 Run History Selector  |
| `components/features/workflow/stale-warning-banner.tsx`    | 4.3 Stale State Indicator |
| `components/features/workflow/cancel-ai-dialog.tsx`        | 4.4 Confirmation Dialogs  |
| `components/features/workflow/restore-run-dialog.tsx`      | 4.4 Confirmation Dialogs  |
| `components/features/workflow/discard-results-dialog.tsx`  | 4.4 Confirmation Dialogs  |
| `components/features/workflow/context-file-picker.tsx`     | 4.5 Context File Picker   |
| `components/features/workflow/context-file-list.tsx`       | 4.5 Context File Picker   |

## Discovered Files by Priority

### Critical Priority (9 files)

| File                                                | Relevance                             |
| --------------------------------------------------- | ------------------------------------- |
| `components/ui/dialog.tsx`                          | Base pattern for confirmation dialogs |
| `components/ui/collapsible.tsx`                     | Foundation for Step Settings Panel    |
| `components/ui/select.tsx`                          | Pattern for Run History Dropdown      |
| `components/ui/alert.tsx`                           | Base for Stale Warning Banner         |
| `components/ui/button.tsx`                          | Used across all new components        |
| `components/ui/number-input.tsx`                    | Pattern for Parameter Slider          |
| `db/schema/step-configurations.schema.ts`           | Data Step Settings Panel manages      |
| `db/schema/feature-request-runs.schema.ts`          | Data Run History displays             |
| `db/schema/feature-request-context-files.schema.ts` | Data Context File Picker manages      |

### High Priority (8 files)

| File                                                      | Relevance                          |
| --------------------------------------------------------- | ---------------------------------- |
| `components/features/clarification/model-selector.tsx`    | Direct pattern for model selection |
| `components/features/clarification/advanced-settings.tsx` | Direct pattern for settings panel  |
| `components/features/delete-feature-request-dialog.tsx`   | AlertDialog confirmation pattern   |
| `components/features/workflow-steps.tsx`                  | To be enhanced for stale icons     |
| `hooks/queries/use-step-configurations.ts`                | Query hooks for settings           |
| `hooks/queries/use-feature-request-runs.ts`               | Query hooks for run history        |
| `hooks/queries/use-feature-request-context-files.ts`      | Query hooks for context files      |
| `hooks/useElectron.ts`                                    | Dialog and FS hooks                |

### Medium Priority (10 files)

| File                              | Relevance                               |
| --------------------------------- | --------------------------------------- |
| `components/ui/switch.tsx`        | Thinking toggle                         |
| `components/ui/textarea.tsx`      | Custom prompt input                     |
| `components/ui/badge.tsx`         | "Current" label in run history          |
| `components/ui/card.tsx`          | File list items                         |
| `components/ui/tooltip.tsx`       | Control information                     |
| `components/ui/icon-button.tsx`   | Remove/action buttons                   |
| `components/ui/combobox.tsx`      | Model selector base                     |
| `hooks/use-available-models.ts`   | Model list for selector                 |
| `hooks/use-controllable-state.ts` | Component state utility                 |
| `lib/ai/models.ts`                | Model definitions with supportsThinking |

### Low Priority (16 files)

| File                                                                     | Relevance                     |
| ------------------------------------------------------------------------ | ----------------------------- |
| `lib/ai/thinking-preference/constants.ts`                                | Thinking preference constants |
| `types/component-types.ts`                                               | Global type definitions       |
| `types/electron.ts`                                                      | Electron API types            |
| `lib/utils.ts`                                                           | cn() utility                  |
| `lib/forms/form-hook.ts`                                                 | Form hook if needed           |
| `lib/queries/step-configurations.ts`                                     | Query key factory             |
| `lib/queries/feature-request-runs.ts`                                    | Query key factory             |
| `lib/queries/feature-request-context-files.ts`                           | Query key factory             |
| `electron/ipc/channels.ts`                                               | IPC channel constants         |
| `electron/ipc/dialog.handlers.ts`                                        | File picker handlers          |
| `electron/ipc/fs.handlers.ts`                                            | File system handlers          |
| `electron/ipc/step-configurations.handlers.ts`                           | Step config IPC               |
| `electron/ipc/feature-request-runs.handlers.ts`                          | Run history IPC               |
| `electron/ipc/feature-request-context-files.handlers.ts`                 | Context files IPC             |
| `app/globals.css`                                                        | Theme variables               |
| `docs/2026_01_20/plans/feature-request-workflow-implementation-order.md` | Requirements doc              |

## Key Patterns Discovered

### 1. Base UI + CVA Pattern

All UI primitives use `@base-ui/react` components wrapped with `class-variance-authority` for variant-based styling. Components export individual variants and composed components.

### 2. Component Composition

Complex components like `model-selector.tsx` and `advanced-settings.tsx` compose multiple Base UI primitives together.

### 3. TanStack Query Hooks

All data fetching uses custom hooks in `hooks/queries/` that wrap `useQuery` and `useMutation`. Cache invalidation via query key factories.

### 4. Dialog Patterns

Both Base Dialog and Alert Dialog are used. Delete dialogs use AlertDialog for destructive confirmations.

### 5. Thinking Support Detection

Models define `supportsThinking: boolean` which determines whether thinking budget controls should be shown.

### 6. Run History Data

`feature_request_runs` table uses `isCurrentRun` boolean to track active version.

### 7. Collapsible Settings Pattern

`advanced-settings.tsx` provides the exact pattern for Step Settings Panel.

## Existing Similar Functionality

- **Model Selection**: `clarification/model-selector.tsx` - grouped by provider using Combobox
- **Settings Panel**: `clarification/advanced-settings.tsx` - collapsible with custom prompt
- **Confirmation Dialogs**: `delete-feature-request-dialog.tsx` - AlertDialog with typed confirmation
- **Run History Hooks**: Already have `useRunsByStep`, `useSetCurrentRun`, `useCurrentRun`
- **Context File Hooks**: Already have all CRUD hooks needed

## Integration Points

1. **Workflow Steps**: `workflow-steps.tsx` needs `staleSteps` prop for warning icons
2. **Stale Detection**: `feature_requests.staleSteps` JSON field tracks invalidated steps
3. **File Browser**: `useElectronDialog().openFile()` provides native picker

---

**MILESTONE:STEP_2_COMPLETE**
