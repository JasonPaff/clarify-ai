---
name: codex-review
description: Run code reviews using the Codex CLI with GPT 5.2 model. Supports reviewing uncommitted changes, changes against a base branch, or specific commits. Can be used standalone or as a quality gate in plan-feature workflow.
---

# Codex Code Review Skill

## Purpose

This skill provides AI-powered code review capabilities using the Codex CLI with GPT 5.2. It can review uncommitted changes, compare against branches, or analyze specific commits to provide quality feedback.

## When to Use This Skill

Use this skill in the following scenarios:

- Before committing code to get AI feedback on changes
- As a quality gate after generating implementation plans
- To review changes against a base branch before creating PRs
- To analyze specific commits for code quality issues
- When integrating with the plan-feature workflow as Step 4

## Usage

### Standalone Usage

```
/codex-review                           # Review uncommitted changes (default)
/codex-review --base main               # Review changes vs main branch
/codex-review --commit abc123           # Review specific commit
/codex-review "Focus on security"       # Custom review instructions
```

### Arguments

| Argument | Description |
|----------|-------------|
| `--uncommitted` | Review staged, unstaged, and untracked changes (default) |
| `--base <branch>` | Review changes against specified base branch |
| `--commit <sha>` | Review changes from a specific commit |
| `[prompt]` | Custom review instructions/focus areas |

### Examples

```bash
# Review all uncommitted work
/codex-review

# Review changes before merging to main
/codex-review --base main

# Focus review on security concerns
/codex-review "Focus on security vulnerabilities, input validation, and authentication"

# Review with performance focus
/codex-review "Analyze for performance issues, unnecessary re-renders, and optimization opportunities"

# Review specific commit
/codex-review --commit HEAD~1
```

## How This Skill Works

### 1. Parse Arguments

Extract review mode and custom instructions from the command arguments:

```
$ARGUMENTS parsing:
- If contains "--base <branch>": Use branch comparison mode
- If contains "--commit <sha>": Use commit review mode
- If contains "--uncommitted" or no flags: Use uncommitted changes mode
- Remaining text after flags: Custom review instructions
```

### 2. Execute Codex Review

Run the appropriate Codex command based on the parsed arguments. **CRITICAL**: Always use `--sandbox read-only` flag to run in read-only mode. This prevents Codex from asking for permissions, which would freeze non-interactive execution when Claude Code invokes the review.

**Uncommitted Changes (Default)**:
```bash
codex --sandbox read-only review --uncommitted [custom_prompt]
```

**Branch Comparison**:
```bash
codex --sandbox read-only review --base <branch> [custom_prompt]
```

**Specific Commit**:
```bash
codex --sandbox read-only review --commit <sha> [custom_prompt]
```

**Why Read-Only Sandbox?**
- Codex can fully inspect pending changes (git diffs, staged files) in read-only mode
- Prevents permission prompts that would block automated/non-interactive execution
- Ensures Claude Code can run reviews without human intervention
- Still provides complete code analysis and review capabilities

### 3. Capture and Present Output

- Capture the full Codex review output
- Present the review findings to the user
- Highlight any critical issues or recommendations

## Integration with plan-feature

The `/plan-feature` command generates implementation plans that include `/codex-review` as quality gate steps. These are embedded directly in the generated plan at logical checkpoints:

1. **Intermediate Quality Gates**: After completing major components, schema changes, or API work
2. **Final Quality Gate**: Always as the last step before the plan is considered complete

### How It Works in Generated Plans

When `/plan-feature` generates an implementation plan, it includes steps like:

```markdown
### Step N: Codex Code Review (Quality Gate)

**What**: Run Codex code review to validate implementation quality
**Why**: AI-powered code review catches issues before they become problems

**Validation Commands:**
```bash
/codex-review
```

**Success Criteria:**
- [ ] Codex review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
```

### Quality Gate Placement

The implementation planner adds Codex review steps:
- After completing a major component or module
- After database schema changes
- After API endpoint implementation
- After significant refactoring
- **Always as the final step** before plan completion

## Configuration

The Codex CLI uses the user's configured default model (GPT 5.2). No additional configuration is required as long as Codex is authenticated.

To verify Codex configuration:
```bash
codex --help
```

## Output Format

The skill presents review output in a structured format:

```
## Codex Code Review Results

**Review Mode**: [uncommitted/branch comparison/commit]
**Custom Focus**: [if provided]

### Review Output

[Codex review content]

### Summary

- Critical Issues: X
- Warnings: Y
- Suggestions: Z
```

## Error Handling

- **Codex not installed**: Provides installation instructions
- **Not authenticated**: Prompts user to run `codex login`
- **No changes to review**: Informs user that working directory is clean
- **Timeout**: Reports timeout and suggests retrying with smaller scope

## Important Notes

- Codex CLI must be installed and authenticated (`codex login`)
- Uses user's default Codex model configuration (GPT 5.2)
- **Runs in read-only sandbox mode** (`--sandbox read-only`) for non-interactive execution
- Codex can fully inspect git diffs and staged files in read-only mode
- No permission prompts - safe for automated/unattended execution by Claude Code
- Review output is captured and presented in the conversation
- Can be used standalone or integrated into automated workflows
- Supports custom review prompts for focused analysis
