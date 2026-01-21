# Step 3: Implementation Planning

## Step Metadata

- **Started**: 2026-01-21
- **Ended**: 2026-01-21
- **Status**: Completed

## Input

**Refined Feature Request**: Implement Phases 11, 12, and 13 of the Feature Request Workflow to complete the creation dialog enhancement, project settings extensions, and polish and edge case handling.

**Discovered Files**: 45 files across all 3 phases (8 Critical, 18 High, 7 Medium, 5 Low priority)

## Agent Prompt Summary

- Requested MARKDOWN format implementation plan
- Required sections: Overview, Quick Summary, Prerequisites, Implementation Steps, Quality Gates, Notes
- Each step includes: What/Why/Confidence/Files/Changes/Validation Commands/Success Criteria
- Codex review quality gates at logical checkpoints (after each phase) and as final step

## Plan Generation Results

### Overview Metrics

- **Estimated Duration**: 4-5 days
- **Complexity**: Medium-High
- **Risk Level**: Medium
- **Total Steps**: 30

### Step Distribution by Phase

| Phase | Steps | Description |
|-------|-------|-------------|
| 11 | 1-7 | Create Dialog Enhancement |
| 12 | 8-13 | Project Settings Extensions |
| 13 | 14-28 | Polish & Edge Cases |
| Review | 29-30 | Final Quality Gates |

### Key Implementation Items

**Phase 11** (7 steps):
- Enhance validation schema to require repositories
- Add required indicators to form fields
- Update SubmitButton with form validity check
- Codex review checkpoint

**Phase 12** (6 steps):
- Add planExportFolder field to schema
- Create DefaultModelSettings component
- Create PlanExportFolderField component
- Extend project settings page
- Codex review checkpoint

**Phase 13** (15 steps):
- Create WorkflowEmptyState component
- Create skeleton loaders (workflow, discovery)
- Improve QueryErrorBoundary
- Add error boundaries to AI streaming components
- Add empty states to Discover/Plan steps
- Add ARIA labels/roles to stepper
- Implement keyboard navigation
- Add live region announcements
- Add responsive design improvements
- Codex review checkpoints

### Codex Review Quality Gates

| Step | Gate | Scope |
|------|------|-------|
| 7 | Phase 11 Review | Create dialog validation |
| 13 | Phase 12 Review | Project settings extensions |
| 29 | Phase 13 Review | Polish and edge cases |
| 30 | Final Review | All phases integration |

## Validation Results

- **Format**: Markdown with required sections - PASS
- **Template Compliance**: All required sections present - PASS
- **Validation Commands**: Each step includes lint/typecheck - PASS
- **Codex Review Gates**: 4 total (3 phase gates + 1 final) - PASS
- **No Code Examples**: Instructions only, no implementation code - PASS

## Output

Implementation plan saved to: `docs/2026_01_21/plans/phases-11-12-13-workflow-polish-implementation-plan.md`
