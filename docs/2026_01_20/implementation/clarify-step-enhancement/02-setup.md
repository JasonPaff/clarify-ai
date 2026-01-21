# Setup and Routing Table

**Phase 2 Start**: 2026-01-20

## Routing Table

| Step | Title                                               | Specialist         | Files                                                                         |
| ---- | --------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| 1    | Rename 'Refine' to 'Clarify' in UI                  | frontend-component | workflow-steps.tsx, step-settings-panel.tsx, restore-run-dialog.tsx, page.tsx |
| 2    | Create ClarifyStep Component Shell                  | frontend-component | clarify-step.tsx (new), page.tsx                                              |
| 3    | Integrate StepSettingsPanel with Clarification Flow | frontend-component | clarify-step.tsx, use-clarification.ts, clarification-panel.tsx               |
| 4    | Add Skip Clarification Button                       | frontend-component | clarify-step.tsx, use-clarification.ts, feature-requests.schema.ts            |
| 5    | Add Request More Clarification Button               | frontend-component | clarification-panel.tsx, use-clarification.ts                                 |
| 6    | Handle 'No Clarification Needed' Scenario           | frontend-component | analysis-summary.tsx, clarification-panel.tsx                                 |
| 7    | Implement Streaming Completion Wait Logic           | frontend-component | use-clarification.ts, questions-list.tsx, clarification-panel.tsx             |
| 8    | Save Clarification Runs to Run History              | tanstack-query     | use-clarification.ts, use-feature-request-runs.ts                             |
| 9    | Add RunHistoryDropdown to Clarify Step              | frontend-component | clarify-step.tsx, clarification-panel.tsx                                     |
| 10   | Implement Run Restore Functionality                 | frontend-component | use-clarification.ts, clarify-step.tsx                                        |
| 11   | Create Pre-Run Cost Estimation Component            | frontend-component | cost-estimate.tsx (new), clarify-step.tsx                                     |
| 12   | Integrate Cost Estimation into Header               | frontend-component | clarify-step.tsx, cost-estimate.tsx                                           |
| 13   | Track Describe Step Changes for Stale Detection     | tanstack-query     | describe-step.tsx, use-feature-requests.ts                                    |
| 14   | Add StaleWarningBanner to Clarify Step              | frontend-component | clarify-step.tsx, use-clarification.ts                                        |
| 15   | Create Helper Hook for Stale Steps                  | tanstack-query     | use-stale-steps.ts (new), clarify-step.tsx                                    |
| 16   | Update WorkflowSteps Stale Indicators               | frontend-component | page.tsx                                                                      |
| 17   | Cleanup Deprecated Components                       | frontend-component | model-selector.tsx, advanced-settings.tsx                                     |

## Step Dependencies

- Steps 1-2: Foundation (no dependencies)
- Steps 3-7: ClarifyStep features (depends on Step 2)
- Steps 8-10: Run history (depends on Steps 2-3)
- Steps 11-12: Cost estimation (depends on Step 2)
- Steps 13-16: Stale detection (depends on Step 2)
- Step 17: Cleanup (last step)

## Specialist Distribution

- **frontend-component**: 14 steps (1-7, 9-12, 14, 16-17)
- **tanstack-query**: 3 steps (8, 13, 15)

---

MILESTONE:PHASE_2_COMPLETE
