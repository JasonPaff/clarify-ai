# Setup and Routing Table - Phases 11, 12, and 13

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Enhance Feature Request Validation Schema | tanstack-form | `lib/validations/feature-request.ts` |
| 2 | Add Required Indicator to TextField | tanstack-form-base-components | `components/ui/form/text-field.tsx` |
| 3 | Add Required Indicator to RepositorySelector | frontend-component | `components/features/repository-selector.tsx` |
| 4 | Enhance MultiSelectField with Required Indicator | tanstack-form-base-components | `components/ui/form/multi-select-field.tsx` |
| 5 | Update CreateFeatureRequestForm with Validation | tanstack-form | `components/features/create-feature-request-form.tsx` |
| 6 | Enhance SubmitButton with Form Validity State | tanstack-form-base-components | `components/ui/form/submit-button.tsx` |
| 7 | Codex Code Review - Phase 11 | codex-review | N/A |
| 8 | Add planExportFolder Field to Projects Schema | database-schema | `db/schema/projects.schema.ts` |
| 9 | Update Project Validation Schema | tanstack-form | `lib/validations/project.ts` |
| 10 | Create DefaultModelSettings Component | frontend-component | `components/projects/default-model-settings.tsx` |
| 11 | Create PlanExportFolderField Component | frontend-component | `components/projects/plan-export-folder-field.tsx` |
| 12 | Extend Project Settings Page | frontend-component | `app/(app)/projects/[projectId]/settings/page.tsx` |
| 13 | Codex Code Review - Phase 12 | codex-review | N/A |
| 14 | Create WorkflowEmptyState Component | frontend-component | `components/features/workflow/workflow-empty-state.tsx` |
| 15 | Create Workflow Skeleton Loader | frontend-component | `components/skeletons/workflow-skeleton.tsx` |
| 16 | Create Discovery Step Skeleton | frontend-component | `components/skeletons/discovery-skeleton.tsx` |
| 17 | Improve QueryErrorBoundary Error Display | frontend-component | `components/data/query-error-boundary.tsx` |
| 18 | Add Error Boundaries to AI Streaming Components | frontend-component | Multiple step components |
| 19 | Add Empty States to Discover Step | frontend-component | `components/features/discover-step.tsx` |
| 20 | Add Empty States to Plan Step | frontend-component | `components/features/plan-step.tsx` |
| 21 | Add Empty State to RunHistoryDropdown | frontend-component | `components/features/workflow/run-history-dropdown.tsx` |
| 22 | Add ARIA Labels and Roles to WorkflowSteps | frontend-component | `components/features/workflow-steps.tsx` |
| 23 | Implement Keyboard Navigation for WorkflowSteps | frontend-component | `components/features/workflow-steps.tsx` |
| 24 | Add Live Region Announcements | frontend-component | `components/features/workflow-steps.tsx` |
| 25 | Add Responsive Breakpoints to WorkflowSteps | frontend-component | `components/features/workflow-steps.tsx` |
| 26 | Add Responsive Design to Step Settings Panel | frontend-component | `components/features/workflow/step-settings-panel.tsx` |
| 27 | Update globals.css with Responsive Variables | general-purpose | `app/globals.css` |
| 28 | Add Loading States to Workflow Steps | frontend-component | Multiple step components |
| 29 | Codex Code Review - Phase 13 | codex-review | N/A |
| 30 | Final Codex Code Review | codex-review | N/A |

## Specialist Distribution

- **tanstack-form-base-components**: 3 steps (2, 4, 6)
- **tanstack-form**: 3 steps (1, 5, 9)
- **frontend-component**: 17 steps (3, 10, 11, 12, 14-26, 28)
- **database-schema**: 1 step (8)
- **general-purpose**: 1 step (27)
- **codex-review**: 4 steps (7, 13, 29, 30)

## Status
Routing table: **COMPLETE**
Ready to begin step execution.

MILESTONE:PHASE_2_COMPLETE
