# Implementation Plan: Filename Matching for File Search

**Generated**: 2026-01-23
**Original Request**: Enable filename matching for the "Find Context Files" feature
**Refined Request**: Add filename matching to file search so users can find files by name (e.g., searching "ClarifyStep" finds `clarify-step.tsx`) in addition to content-based search

## Analysis Summary

- Feature request refined with project context
- Discovered 12 files across multiple directories
- Generated 8-step implementation plan with Gemini review quality gates

## File Discovery Results

### Critical Priority
1. **electron/ipc/file-search.handlers.ts** - Core search handler, add filename matching in `performSearch` function
2. **lib/validations/file-search.ts** - Add match type field to distinguish filename vs content matches

### High Priority
3. **components/features/workflow/file-search-dialog.tsx** - Update UI to show filename matches differently
4. **hooks/queries/use-file-search.ts** - Update types if needed

### Medium Priority
5. **electron/preload.ts** - May need updates if types change
6. **types/electron.ts** - Update type exports
7. **hooks/useElectron.ts** - Update if types change
8. **electron/ipc/channels.ts** - No changes expected

---

## Implementation Plan

## Overview

**Estimated Duration**: 4-6 hours
**Complexity**: Medium
**Risk Level**: Low

## Quick Summary

This plan adds filename matching to the existing file search feature, allowing users to find files by name (e.g., searching "ClarifyStep" will find `clarify-step.tsx`) in addition to the existing content-based search. The implementation modifies the search handler to match against filenames first, adds a `matchType` field to distinguish between filename and content matches, and updates the UI to visually differentiate these match types.

## Prerequisites

- [ ] Verify the existing file search functionality works correctly
- [ ] Understand the current search flow: `file-search-dialog.tsx` -> `use-file-search.ts` -> `useElectron.ts` -> `preload.ts` -> `file-search.handlers.ts`
- [ ] Confirm no pending changes to the affected files

## Implementation Steps

### Step 1: Add Match Type to Validation Schema

**What**: Add a `matchType` field to the `FileSearchResult` schema to distinguish between filename and content matches
**Why**: The UI needs to differentiate how a file was matched to display appropriate visual indicators and enable potential filtering
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify-ai\lib\validations\file-search.ts` - Add matchType enum and field to result schema

**Changes:**

- Add `matchTypeSchema` enum with values: `'filename'`, `'content'`, `'both'`
- Add `matchType` field to `fileSearchResultSchema`
- Export the new `MatchType` type

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] New `matchTypeSchema` enum defined with `'filename'`, `'content'`, `'both'` values
- [ ] `fileSearchResultSchema` includes `matchType` field
- [ ] `MatchType` type is exported
- [ ] All validation commands pass

---

### Step 2: Implement Filename Matching Logic in Search Handler

**What**: Modify the `performSearch` function to check filenames against the query before reading file content
**Why**: This is the core feature - filename matches should appear in results regardless of content matches, improving file discoverability
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify-ai\electron\ipc\file-search.handlers.ts` - Add filename matching logic in performSearch

**Changes:**

- Add helper function `matchesFilename` that performs case-insensitive filename matching
- Modify the search loop to check filename first before reading content
- Track `matchType` for each result (`'filename'`, `'content'`, or `'both'`)
- Include files with matching filenames even if no content matches
- Update result construction to include the `matchType` field
- For filename-only matches, generate a snippet showing the filename context (first few lines of file)

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `matchesFilename` helper function implemented with case-insensitive matching
- [ ] Files are found when query matches filename regardless of content
- [ ] Results include correct `matchType` value
- [ ] Filename matches include contextual snippets
- [ ] All validation commands pass

---

### Step 3: Update Type Exports for Renderer

**What**: Export the new `MatchType` type from the electron types module
**Why**: The renderer process needs access to the type for proper TypeScript typing in UI components
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify-ai\types\electron.ts` - Add MatchType to exports

**Changes:**

- Add `MatchType` to the re-export from `../lib/validations/file-search`

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] `MatchType` type is exported from `types/electron.ts`
- [ ] Type is accessible in renderer components
- [ ] All validation commands pass

---

### Step 4: Gemini Code Review (Quality Gate)

**What**: Run Gemini code review to validate backend implementation quality
**Why**: AI-powered code review (Gemini 3 Pro) catches issues before they become problems. Runs non-interactively via piped git diff.
**Confidence**: High

**Validation Commands:**

```bash
/gemini-review
```

**Success Criteria:**

- [ ] Gemini review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
- [ ] Code quality approved by Gemini 3 Pro review

---

### Step 5: Update File Search Dialog UI

**What**: Add visual differentiation for filename matches vs content matches in the search results
**Why**: Users need to understand why a file appeared in results - whether it matched by name, content, or both
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify-ai\components\features\workflow\file-search-dialog.tsx` - Add match type indicators

**Changes:**

- Import the `MatchType` type from `@/types/electron`
- Add a match type badge/indicator component showing "Name", "Content", or "Name + Content"
- Update the result item display to show the match type indicator near the match count
- Use appropriate visual styling (e.g., subtle badge, different icon, or text label) to indicate match type
- Update the "X matches" text to differentiate between match types when applicable

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Match type indicator visible in search results
- [ ] Visual distinction between filename and content matches
- [ ] Consistent styling with existing UI components
- [ ] All validation commands pass

---

### Step 6: Update Search Query Field Description

**What**: Update the search query field description to inform users about filename matching
**Why**: Users need to know that searching now matches both filenames and content
**Confidence**: High

**Files to Modify:**

- `C:\Users\jasonpaff\dev\clarify-ai\components\features\workflow\file-search-dialog.tsx` - Update field description

**Changes:**

- Update the TextField description from "Enter a search term or pattern to find in file contents" to "Search by filename or content. Matches filenames and file contents."
- Update placeholder text to be more inclusive of filename search

**Validation Commands:**

```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**

- [ ] Search query description reflects filename matching capability
- [ ] Users understand the search scope from the UI
- [ ] All validation commands pass

---

### Step 7: Manual Testing

**What**: Perform end-to-end testing of the filename matching feature
**Why**: Verify the feature works correctly in the running application
**Confidence**: High

**Files to Create:**

- None

**Files to Modify:**

- None

**Changes:**

- Test searching for partial filename (e.g., "dialog" should find files with "dialog" in filename)
- Test case-insensitive filename matching
- Test that content matches still work as before
- Test files that match both filename and content show "both" indicator
- Test results ordering (filename matches should be prominent)
- Test with regex mode disabled and enabled

**Validation Commands:**

```bash
pnpm run electron:dev
```

**Success Criteria:**

- [ ] Partial filename searches return expected files
- [ ] Case-insensitive matching works correctly
- [ ] Content-only matches still appear in results
- [ ] Match type indicators display correctly
- [ ] No regressions in existing search functionality

---

### Step 8: Gemini Code Review (Quality Gate)

**What**: Run Gemini code review to validate complete implementation quality
**Why**: AI-powered code review (Gemini 3 Pro) catches issues before they become problems. Runs non-interactively via piped git diff.
**Confidence**: High

**Validation Commands:**

```bash
/gemini-review
```

**Success Criteria:**

- [ ] Gemini review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
- [ ] Code quality approved by Gemini 3 Pro review

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] Intermediate Gemini review passes after backend changes (Step 4)
- [ ] Final Gemini code review passes (`/gemini-review`) - Step 8
- [ ] Manual verification: filename search finds expected files
- [ ] Manual verification: existing content search still works
- [ ] Manual verification: UI clearly shows match type

## Notes

- **Filename Matching Algorithm**: The implementation uses case-insensitive substring matching for filenames. The filename is extracted from the path using `path.basename()`. For example, query "Step" will match `clarify-step.tsx`, `StepComponent.ts`, and `workflow-step.tsx`.

- **Match Priority**: Files matching by filename are processed first in the loop, ensuring they appear in results even if max results limit is reached before content search completes on later files.

- **Regex Mode**: When regex mode is enabled, the filename matching also uses the regex pattern. Users should be aware that regex characters in the query will be interpreted as regex when this mode is on.

- **Snippet Generation for Filename Matches**: For files that only match by filename (no content match), the first 5-10 lines of the file are shown as context to help users identify the file.

- **No Database Changes**: This feature only modifies the search logic and UI - no database schema changes are required.

- **Backward Compatibility**: The `matchType` field is added to the result schema but existing code that doesn't use it will continue to work.
