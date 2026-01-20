# Setup and Routing Table

**Phase 2 Started**: 2026-01-20

## Routing Table

| Step | Title                                                | Specialist         | Target Files                                               |
| ---- | ---------------------------------------------------- | ------------------ | ---------------------------------------------------------- |
| 1    | Create Parameter Slider Component                    | frontend-component | `components/features/workflow/parameter-slider.tsx`        |
| 2    | Create Thinking Budget Control Component             | frontend-component | `components/features/workflow/thinking-budget-control.tsx` |
| 3    | Create Step Settings Panel Component                 | frontend-component | `components/features/workflow/step-settings-panel.tsx`     |
| 4    | Create Run History Item Component                    | frontend-component | `components/features/workflow/run-history-item.tsx`        |
| 5    | Create Run History Dropdown Component                | frontend-component | `components/features/workflow/run-history-dropdown.tsx`    |
| 6    | Create Stale Warning Banner Component                | frontend-component | `components/features/workflow/stale-warning-banner.tsx`    |
| 7    | Modify Workflow Steps Component for Stale Indicators | frontend-component | `components/features/workflow-steps.tsx`                   |
| 8    | Create Cancel AI Dialog Component                    | frontend-component | `components/features/workflow/cancel-ai-dialog.tsx`        |
| 9    | Create Restore Run Dialog Component                  | frontend-component | `components/features/workflow/restore-run-dialog.tsx`      |
| 10   | Create Discard Results Dialog Component              | frontend-component | `components/features/workflow/discard-results-dialog.tsx`  |
| 11   | Create Context File List Component                   | frontend-component | `components/features/workflow/context-file-list.tsx`       |
| 12   | Create Context File Picker Component                 | frontend-component | `components/features/workflow/context-file-picker.tsx`     |

## Specialist Assignment Summary

- **frontend-component**: 12 steps (all steps)

All steps are UI component implementations that follow the Base UI + CVA pattern, making them suitable for the frontend-component specialist.

## Dependencies

- Steps 1-2 must complete before Step 3 (Step Settings Panel uses ParameterSlider and ThinkingBudgetControl)
- Step 4 must complete before Step 5 (Run History Dropdown uses Run History Item)
- Step 9 must be available for Step 5 (RestoreRunDialog used in RunHistoryDropdown)
- Step 11 must complete before Step 12 (Context File Picker uses Context File List)

## Execution Order

Sequential execution respecting dependencies:

1. Step 1 (Parameter Slider)
2. Step 2 (Thinking Budget Control)
3. Step 3 (Step Settings Panel)
4. Step 4 (Run History Item)
5. Step 8 (Cancel AI Dialog) - moved up, no dependencies
6. Step 9 (Restore Run Dialog) - needed for Step 5
7. Step 5 (Run History Dropdown)
8. Step 6 (Stale Warning Banner)
9. Step 7 (Workflow Steps modification)
10. Step 10 (Discard Results Dialog)
11. Step 11 (Context File List)
12. Step 12 (Context File Picker)

## Phase 2 Status

- [x] Steps extracted from plan
- [x] Routing table created
- [x] Dependencies analyzed
- [x] Execution order determined

MILESTONE:PHASE_2_COMPLETE
