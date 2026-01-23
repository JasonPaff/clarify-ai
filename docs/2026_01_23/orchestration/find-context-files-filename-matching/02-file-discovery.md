# Step 2: AI-Powered File Discovery

**Started**: 2026-01-23T00:00:00Z
**Completed**: 2026-01-23T00:00:00Z
**Status**: Completed

## Refined Request Input

The "Find Context Files" feature currently relies on content-based search, scanning file contents for query matches but fails to search filenames themselves—meaning searching for "ClarifyStep" won't find `clarify-step.tsx` unless that filename appears in the file's content. This limitation forces users to know both the exact filename and have it mentioned within the code, significantly reducing discoverability. The implementation in `electron/ipc/file-search.handlers.ts` uses fast-glob for file discovery and reads files into memory to scan content, which works adequately for small repositories but becomes slow as codebase size increases. The UI in `components/features/workflow/file-search-dialog.tsx` presents results as a simple search list with no directory tree browsing or project structure visualization, making it harder to navigate results in large repositories. To address the most impactful gap with minimal effort, filename matching should be added to the search logic: when a user enters a query, the search should first check if the query matches the filename (using case-insensitive pattern matching or fuzzy matching) and include files with matching names in results regardless of content, then supplement with content matches. This enhancement requires modifying the file search handler to parse filenames from discovered file paths and compare them against the query string, leveraging the existing fast-glob discovery pipeline. The validation schema in `lib/validations/file-search.ts` likely only validates the search query itself, so no database changes are needed. This single improvement directly addresses the most common user friction point—finding files by name—without expanding scope into directory tree browsing or major UI restructuring, delivering high user value with low implementation complexity.

## File Discovery Results

### Critical Priority

1. **electron/ipc/file-search.handlers.ts**
   - **Reason**: Core file search handler in Electron main process. The `performSearch` function (lines 379-537) contains the search logic that currently only searches file contents. This is where filename matching must be added.
   - **Changes**: Add filename matching logic in `performSearch` function. After file discovery via fast-glob (line 445-452), before content search (line 479-516), add phase to check if filenames match query using case-insensitive pattern matching. Files matching by name should be included in results regardless of content matches.

2. **lib/validations/file-search.ts**
   - **Reason**: Contains all validation schemas, types, and utility functions for file search. The `FileSearchRequest` schema and related types may need updates.
   - **Changes**: Potentially add new fields to `FileSearchResult` to indicate match type (filename vs content). Could add optional `searchFilenames: boolean` config option.

### High Priority

3. **components/features/workflow/file-search-dialog.tsx**
   - **Reason**: UI component displaying search results. May need updates to differentiate filename matches from content matches.
   - **Changes**: Update search query description to reflect filename+content search. Consider visual distinction for filename vs content matches. Update progress indicator if new phases added.

4. **hooks/queries/use-file-search.ts**
   - **Reason**: React hook wrapping file search IPC calls with progress tracking. Type changes would affect this hook.
   - **Changes**: Update type imports if `FileSearchProgress` changes. Update progress display logic if new phases added.

### Medium Priority

5. **electron/preload.ts**
   - **Reason**: Exposes file search API to renderer via context bridge (lines 414-427). May need updates if method signatures change.
   - **Changes**: No changes expected unless new IPC methods added.

6. **types/electron.ts**
   - **Reason**: Contains `ElectronAPI` interface and re-exports search types (lines 62-63, 96-103, 372-389). Updates to search response types reflected here.
   - **Changes**: Update type re-exports if `FileSearchResult` or `FileSearchResponse` gain new properties.

7. **hooks/useElectron.ts**
   - **Reason**: Contains `useElectronFileSearch` hook (lines 470-507) providing search functions to React components.
   - **Changes**: No changes expected unless types change.

8. **electron/ipc/channels.ts**
   - **Reason**: Defines IPC channel constants for file search (lines 115-119).
   - **Changes**: No changes expected for basic filename matching.

### Low Priority (Reference)

9. **lib/queries/file-search.ts**
   - **Reason**: TanStack Query keys for file search caching. Reference for query invalidation patterns.
   - **Changes**: No changes expected.

10. **lib/queries/index.ts**
    - **Reason**: Exports query keys including file search keys.
    - **Changes**: No changes expected.

11. **electron/ipc/register-handlers.ts**
    - **Reason**: Registers IPC handlers including file search (line 25, 66).
    - **Changes**: No changes expected.

12. **components/features/clarify-step.tsx**
    - **Reason**: Integrates `FileSearchDialog` component (lines 16, 271-282). Reference for usage context.
    - **Changes**: No changes expected.

## Architecture Insights

1. **Existing Search Flow**: Uses fast-glob for file discovery, then reads each file into memory and scans content using regex or plain text matching. Organized in two phases: `file_discovery` and `content_search`.

2. **Filename Extraction Available**: Code already has access to filenames through `path.relative(repo.path, filePath)` and `path.basename()` can extract just the filename for matching.

3. **Pattern Already Exists**: The `extractSnippets` function shows how matches are tracked with `matchCount` and `highlightRanges`. Similar pattern can be used for filename matches.

4. **No Database Changes**: Search is performed in-memory and results are displayed transiently.

5. **Result Deduplication**: When implementing, avoid duplicating files in results if a file matches both by name and content.

## Summary

| Priority | Count | Files |
|----------|-------|-------|
| Critical | 2 | file-search.handlers.ts, file-search.ts (validations) |
| High | 2 | file-search-dialog.tsx, use-file-search.ts |
| Medium | 4 | preload.ts, electron.ts (types), useElectron.ts, channels.ts |
| Low | 4 | file-search.ts (queries), index.ts, register-handlers.ts, clarify-step.tsx |
| **Total** | **12** | |

## File Path Validation

All discovered file paths verified to exist:
- ✅ electron/ipc/file-search.handlers.ts
- ✅ lib/validations/file-search.ts
- ✅ components/features/workflow/file-search-dialog.tsx
- ✅ hooks/queries/use-file-search.ts
- ✅ electron/preload.ts
- ✅ types/electron.ts
- ✅ hooks/useElectron.ts
- ✅ electron/ipc/channels.ts
- ✅ lib/queries/file-search.ts
- ✅ lib/queries/index.ts
- ✅ electron/ipc/register-handlers.ts
- ✅ components/features/clarify-step.tsx
