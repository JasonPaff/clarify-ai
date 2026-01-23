# Step 1: Feature Request Refinement

**Started**: 2026-01-23T00:00:00Z
**Completed**: 2026-01-23T00:00:00Z
**Status**: Completed

## Original Request

I've analyzed the current implementation of the "Find Context Files" feature and identified several key areas for improvement.

**Current Implementation Status**
- Search Scope: The search is primarily content-based. It reads files into memory and scans them for the query string.
- Missing Functionality: It does not explicitly search for filenames. If you search for ClarifyStep, it will only find files that contain the text "ClarifyStep", not the file clarify-step.tsx itself (unless the file contains its own name).
- Performance: It iterates through all files discovered by the glob patterns and reads their content. This can be slow for large repositories.
- UI: It's a simple search list. There is no way to browse the directory tree or see the project structure.

**Proposed Improvement**
1. Enable Filename Matching (High Impact, Low Effort)
   - Problem: Users often know the file name but can't find it if the content doesn't match the query.
   - Solution: Update the search logic (electron/ipc/file-search.handlers.ts) to check if the filename matches the query. If it does, include the file in the results even if the content doesn't match.

## Project Context Provided

- Next.js 16 + Electron 35 desktop application using TypeScript
- TanStack Query for data fetching, TanStack Form for forms
- Database: Drizzle ORM with SQLite (better-sqlite3)
- UI: Base UI React primitives with CVA for styling
- IPC handlers in electron/ipc/ directory
- File search uses fast-glob for file discovery
- File search dialog: components/features/workflow/file-search-dialog.tsx
- Validation schemas: lib/validations/file-search.ts

## Agent Prompt

```
Refine this feature request into a SINGLE PARAGRAPH (no headers, bullet points, or sections):

[Original request provided]

Project context: [Context provided]

Output ONLY the refined paragraph (200-500 words), nothing else. Maintain the core intent (adding filename matching to file search), add relevant technical context, but do not expand the scope or add extra features.
```

## Refined Feature Request

The "Find Context Files" feature currently relies on content-based search, scanning file contents for query matches but fails to search filenames themselves—meaning searching for "ClarifyStep" won't find `clarify-step.tsx` unless that filename appears in the file's content. This limitation forces users to know both the exact filename and have it mentioned within the code, significantly reducing discoverability. The implementation in `electron/ipc/file-search.handlers.ts` uses fast-glob for file discovery and reads files into memory to scan content, which works adequately for small repositories but becomes slow as codebase size increases. The UI in `components/features/workflow/file-search-dialog.tsx` presents results as a simple search list with no directory tree browsing or project structure visualization, making it harder to navigate results in large repositories. To address the most impactful gap with minimal effort, filename matching should be added to the search logic: when a user enters a query, the search should first check if the query matches the filename (using case-insensitive pattern matching or fuzzy matching) and include files with matching names in results regardless of content, then supplement with content matches. This enhancement requires modifying the file search handler to parse filenames from discovered file paths and compare them against the query string, leveraging the existing fast-glob discovery pipeline. The validation schema in `lib/validations/file-search.ts` likely only validates the search query itself, so no database changes are needed. This single improvement directly addresses the most common user friction point—finding files by name—without expanding scope into directory tree browsing or major UI restructuring, delivering high user value with low implementation complexity.

## Length Analysis

- **Original request**: ~200 words
- **Refined request**: ~280 words
- **Expansion ratio**: 1.4x (within 2-4x constraint)

## Scope Analysis

- **Core intent preserved**: Yes - adding filename matching to file search
- **Feature creep check**: Pass - no additional features added
- **Technical context**: Added relevant file paths and technology details

## Validation Results

- Format: Single paragraph (Pass)
- Length: 280 words (Pass - within 200-500 range)
- Scope: Intent preserved without expansion (Pass)
