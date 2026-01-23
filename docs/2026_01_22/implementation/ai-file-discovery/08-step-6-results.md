# Step 6: Create AI Discovery Tool Definition

**Status**: ✅ SUCCESS
**Specialist**: general-purpose
**Completed**: 2026-01-22

## Changes Made

**Files Created:**
- `lib/ai/tools/ai-discovery-tool.ts` - AI discovery tool definition

**Tool Schema Includes:**
- `files` array with path, relevance score (0-100), and justification (required, 1-500 chars)
- `summary` field for overall analysis summary
- `confidence` score and `totalFilesAnalyzed` count
- `action` field for suggested actions (read, modify, create, delete)
- `risk` field for risk level assessment (low, medium, high, critical)

**Integrations:**
- Uses `tool()` from Vercel AI SDK ('ai' package)
- Imports and uses `aiDiscoveryFileActionSchema`, `aiDiscoveryRiskLevelSchema` from validation schemas
- Exports `AiDiscoveryToolResult` interface aligned with `AiDiscoveryResult`

## Validation Results

- pnpm lint:fix: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Tool schema includes justification as required string field (1-2 sentences)
- [x] Integrates with Vercel AI SDK tool() function
- [x] Result structure matches ai-discovery validation schemas
- [x] All validation commands pass

## Notes

- Ready to be used in AI discovery handler
- modelUsed is optional (set by handler)
- pruneConfig not included in tool result (available from request context)
