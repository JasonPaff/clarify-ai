# Step 2: File Discovery

## Metadata
- **Started**: 2026-01-18T00:02:00Z
- **Completed**: 2026-01-18T00:03:00Z
- **Status**: Completed
- **Duration**: ~60 seconds

## Discovery Summary
- **Total Files Discovered**: 42
- **Critical Priority**: 12 files (7 new, 5 existing)
- **High Priority**: 10 files (5 new, 5 existing)
- **Medium Priority**: 8 files (2 new, 6 existing)
- **Low Priority**: 12 files (reference/patterns)

## Files by Priority

### Critical Priority (Must Be Modified/Created)

| File | Status | Purpose |
|------|--------|---------|
| `db/schema/ai-usage-logs.schema.ts` | NEW | Schema for ai_usage_logs table |
| `db/repositories/ai-usage-logs.repository.ts` | NEW | Repository pattern for CRUD operations |
| `electron/ipc/ai-usage-logs.handlers.ts` | NEW | IPC handlers for usage log database access |
| `electron/ipc/channels.ts` | MODIFY | Add IPC channel constants for usage logs |
| `electron/ipc/register-handlers.ts` | MODIFY | Register new handlers |
| `electron/ipc/ai-clarification.handlers.ts` | MODIFY | Integrate token capture after streaming |
| `electron/ipc/ai-overview.handlers.ts` | MODIFY | Integrate token capture after streaming |
| `lib/ai/models.ts` | MODIFY | Add pricing info for cost tier indicators |
| `components/features/clarification/model-selector.tsx` | MODIFY | Add cost tier indicators with tooltips |
| `app/(app)/projects/[projectId]/usage/page.tsx` | NEW | Usage page route |
| `app/(app)/projects/[projectId]/usage/route-type.ts` | NEW | Route type schema |
| `components/projects/project-tabs.tsx` | MODIFY | Add "Usage" tab |

### High Priority (Should Be Modified)

| File | Status | Purpose |
|------|--------|---------|
| `types/electron.d.ts` | MODIFY | Add ElectronAPI types for usage logs |
| `electron/preload.ts` | MODIFY | Expose usage logs IPC methods |
| `hooks/useElectron.ts` | MODIFY | Add useElectronDb extension |
| `hooks/queries/use-ai-usage-logs.ts` | NEW | TanStack Query hooks |
| `lib/queries/ai-usage-logs.ts` | NEW | Query key factory |
| `lib/queries/index.ts` | MODIFY | Merge new query keys |
| `db/index.ts` | MODIFY | Import new schema |
| `components/ui/cost-confirmation-dialog.tsx` | NEW | Pre-operation confirmation dialog |
| `components/ui/usage-footer.tsx` | NEW | Post-operation usage footer |
| `lib/validations/ai-usage-log.ts` | NEW | Zod validation schemas |

### Medium Priority (May Need Updates)

| File | Status | Purpose |
|------|--------|---------|
| `components/repositories/repository-overview-generator.tsx` | MODIFY | Integrate confirmation dialog and usage footer |
| `components/features/clarification/clarification-panel.tsx` | MODIFY | Integrate confirmation dialog and usage footer |
| `lib/ai/pricing.ts` | NEW | TokenLens integration utility |
| `components/ui/tooltip.tsx` | REFERENCE | Tooltip component for cost hover |
| `components/ui/dialog.tsx` | REFERENCE | Dialog patterns |
| `components/ui/badge.tsx` | REFERENCE | Badge patterns for cost tier |
| `hooks/use-clarification.ts` | MODIFY | Support usage data in callbacks |
| `hooks/use-available-models.ts` | MODIFY | Include pricing info per model |

### Low Priority (Reference/Patterns)

- `db/schema/projects.schema.ts` - Schema patterns
- `db/schema/repository-overviews.schema.ts` - Schema with model ID
- `db/repositories/projects.repository.ts` - Repository pattern
- `db/repositories/repository-overviews.repository.ts` - Repository with SQL
- `lib/queries/projects.ts` - Query key factory pattern
- `hooks/queries/use-projects.ts` - TanStack Query hooks pattern
- `hooks/queries/use-repository-overviews.ts` - Complex query hooks
- `lib/forms/form-hook.ts` - useAppForm hook reference
- `app/(app)/projects/[projectId]/(projectId)/route-type.ts` - Route type pattern
- `app/(app)/projects/[projectId]/layout.tsx` - Project layout
- `app/globals.css` - CSS variables
- `package.json` - Confirms TokenLens v1.3.1 installed

## Key Patterns Identified

1. **Database Schema**: id (integer primary key), createdAt/updatedAt (text timestamps), indexes on queried fields
2. **Repository Pattern**: Interface + factory function taking DrizzleDatabase
3. **IPC Communication**: Channels in const object, handlers registered centrally, types in electron.d.ts
4. **TanStack Query**: Query keys via createQueryKeys, hooks with useQuery/useMutation, cache invalidation
5. **AI Handlers**: Streaming with abort controllers, dynamic provider imports, result.usage available after stream

## Integration Points

1. **Token Capture**: After streaming completes in AI handlers, access `result.usage`
2. **Cost Estimation**: TokenLens library for token counting and pricing
3. **UI Integration**: Model selector needs cost tier indicator
4. **Navigation**: Project tabs component needs "Usage" tab
