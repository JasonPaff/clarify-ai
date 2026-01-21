# Step 2: AI-Powered File Discovery

**Status**: Completed
**Timestamp Start**: 2026-01-21T00:00:10Z
**Timestamp End**: 2026-01-21T00:00:35Z
**Duration**: ~25 seconds

## Input

### Refined Feature Request

The horizontal stepper on the feature request workflow is consuming excessive vertical space and limiting the available area for the main content panel. We need to refactor the workflow-steps component to display as a vertical stepper positioned on the right side of the feature request page, allowing the primary content area to utilize the full width above the fold. The stepper should maintain its current visual hierarchy showing the four workflow steps (Describe, Clarify, Discover, Plan) along with their connector lines, but reorient these elements to stack vertically instead of horizontally. The layout should be restructured using CSS Grid or Flexbox to create a two-column arrangement where the main content occupies the left column and the vertical stepper occupies a fixed-width right column. The vertical stepper should display step indicators with descriptive labels, maintaining the same visual styling and CVA variants currently applied to the horizontal version, but adapting the connector lines to flow vertically between steps. The implementation should utilize the existing Base UI primitives and Tailwind CSS v4 styling system.

## Analysis Summary

- **Directories Explored**: 8
- **Candidate Files Examined**: 25
- **Highly Relevant Files Found**: 7
- **Supporting Files Found**: 11
- **Total Files Discovered**: 18

## Discovered Files by Priority

### Critical Priority (Must be Modified)

| File | Needs Modification | Reasoning |
|------|-------------------|-----------|
| `components/features/workflow-steps.tsx` | Yes - Major refactoring | Core component that needs horizontal→vertical layout change, connector line reorientation, label positioning |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Yes - Major restructuring | Page layout must change to two-column with stepper on right side |

### High Priority (Likely Needs Modification)

| File | Needs Modification | Reasoning |
|------|-------------------|-----------|
| `app/globals.css` | Possibly | May need custom CSS variables or styles for vertical stepper if Tailwind classes insufficient |
| `components/ui/card.tsx` | Possibly | Card layout may need adjustment for new two-column structure |
| `components/ui/separator.tsx` | Possibly | May need vertical separator usage in new layout |

### Medium Priority (May Need Modification)

| File | Needs Modification | Reasoning |
|------|-------------------|-----------|
| `components/ui/tooltip.tsx` | No - Reference | Used by WorkflowSteps for stale step tooltips |
| `components/ui/button.tsx` | No - Reference | Button component for navigation |
| `components/ui/badge.tsx` | No - Reference | Status badge in workflow header |
| `components/layout/content-area.tsx` | Possibly | May need adjustments for two-column layout |
| `components/layout/app-shell.tsx` | No - Reference | Understanding layout hierarchy |

### Low Priority (Context/Reference Only)

| File | Reasoning |
|------|-----------|
| `components/features/describe-step.tsx` | Example step content component |
| `components/features/clarify-step.tsx` | Step component reference |
| `components/features/discover-step.tsx` | Step component reference |
| `hooks/use-stale-steps.ts` | Stale step management hook |
| `components/ui/icon-button.tsx` | Back navigation button |
| `lib/utils.ts` | `cn()` class merging utility |
| `types/component-types.ts` | Global type definitions |
| `app/(app)/projects/[projectId]/features/[featureId]/route-type.ts` | Route types |

## Key Architecture Insights

### Patterns Discovered

1. **CVA Styling Pattern**: Components use `class-variance-authority` for variants (button.tsx, badge.tsx). WorkflowSteps should adopt CVA if orientation variants are needed.

2. **Base UI Integration**: UI primitives wrap `@base-ui/react` components (Tooltip, Separator, Button). Pattern should be maintained.

3. **Tailwind CSS v4 with CSS Variables**: Colors/spacing defined via CSS custom properties in `globals.css` using `@theme inline`.

4. **Component Composition**: Components composed from smaller primitives. Stepper can be restructured while maintaining internal components.

5. **Conditional Styling with `cn()`**: The `cn()` utility used throughout for conditional class merging.

### Existing Similar Functionality

- Application sidebar (`components/layout/sidebar.tsx`) - vertical navigation pattern reference
- Collapsible sections in step components - vertical stacking patterns
- Step settings panels - fixed-width side panel examples

### Integration Points Identified

1. **WorkflowSteps Export**: `WORKFLOW_STEPS` constant exported, may be used elsewhere
2. **Step Click Handler**: `onStepClick` callback must be preserved
3. **Stale Steps Integration**: `staleSteps` prop connects to `useStaleSteps` hook
4. **Current Step State**: `currentStep` prop drives step highlighting

## Detailed File Analysis

### Critical Files

#### `components/features/workflow-steps.tsx`
- **Current**: Horizontal flexbox layout with `flex items-center justify-between`
- **Features**: Step indicators with numbers/checkmarks, horizontal connector lines (`h-0.5 flex-1`), click handlers, stale warning indicators
- **Exports**: `WORKFLOW_STEPS` array, `WorkflowSteps` component
- **Props**: `currentStep`, `onStepClick`, `staleSteps`
- **Changes Needed**:
  - Convert horizontal flexbox to vertical stack
  - Reorient connector lines to flow vertically
  - Adjust label positioning for vertical layout
  - Preserve all existing functionality

#### `app/(app)/projects/[projectId]/features/[featureId]/page.tsx`
- **Current**: Single-column layout with WorkflowSteps at top, then step content, navigation at bottom
- **Features**: Header with back nav and status badge, step navigation (Previous/Next buttons)
- **Changes Needed**:
  - Restructure to CSS Grid/Flexbox two-column layout
  - Move WorkflowSteps to fixed-width right column
  - Main content area on left (full remaining width)
  - May need to adjust navigation button positioning

## File Path Validation

All discovered file paths have been validated to exist in the codebase.

| File | Status |
|------|--------|
| `components/features/workflow-steps.tsx` | ✅ Exists |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | ✅ Exists |
| `app/globals.css` | ✅ Exists |
| `components/ui/card.tsx` | ✅ Exists |
| `components/ui/separator.tsx` | ✅ Exists |
| `components/ui/tooltip.tsx` | ✅ Exists |
| `components/ui/button.tsx` | ✅ Exists |
| `components/ui/badge.tsx` | ✅ Exists |
| `components/layout/content-area.tsx` | ✅ Exists |
| `components/layout/app-shell.tsx` | ✅ Exists |

## Discovery Statistics

- **Files requiring modification**: 2 (Critical) + 3 (Possibly High) = 5
- **Reference files**: 13
- **Coverage**: All major components affected by the feature change discovered
- **Confidence**: High - comprehensive analysis of codebase structure

---

**MILESTONE:STEP_2_COMPLETE**
