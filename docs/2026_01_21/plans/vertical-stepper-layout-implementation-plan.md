# Vertical Stepper Layout Implementation Plan

**Generated**: 2026-01-21
**Original Request**: The horizontal stepper on the feature request workflow takes up too much space. I want it moved to be a vertical stepper on the right side.

**Refined Request**: The horizontal stepper on the feature request workflow is consuming excessive vertical space and limiting the available area for the main content panel. We need to refactor the workflow-steps component to display as a vertical stepper positioned on the right side of the feature request page, allowing the primary content area to utilize the full width above the fold. The stepper should maintain its current visual hierarchy showing the four workflow steps (Describe, Clarify, Discover, Plan) along with their connector lines, but reorient these elements to stack vertically instead of horizontally.

---

## Overview

**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan refactors the horizontal workflow stepper into a vertical stepper positioned on the right side of the feature request page. The implementation creates a two-column grid layout where the main content occupies the left column at full width and the vertical stepper occupies a fixed-width right column, maximizing the content area above the fold while maintaining the existing step indicator styling and functionality.

## Prerequisites

- [ ] Understand the current horizontal flexbox layout in `workflow-steps.tsx` (line 49: `flex items-center justify-between`)
- [ ] Understand the current page structure in `page.tsx` (lines 159-238: header, separator, stepper, separator, card, navigation)
- [ ] Note the existing step indicator sizing (line 62: `size-10`) and connector line styling (line 124: `h-0.5 flex-1`)
- [ ] Understand the existing Separator component supports `orientation` prop for vertical lines

## Implementation Steps

### Step 1: Add CSS Variables for Vertical Stepper Dimensions

**What**: Add CSS custom properties to define the vertical stepper width and spacing
**Why**: Centralizes dimension values for consistency and enables easy future adjustments without modifying component code
**Confidence**: High

**Files to Modify:**
- `app/globals.css` - Add stepper dimension variables to `:root`

**Changes:**
- Add `--stepper-width` variable (recommend 200-220px based on current step label widths)
- Add `--stepper-gap` variable for spacing between stepper and content (recommend 24-32px)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] CSS variables are defined in `:root` selector alongside existing sidebar variables
- [ ] Variables follow existing naming convention (e.g., `--stepper-width`, `--stepper-gap`)
- [ ] All validation commands pass

---

### Step 2: Refactor WorkflowSteps Component to Vertical Orientation

**What**: Convert the horizontal stepper layout to a vertical stacked layout with vertical connector lines
**Why**: The core stepper component must display steps vertically before the page layout can utilize it in a two-column arrangement
**Confidence**: High

**Files to Modify:**
- `components/features/workflow-steps.tsx` - Reorient layout from horizontal to vertical

**Changes:**
- Change the root container from `flex items-center justify-between` to `flex flex-col` with appropriate spacing
- Update each step button from `flex flex-col items-center text-center` to `flex items-center` for horizontal step content (icon + labels)
- Reposition step labels to display to the right of the step indicator instead of below
- Convert connector lines from horizontal (`h-0.5 flex-1`) to vertical (`w-0.5 h-8` or similar)
- Position vertical connector lines between steps using appropriate layout technique (absolute positioning or flex)
- Maintain all existing step indicator styling, stale warning indicators, and tooltip functionality
- Ensure the step width uses the CSS variable defined in Step 1

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Steps display vertically with step indicators on the left and labels on the right
- [ ] Vertical connector lines appear between each step
- [ ] Connector lines show correct color based on completion state (accent for completed, border for incomplete)
- [ ] Stale step indicators and tooltips function correctly
- [ ] Step click handlers work as expected
- [ ] All validation commands pass

---

### Step 3: Restructure Feature Page to Two-Column Grid Layout

**What**: Reorganize the feature workflow page into a two-column layout with content on the left and stepper on the right
**Why**: Enables the main content area to utilize full available width while keeping the stepper visible for navigation
**Confidence**: High

**Files to Modify:**
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Restructure page layout

**Changes:**
- Wrap the main content area (Card with step content) and WorkflowSteps in a CSS Grid container with two columns
- Configure grid template columns: `1fr` for content and CSS variable width for stepper (e.g., `grid-cols-[1fr_var(--stepper-width)]`)
- Position the WorkflowSteps component in the right column with appropriate gap from content
- Keep the header section, initial separator, and navigation buttons outside the grid (they span full width)
- Remove the separator that was between WorkflowSteps and the Card (no longer needed in two-column layout)
- Apply `sticky top-0` or similar positioning to the stepper column if desired for scrolling content
- Ensure proper vertical alignment of the stepper within its column

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Page displays in two-column layout with content on left and stepper on right
- [ ] Main content card has full width of its column
- [ ] Stepper maintains fixed width from CSS variable
- [ ] Gap between columns is consistent
- [ ] Header and navigation remain full-width above and below the grid
- [ ] All validation commands pass

---

### Step 4: Visual Polish and Responsive Adjustments

**What**: Fine-tune spacing, alignment, and ensure visual consistency between the stepper and content
**Why**: Ensures professional appearance and maintains visual hierarchy established in the original design
**Confidence**: Medium

**Files to Modify:**
- `components/features/workflow-steps.tsx` - Adjust spacing and alignment
- `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` - Adjust container styling

**Changes:**
- Align the top of the stepper with the top of the content card
- Adjust vertical spacing between steps to create balanced visual rhythm
- Ensure step text (title and description) truncates properly if needed within the fixed stepper width
- Add subtle visual separation between stepper and content if needed (optional border or background)
- Verify the stepper height does not exceed available viewport height
- Consider adding `self-start` to keep stepper at top of its grid cell

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Stepper top-aligns with content card
- [ ] Spacing between steps is visually balanced
- [ ] All step labels are readable and fit within stepper width
- [ ] Visual hierarchy is clear (current step emphasized, completed steps subdued)
- [ ] All validation commands pass

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Stepper displays vertically with all four steps (Describe, Clarify, Discover, Plan)
- [ ] Step click navigation works correctly
- [ ] Stale step indicators display with amber styling and tooltips
- [ ] Connector lines show correct completion state colors
- [ ] Content area has more vertical space than previous horizontal layout
- [ ] Layout works correctly at standard desktop viewport sizes

## Notes

- The vertical stepper width of 200-220px is recommended based on the current step label text lengths; adjust based on visual testing
- The existing `Separator` component already supports `orientation="vertical"` but connector lines within the stepper may need custom implementation for proper positioning
- Consider whether the stepper should be sticky (remain visible while scrolling long content) - this is marked as optional in Step 3
- The step description text ("Describe your feature idea", etc.) may need smaller font size or text truncation in the narrower vertical layout
- No database or IPC changes are required for this purely visual refactoring
- All existing functionality (step navigation, stale indicators, tooltips) must be preserved

---

## File Discovery Results

### Critical Priority (Must Modify)
| File | Reasoning |
|------|-----------|
| `components/features/workflow-steps.tsx` | Core stepper component - horizontal→vertical layout change |
| `app/(app)/projects/[projectId]/features/[featureId]/page.tsx` | Page layout - two-column restructuring |

### High Priority (Likely Modify)
| File | Reasoning |
|------|-----------|
| `app/globals.css` | CSS variables for stepper dimensions |

### Reference Files
| File | Purpose |
|------|---------|
| `components/ui/tooltip.tsx` | Stale step tooltips |
| `components/ui/button.tsx` | Navigation buttons |
| `hooks/use-stale-steps.ts` | Stale step management |
| `lib/utils.ts` | cn() utility |
