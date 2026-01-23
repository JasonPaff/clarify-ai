# Implementation Setup

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Add Match Type to Validation Schema | general-purpose | `lib/validations/file-search.ts` |
| 2 | Implement Filename Matching Logic | general-purpose | `electron/ipc/file-search.handlers.ts` |
| 3 | Update Type Exports | general-purpose | `types/electron.ts` |
| 4 | Gemini Code Review (Backend) | gemini-review | - |
| 5 | Update File Search Dialog UI | frontend-component | `components/features/workflow/file-search-dialog.tsx` |
| 6 | Update Search Query Field Description | frontend-component | `components/features/workflow/file-search-dialog.tsx` |
| 7 | Manual Testing | manual | - |
| 8 | Gemini Code Review (Final) | gemini-review | - |

## Specialist Assignment Reasoning

- **Steps 1-3**: Backend/type changes - `general-purpose` handles validation schemas and type exports
- **Step 4**: Quality gate - `gemini-review` for AI code review
- **Steps 5-6**: UI component changes - `frontend-component` for React component modifications
- **Step 7**: Manual testing - orchestrator coordinates user testing
- **Step 8**: Quality gate - `gemini-review` for final review

## Status: READY TO IMPLEMENT
