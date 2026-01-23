# Fast File Discovery Implementation Plan

**Generated**: 2026-01-22
**Original Request**: Fast File Discovery - Search across linked repositories with regex support, snippets, and multi-select for context file addition

## Overview

**Estimated Duration**: 3-4 days
**Complexity**: High
**Risk Level**: Medium

## Quick Summary

Fast File Discovery enables users to search for relevant files across linked repositories directly from the Clarify step context section. The feature provides a search dialog with configurable parameters including query text, glob patterns, regex support, and file type filters. Results are displayed with contextual snippets and can be multi-selected for bulk addition to the feature request context.

## Prerequisites

- [ ] Verify fast-glob dependency is available in the project (already in package.json per requirements)
- [ ] Understand the existing context file schema and repository patterns
- [ ] Review the AbortController cancellation pattern used in ai-clarification.handlers.ts

## Implementation Steps

### Step 1: Define IPC Channels for File Search

**What**: Add new IPC channel constants for file search operations (search, cancel, progress)
**Why**: IPC channels must be defined as const strings before handlers can be registered
**Confidence**: High

**Files to Modify:**
- `electron/ipc/channels.ts` - Add fileSearch channel group

**Changes:**
- Add `fileSearch` object to IpcChannels with `search`, `cancel`, and `progress` channel strings

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] IpcChannels.fileSearch.search, .cancel, and .progress are accessible
- [ ] All validation commands pass

---

### Step 2: Create Validation Schemas for File Search

**What**: Define Zod schemas for file search request, results, and form values
**Why**: Type-safe validation ensures consistent data structures between renderer and main process
**Confidence**: High

**Files to Create:**
- `lib/validations/file-search.ts` - Validation schemas

**Changes:**
- Add `fileSearchRequestSchema` for search parameters (query, includeGlobs, excludeGlobs, maxResults, snippetDepth, useRegex, fileTypes)
- Add `fileSearchResultSchema` for individual file results (repositoryId, repositoryName, filePath, matchCount, snippets)
- Add `fileSearchSnippetSchema` for contextual code snippets (lineNumber, content, highlightRanges)
- Add `fileSearchFormSchema` for form validation with default values
- Add utility functions for regex validation

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] All schemas export correctly with inferred types
- [ ] Regex validation utility properly detects invalid patterns
- [ ] All validation commands pass

---

### Step 3: Create File Search IPC Handlers

**What**: Implement main process handlers for file search operations with fast-glob and content matching
**Why**: File system operations must run in the Electron main process for security and performance
**Confidence**: Medium

**Files to Create:**
- `electron/ipc/file-search.handlers.ts` - IPC handlers

**Changes:**
- Implement `registerFileSearchHandlers` function following the pattern from ai-clarification.handlers.ts
- Add search handler that accepts repositories array, queries files using fast-glob, and searches content
- Implement AbortController pattern for cancellation support
- Send progress updates to renderer via IPC stream channel
- Handle both plain text and regex search modes
- Extract contextual snippets around matches (configurable depth)
- Validate paths to prevent directory traversal (follow isValidPath pattern from fs.handlers.ts)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Handler validates search request against Zod schema
- [ ] fast-glob properly respects include/exclude patterns
- [ ] Regex mode validates pattern before execution
- [ ] AbortController properly cancels long-running searches
- [ ] Progress updates sent during search
- [ ] All validation commands pass

---

### Step 4: Register File Search Handlers and Update Preload

**What**: Wire up file search handlers to Electron main process and expose API to renderer
**Why**: Handlers must be registered at startup and exposed via contextBridge for renderer access
**Confidence**: High

**Files to Modify:**
- `electron/ipc/register-handlers.ts` - Import and call registerFileSearchHandlers
- `electron/preload.ts` - Add fileSearch namespace with search, cancel, onProgress methods

**Changes:**
- Import registerFileSearchHandlers in register-handlers.ts
- Call registerFileSearchHandlers(getMainWindow) in registerAllHandlers
- Add fileSearch object to electronAPI in preload.ts with typed methods
- Implement onProgress subscriber pattern (following onStream pattern from ai handlers)

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] File search handlers registered on app startup
- [ ] electronAPI.fileSearch.search, .cancel, .onProgress accessible from renderer
- [ ] All validation commands pass

---

### Step 5: Update ElectronAPI Types

**What**: Add type definitions for file search API to the global types file
**Why**: TypeScript requires type definitions for the exposed API to enable type-safe usage
**Confidence**: High

**Files to Modify:**
- `types/electron.ts` - Add fileSearch type definitions

**Changes:**
- Import file search types from handlers file
- Add fileSearch property to ElectronAPI interface with search, cancel, and onProgress method signatures
- Re-export file search types for renderer use

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] ElectronAPI.fileSearch is properly typed
- [ ] FileSearchRequest, FileSearchResult, FileSearchProgress types exported
- [ ] All validation commands pass

---

### Step 6: Create useElectronFileSearch Hook

**What**: Add React hook for accessing file search API with proper memoization
**Why**: Hooks provide a clean abstraction for consuming Electron APIs in React components
**Confidence**: High

**Files to Modify:**
- `hooks/useElectron.ts` - Add useElectronFileSearch hook

**Changes:**
- Add useElectronFileSearch function following useElectronAiOverview pattern
- Implement search, cancel, and subscribeToProgress methods with useCallback
- Return isElectron flag along with methods

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Hook properly accesses electronAPI.fileSearch
- [ ] Methods are memoized with useCallback
- [ ] Returns no-op functions when api is null
- [ ] All validation commands pass

---

### Step 7: IPC Infrastructure Code Review (Quality Gate)

**What**: Run Codex code review to validate IPC infrastructure implementation
**Why**: AI-powered code review catches issues before they become problems. This is a logical checkpoint after completing the IPC layer.
**Confidence**: High

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
- [ ] Code quality approved for IPC infrastructure

---

### Step 8: Create Query Key Factory for File Search

**What**: Define query keys for file search results caching with TanStack Query
**Why**: Query key factories enable organized cache management and proper invalidation
**Confidence**: High

**Files to Create:**
- `lib/queries/file-search.ts` - Query key factory

**Changes:**
- Create fileSearchKeys using createQueryKeys pattern
- Add keys for search results by featureRequestId and query hash

**Files to Modify:**
- `lib/queries/index.ts` - Import and merge fileSearchKeys

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] fileSearchKeys exported and merged into queries object
- [ ] Query keys follow existing naming conventions
- [ ] All validation commands pass

---

### Step 9: Create TanStack Query Hooks for File Search

**What**: Implement React Query hooks for executing searches and managing results state
**Why**: TanStack Query provides caching, loading states, and error handling for async operations
**Confidence**: High

**Files to Create:**
- `hooks/queries/use-file-search.ts` - Query and mutation hooks

**Changes:**
- Add useFileSearch hook using useMutation for on-demand search execution
- Implement proper loading, error, and success state handling
- Handle progress updates via streaming subscription
- Integrate with cancellation via AbortController

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] useFileSearch hook returns mutation with search/cancel capabilities
- [ ] Progress state properly tracked during search
- [ ] Error states handled gracefully
- [ ] All validation commands pass

---

### Step 10: Create File Search Dialog Component

**What**: Build the search dialog UI with form, results list, and selection management
**Why**: The dialog provides the user interface for configuring and executing file searches
**Confidence**: Medium

**Files to Create:**
- `components/features/workflow/file-search-dialog.tsx` - Dialog component

**Changes:**
- Create FileSearchDialog component following AddFileDialog pattern
- Use DialogRoot, DialogPopup, etc. from components/ui/dialog
- Implement form using useAppForm with fileSearchFormSchema validation
- Add query TextField (required), include/exclude globs TextFields with defaults
- Add regex toggle with validation error display
- Add max results NumberField (default 200) and snippet depth NumberField (default 2)
- Display repository selection if multiple repositories linked
- Show progress indicator during search
- Render results list with file path, repository name, match count, and snippets
- Implement multi-select checkboxes for result selection
- Add "Add Selected as Context" button that triggers bulk create
- Handle empty state with "No matches found" message
- Support cancellation during search

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] Dialog opens and closes properly
- [ ] Form validates required fields and regex patterns
- [ ] Search executes and displays results
- [ ] Multi-select works correctly
- [ ] Selected files can be added as context
- [ ] Loading and empty states display correctly
- [ ] Cancellation stops ongoing search
- [ ] All validation commands pass

---

### Step 11: Integrate File Search into Clarify Step

**What**: Add "Find Context Files" button to the Clarify step that opens the file search dialog
**Why**: Users need access to the file search functionality from the context section of the Clarify step
**Confidence**: High

**Files to Modify:**
- `components/features/clarify-step.tsx` - Add search button and dialog

**Changes:**
- Import FileSearchDialog component
- Add state for dialog open/close
- Add "Find Context Files" button near the context section
- Pass featureRequestId, projectId, and repository information to dialog
- Handle successful file addition by invalidating context files query

**Validation Commands:**
```bash
pnpm run lint:fix && pnpm run typecheck
```

**Success Criteria:**
- [ ] "Find Context Files" button visible in Clarify step
- [ ] Dialog opens when button clicked
- [ ] Added files appear in context list immediately
- [ ] All validation commands pass

---

### Step 12: Search Dialog UI Code Review (Quality Gate)

**What**: Run Codex code review to validate the search dialog implementation
**Why**: AI-powered code review ensures UI component follows patterns and is well-structured
**Confidence**: High

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] Component follows Base UI and CVA patterns
- [ ] Form handling and validation correct
- [ ] Code quality approved for UI component

---

### Step 13: End-to-End Testing and Refinement

**What**: Manually test the complete file search workflow and address any issues
**Why**: Integration testing ensures all components work together correctly
**Confidence**: Medium

**Validation Commands:**
```bash
pnpm electron:dev
```

**Success Criteria:**
- [ ] Search dialog opens from Clarify step
- [ ] Search executes against linked repositories
- [ ] Results display with snippets
- [ ] Multi-select and add to context works
- [ ] Cancellation stops search properly
- [ ] Regex validation prevents invalid patterns
- [ ] Empty state displays for no matches
- [ ] Progress feedback visible during search

---

### Step 14: Final Code Review (Quality Gate)

**What**: Run final Codex code review to validate complete implementation
**Why**: Final quality gate ensures all code meets standards before completion
**Confidence**: High

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] All warnings or suggestions addressed
- [ ] Complete implementation approved by GPT 5.2 review
- [ ] Code ready for production use

---

## Quality Gates

- [ ] All TypeScript files pass `pnpm run typecheck`
- [ ] All files pass `pnpm run lint:fix`
- [ ] IPC infrastructure Codex review passes (Step 7)
- [ ] Search dialog UI Codex review passes (Step 12)
- [ ] Final Codex code review passes (Step 14)
- [ ] Manual testing confirms complete workflow functions correctly

## Notes

- The fast-glob package is already available per the refined requirements, but verify the exact import path and API usage
- Regex validation should occur client-side before sending to main process to provide immediate feedback
- Progress updates should be throttled to prevent overwhelming the renderer with updates
- File content reading should be chunked for large files to prevent memory issues
- Consider adding a file size limit warning for very large files
- The existing useBulkAddContextFiles mutation should be used for adding multiple selected files
- Default exclude patterns (node_modules, .git, dist, build) are critical for performance
- Snippet extraction should gracefully handle binary files by skipping content search

---

## File Discovery Results

### Files to Create (5)
| File | Purpose |
|------|---------|
| `electron/ipc/file-search.handlers.ts` | IPC handlers for file search with fast-glob and content matching |
| `lib/validations/file-search.ts` | Zod validation schemas for search request, results, and form |
| `lib/queries/file-search.ts` | Query key factory for TanStack Query caching |
| `hooks/queries/use-file-search.ts` | TanStack Query hooks for search mutations |
| `components/features/workflow/file-search-dialog.tsx` | Search dialog UI component |

### Files to Modify (7)
| File | Changes |
|------|---------|
| `electron/ipc/channels.ts` | Add fileSearch channel group |
| `electron/ipc/register-handlers.ts` | Register file search handlers |
| `electron/preload.ts` | Expose fileSearch API to renderer |
| `types/electron.ts` | Add fileSearch type definitions |
| `hooks/useElectron.ts` | Add useElectronFileSearch hook |
| `lib/queries/index.ts` | Merge file search query keys |
| `components/features/clarify-step.tsx` | Add "Find Context Files" button |

### Reference Files (for patterns)
| File | Pattern |
|------|---------|
| `electron/ipc/fs.handlers.ts` | File system handler pattern |
| `electron/ipc/ai-clarification.handlers.ts` | AbortController and streaming pattern |
| `hooks/queries/use-feature-request-context-files.ts` | TanStack Query hooks pattern |
| `lib/validations/discovery.ts` | Validation schema pattern |
| `components/features/discovery/add-file-dialog.tsx` | Dialog with form pattern |
| `lib/forms/form-hook.ts` | useAppForm usage pattern |
