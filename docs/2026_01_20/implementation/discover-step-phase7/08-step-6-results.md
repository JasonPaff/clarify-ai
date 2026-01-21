# Step 6: Create useDiscovery Hook

**Status**: ✅ Success
**Specialist**: tanstack-query

## Files Created

- `hooks/use-discovery.ts` - Main discovery workflow hook managing lifecycle, streaming, runs, and file editing

## Validation Results

- pnpm lint:fix: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Hook manages discovery lifecycle correctly
- [x] Stream chunks processed and state updated
- [x] Runs created and updated appropriately
- [x] File editing operations work correctly
- [x] All validation commands pass

## Implementation Summary

The hook provides:
- Status management (idle -> scanning -> analyzing -> completed/failed)
- Stream chunk processing (progress, reasoning, text, tool_result)
- Run creation and updates (create on start, update on completion/failure/cancel)
- File editing operations (updateFile, removeFile, addFile)
- Results persistence to `researchFindings` field on feature request
- Uses `'research'` step name for run tracking (matching FeatureRequestRunStep type)
