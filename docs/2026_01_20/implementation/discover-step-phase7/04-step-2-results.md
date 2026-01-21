# Step 2: Create Discovery AI Prompt Builder

**Status**: ✅ Success
**Specialist**: general-purpose

## Files Created

- `lib/ai/prompts/discovery.ts` - Discovery AI prompt builder with template and build function

## Validation Results

- pnpm lint:fix: PASS
- pnpm typecheck: PASS

## Success Criteria

- [x] Prompt template includes all necessary placeholders
- [x] Builder function correctly substitutes all parameters
- [x] Custom prompt override works correctly
- [x] All validation commands pass

## Implementation Summary

The file includes:
1. `DiscoveryRepositoryOverview` interface for repository overview data
2. `DEFAULT_DISCOVERY_PROMPT` constant based on file-discovery-agent patterns
3. `buildDiscoveryPrompt` function accepting all required parameters
4. Helper functions for building repository overviews section and scope instructions
