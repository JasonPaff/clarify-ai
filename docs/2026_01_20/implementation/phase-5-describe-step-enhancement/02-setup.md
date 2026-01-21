# Setup and Routing Table

**Timestamp**: 2026-01-20

## Routing Table

| Step | Title                                   | Specialist Agent     | Files                                                                                                    |
| ---- | --------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| 1    | Update Step Configuration Schema        | `database-schema`    | `db/schema/step-configurations.schema.ts`, `db/schema/feature-request-runs.schema.ts`                    |
| 2    | Update StepSettingsPanel for 'describe' | `frontend-component` | `components/features/workflow/step-settings-panel.tsx`                                                   |
| 3    | Update Workflow Steps Definition        | `frontend-component` | `components/features/workflow-steps.tsx`, `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` |
| 4    | Rename entry-step to describe-step      | `frontend-component` | `components/features/entry-step.tsx` → `describe-step.tsx`, page.tsx                                     |
| 5    | Update DescribeStep Props               | `frontend-component` | `components/features/describe-step.tsx`, page.tsx                                                        |
| 6    | Integrate Repository Selection          | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 7    | Create Repository Overview Status Panel | `frontend-component` | `components/features/workflow/repository-overview-status-panel.tsx`                                      |
| 8    | Integrate Overview Status Panel         | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 9    | Add Overview Regeneration Dialog        | `frontend-component` | `components/features/workflow/repository-overview-regenerate-dialog.tsx`, status panel                   |
| 10   | Integrate Context File Picker           | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 11   | Create Token Estimation Warning         | `frontend-component` | `components/features/workflow/token-estimation-warning.tsx`                                              |
| 12   | Integrate Token Warning                 | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 13   | Integrate StepSettingsPanel             | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 14   | Update Validation Schema                | `tanstack-form`      | `lib/validations/feature-request.ts`                                                                     |
| 15   | Refactor Layout                         | `frontend-component` | `components/features/describe-step.tsx`                                                                  |
| 16   | Update Page Step Content                | `frontend-component` | `app/(app)/projects/[projectId]/features/[featureId]/page.tsx`                                           |
| 17   | Integration Testing                     | `general-purpose`    | Multiple files                                                                                           |

## Specialist Agent Distribution

- **database-schema**: 1 step (Step 1)
- **frontend-component**: 14 steps (Steps 2-13, 15-16)
- **tanstack-form**: 1 step (Step 14)
- **general-purpose**: 1 step (Step 17)

## Execution Order

Steps will be executed sequentially as later steps depend on earlier ones:

- Step 1 (schema) enables Step 2 (panel)
- Steps 2-3 enable Step 4 (rename)
- Step 4 enables Steps 5-6 (props and repo selection)
- And so on...

## Next Phase

Proceeding to Phase 3: Step Execution
