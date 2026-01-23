# Step 5: Create AI Discovery Prompt Template

**Status**: ✅ SUCCESS
**Specialist**: general-purpose
**Completed**: 2026-01-22

## Changes Made

**Files Created:**
- `lib/ai/prompts/ai-discovery.ts` - AI discovery prompt template and builder

**Exports:**
- `DEFAULT_AI_DISCOVERY_PROMPT` - Template with placeholders for file tree, feature request, etc.
- `buildAiDiscoveryPrompt()` - Builder function that replaces placeholders with actual values

**Placeholders Supported:**
- `{fileTree}` - Pruned file tree structure
- `{featureRequest}` - The feature request text
- `{repositoryOverviews}` - Repository context information
- `{userHints}` - Optional user hints
- `{maxFiles}` - Maximum files to return
- `{clarificationContext}` - Additional context

## Validation Results

- pnpm lint:fix: ✅ PASS
- pnpm typecheck: ✅ PASS

## Success Criteria

- [x] Prompt includes clear instructions for justification format ("1-2 sentence explanation")
- [x] Builder function replaces all placeholders correctly
- [x] Prompt emphasizes contextual relevance and reasoning
- [x] All validation commands pass

## Notes

- Designed to work with discoverFiles tool (Step 6)
- Follows patterns from discovery.ts, clarification.ts, plan.ts
- Repository overviews helper follows existing patterns
