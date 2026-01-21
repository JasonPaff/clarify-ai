# Phase 9: Implementation Setup

**Phase**: Phase 2 - Setup and Routing Table
**Status**: Complete

## Routing Table

| Step | Title | Specialist Agent |
|------|-------|------------------|
| 1 | Create Centralized Stale Detection Utility | general-purpose |
| 2 | Create Step Validation Utility | general-purpose |
| 3 | Create Step Transition Warning Dialog | frontend-component |
| 4 | Create Workflow Context Provider | general-purpose |
| 5 | Create Leave Warning Hook | general-purpose |
| 6 | Create Auto-Save Status Component | frontend-component |
| 7 | Create Save Error Alert Component | frontend-component |
| 8 | Codex Code Review - Foundation | codex-review |
| 9 | Integrate Workflow Provider | general-purpose |
| 10 | Update Feature Workflow Page | general-purpose |
| 11 | Update WorkflowSteps Component | frontend-component |
| 12 | Update ClarifyStep | frontend-component |
| 13 | Update DiscoverStep | frontend-component |
| 14 | Update PlanStep | frontend-component |
| 15 | Update DescribeStep | frontend-component |
| 16 | Update ClarificationPanel | frontend-component |
| 17 | Codex Code Review - Integration | codex-review |
| 18 | Update useStaleSteps Hook | general-purpose |
| 19 | Add BeforeUnload Handler | general-purpose |
| 20 | Create Test Plan Document | general-purpose |
| 21 | Final Codex Code Review | codex-review |

## Step Detection Rationale

1. **Steps 1, 2, 4, 5**: Utility files in `lib/` and `hooks/` → general-purpose
2. **Steps 3, 6, 7**: New UI components in `components/` → frontend-component
3. **Steps 11-16**: Existing component modifications → frontend-component
4. **Steps 9, 10, 18, 19, 20**: Layout/page/hook changes → general-purpose
5. **Steps 8, 17, 21**: Codex review checkpoints → codex-review skill

---

**MILESTONE:PHASE_2_COMPLETE**
