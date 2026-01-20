# Setup and Routing Table

**Feature**: Phase 3 - Query Hooks & State Management

## Routing Table

| Step | Title | Specialist | Files |
|------|-------|------------|-------|
| 1 | Create Query Keys for Feature Request Runs | tanstack-query | `lib/queries/feature-request-runs.ts` |
| 2 | Create Query Keys for Step Configurations | tanstack-query | `lib/queries/step-configurations.ts` |
| 3 | Create Query Keys for Feature Request Context Files | tanstack-query | `lib/queries/feature-request-context-files.ts` |
| 4 | Update Query Keys Index | tanstack-query | `lib/queries/index.ts` |
| 5 | Update useElectronDb Hook with New Domains | tanstack-query | `hooks/useElectron.ts` |
| 6 | Create Feature Request Runs Hooks | tanstack-query | `hooks/queries/use-feature-request-runs.ts` |
| 7 | Create Step Configurations Hooks | tanstack-query | `hooks/queries/use-step-configurations.ts` |
| 8 | Create Feature Request Context Files Hooks | tanstack-query | `hooks/queries/use-feature-request-context-files.ts` |
| 9 | Update Feature Requests Hooks with Archive/Unarchive | tanstack-query | `hooks/queries/use-feature-requests.ts` |

## Specialist Assignment Summary

- **tanstack-query**: Steps 1-9 (All steps involve TanStack Query hooks, mutations, and query key management)

## Notes

- All steps are assigned to the `tanstack-query` specialist since they involve:
  - Query key definitions using `createQueryKeys`
  - TanStack Query hooks with `useQuery` and `useMutation`
  - Cache invalidation patterns
  - The `useElectronDb` hook extension (data fetching abstraction)

---

**MILESTONE:PHASE_2_COMPLETE**
