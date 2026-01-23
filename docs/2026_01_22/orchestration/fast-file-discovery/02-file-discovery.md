# Step 2: AI-Powered File Discovery

**Started**: 2026-01-22T00:01:00.000Z
**Completed**: 2026-01-22T00:02:00.000Z
**Duration**: ~60 seconds
**Status**: Completed

## Refined Request Used as Input

Fast File Discovery enables users to search for relevant files across all repositories linked to a feature request, accessible through a "Find Context Files" action in the Clarify step context section that opens a search dialog with configurable parameters. The search functionality leverages the existing fast-glob dependency for efficient file pattern matching, supporting both plain text search (default) and toggleable regex mode with full regex syntax validation that displays an error and prevents execution when the pattern is invalid. Users configure searches through a form built with TanStack Form and the useAppForm hook, providing a required query text field, include globs (defaulting to **/*), exclude globs (defaulting to **/node_modules/**, **/.git/**, **/dist/**, **/build/**), optional file type filters by extension, adjustable max results (default 200), and configurable snippet depth for matches per file (default 2-3). The search executes asynchronously through new IPC handlers registered in electron/ipc/channels.ts that perform file discovery and content searching in the Electron main process, with cancellation support via an AbortController pattern and progress feedback to the renderer. Results display in a selectable list showing repository name, file path, match count, and 2-3 contextual code snippets per file where matches occur, managed through TanStack Query for caching and state management with query keys defined in lib/queries/. The UI provides multi-select functionality allowing users to choose specific files, with a single "Add Selected as Context" action that creates entries in the feature_request_context_files table via the existing context file repository, setting includedInContext to true for immediate inclusion in AI context. Added files appear instantly in the existing context-file-list component through query invalidation. The interface handles empty states with a clear "No matches found" message, provides visual feedback during async operations, and integrates seamlessly with the existing context-file-picker component patterns. Implementation requires new IPC channels for search execution and cancellation, a search dialog component following Base UI and CVA patterns established in components/ui/, and coordination with the existing feature-request-context-files schema and repositories to persist selections.

## Discovery Statistics

| Metric | Value |
|--------|-------|
| Directories Explored | 10 |
| Candidate Files Examined | 45+ |
| Relevant Files Found | 32 |
| Files to Create | 5 |
| Files to Modify | 7 |
| Reference Files | 20 |

## Discovered Files by Priority

### Critical Priority (Core Implementation - Must Create/Modify)

| File Path | Relevance | Type |
|-----------|-----------|------|
| `electron/ipc/channels.ts` | Must add new IPC channels for `fileSearch:search`, `fileSearch:cancel`, `fileSearch:progress` | Modify |
| `electron/ipc/register-handlers.ts` | Must register new file search handlers | Modify |
| `electron/preload.ts` | Must expose new file search API to renderer process | Modify |
| `types/electron.ts` | Must add type exports for file search types and extend ElectronAPI interface | Modify |
| `electron/ipc/file-search.handlers.ts` | New IPC handlers for file discovery using fast-glob, content search, and cancellation | **Create** |
| `lib/validations/file-search.ts` | New Zod schemas for search form validation including regex validation | **Create** |
| `components/features/workflow/file-search-dialog.tsx` | New search dialog component with form, results, and multi-select | **Create** |

### High Priority (Supporting Infrastructure)

| File Path | Relevance | Type |
|-----------|-----------|------|
| `hooks/useElectron.ts` | Must add `useElectronFileSearch()` hook for file search operations | Modify |
| `lib/queries/index.ts` | Must merge new file search query keys | Modify |
| `lib/queries/file-search.ts` | New query key factory for file search results caching | **Create** |
| `hooks/queries/use-file-search.ts` | New TanStack Query hooks for file search mutations and state | **Create** |
| `components/features/clarify-step.tsx` | Must add "Find Context Files" button that opens search dialog | Modify |
| `components/features/workflow/context-file-picker.tsx` | May need integration point for search dialog trigger | Modify |

### Medium Priority (Reference Patterns)

| File Path | Relevance | Type |
|-----------|-----------|------|
| `db/schema/feature-request-context-files.schema.ts` | Existing schema for context files | Reference |
| `db/repositories/feature-request-context-files.repository.ts` | Has `bulkCreate()` method needed for adding search results | Reference |
| `db/schema/repositories.schema.ts` | Provides repository path for file searches | Reference |
| `db/repositories/repositories.repository.ts` | Pattern for repository data access | Reference |
| `electron/ipc/feature-request-context-files.handlers.ts` | Pattern for IPC handlers; `bulkCreate` handler exists | Reference |
| `electron/ipc/fs.handlers.ts` | Pattern for file system IPC operations; `isValidPath()` utility | Reference |
| `electron/ipc/lib/repository-scanner.ts` | Reference for gitignore handling and file filtering | Reference |
| `hooks/queries/use-feature-request-context-files.ts` | Has `useBulkAddContextFiles()` mutation | Reference |
| `hooks/queries/use-feature-request-repositories.ts` | Gets linked repository IDs for search scope | Reference |
| `hooks/queries/use-repositories.ts` | Gets repository details (paths) for searches | Reference |
| `lib/queries/feature-request-context-files.ts` | Query keys for cache invalidation | Reference |
| `lib/forms/form-hook.ts` | `useAppForm` hook and field components | Reference |
| `lib/validations/discovery.ts` | Pattern for validation schemas | Reference |

### Low Priority (UI Component Patterns)

| File Path | Relevance | Type |
|-----------|-----------|------|
| `components/ui/dialog.tsx` | Dialog primitives | Reference |
| `components/ui/button.tsx` | Button with variants | Reference |
| `components/ui/checkbox.tsx` | Checkbox for multi-select | Reference |
| `components/ui/empty-state.tsx` | Empty state pattern | Reference |
| `components/ui/form/text-field.tsx` | Text field pattern | Reference |
| `components/ui/form/number-field.tsx` | Number field pattern | Reference |
| `components/ui/form/switch-field.tsx` | Switch field pattern | Reference |
| `components/features/discovery/add-file-dialog.tsx` | Dialog with form pattern | Reference |
| `components/features/discovery/discovery-results.tsx` | Results list pattern | Reference |
| `components/features/workflow/context-file-list.tsx` | Context files display | Reference |

## Architecture Patterns Identified

### IPC Channel Naming
- Uses dot-notation namespace (e.g., `ai:clarification:generate`, `fs:readFile`)
- File search should use: `fileSearch:search`, `fileSearch:cancel`, `fileSearch:progress`

### Handler Registration Pattern
- Each domain has handler file exporting `register*Handlers()` function
- Called from `register-handlers.ts`

### Streaming/Progress Pattern
- AI handlers use `onStream` callbacks through preload script
- File search can follow similar pattern for progress feedback

### AbortController Pattern
- AI handlers already implement cancellation
- Reference `ai-clarification.handlers.ts` for pattern

### TanStack Query Pattern
- Uses key factories from `@lukemorales/query-key-factory`
- Mutations invalidate related keys on success

### Form Pattern
- All forms use `useAppForm` hook with Zod validators
- Pre-built field components from `lib/forms/`

### Key Dependencies
- **fast-glob** v3.3.3 - Already installed for file pattern matching
- **ignore** - Already installed for gitignore handling

## File Path Validation

All discovered files were validated:
- ✅ All reference files exist and are accessible
- ✅ All modification targets exist
- ✅ All creation targets have valid parent directories

---

**Progress Marker**: MILESTONE:STEP_2_COMPLETE
