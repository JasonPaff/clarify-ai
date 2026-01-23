---
name: gemini-review
description: Run code reviews using the Gemini CLI with Gemini 2.5 Pro model. Supports reviewing uncommitted changes, changes against a base branch, or specific commits. Can be used standalone or as a quality gate in plan-feature workflow.
---

# Gemini Code Review Skill

## Purpose

This skill provides AI-powered code review capabilities using the Gemini CLI with Gemini 2.5 Pro. It can review uncommitted changes, compare against branches, or analyze specific commits to provide quality feedback.

## When to Use This Skill

Use this skill in the following scenarios:

- Before committing code to get AI feedback on changes
- As a quality gate after generating implementation plans
- To review changes against a base branch before creating PRs
- To analyze specific commits for code quality issues
- When integrating with the plan-feature workflow as Step 4
- As an alternative to Codex review when preferring Google's Gemini model

## Usage

### Standalone Usage

```
/gemini-review                           # Review uncommitted changes (default)
/gemini-review --base main               # Review changes vs main branch
/gemini-review --commit abc123           # Review specific commit
/gemini-review "Focus on security"       # Custom review instructions
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
/gemini-review

# Review changes before merging to main
/gemini-review --base main

# Focus review on security concerns
/gemini-review "Focus on security vulnerabilities, input validation, and authentication"

# Review with performance focus
/gemini-review "Analyze for performance issues, unnecessary re-renders, and optimization opportunities"

# Review specific commit
/gemini-review --commit HEAD~1
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

### 2. Gather Git Diff Content

Unlike Codex which has a built-in review command, Gemini CLI operates via prompts. The skill gathers diff content using git commands:

**Uncommitted Changes (Default)**:
```bash
git diff HEAD
```

**Branch Comparison**:
```bash
git diff <base>...HEAD
```

**Specific Commit**:
```bash
git show <sha>
```

### 3. Execute Gemini Review

Pipe the diff content to Gemini CLI using non-interactive mode (`-p` flag):

**Uncommitted Changes**:
```bash
git diff HEAD | gemini -p "You are an expert code reviewer. Review these uncommitted code changes. Identify: 1) Critical issues, 2) Warnings, 3) Suggestions. [custom_prompt]"
```

**Branch Comparison**:
```bash
git diff <base>...HEAD | gemini -p "You are an expert code reviewer. Review these changes vs <base>. [custom_prompt]"
```

**Specific Commit**:
```bash
git show <sha> | gemini -p "You are an expert code reviewer. Review this commit. [custom_prompt]"
```

**Why Non-Interactive Mode?**
- The `-p` flag runs Gemini in non-interactive mode
- Allows Claude Code to execute reviews without human intervention
- Piping diff content directly provides full context to the model
- No permission prompts - safe for automated execution

### 4. Capture and Present Output

- Capture the full Gemini review output
- Present the review findings to the user
- Highlight any critical issues or recommendations

## Integration with plan-feature

The `/plan-feature` command can generate implementation plans that include `/gemini-review` as quality gate steps. These are embedded directly in the generated plan at logical checkpoints:

1. **Intermediate Quality Gates**: After completing major components, schema changes, or API work
2. **Final Quality Gate**: Always as the last step before the plan is considered complete

### How It Works in Generated Plans

When `/plan-feature` generates an implementation plan, it can include steps like:

```markdown
### Step N: Gemini Code Review (Quality Gate)

**What**: Run Gemini code review to validate implementation quality
**Why**: AI-powered code review catches issues before they become problems

**Validation Commands:**
```bash
/gemini-review
```

**Success Criteria:**
- [ ] Gemini review completes without critical issues
- [ ] Any warnings or suggestions addressed or documented
```

### Quality Gate Placement

The implementation planner adds Gemini review steps:
- After completing a major component or module
- After database schema changes
- After API endpoint implementation
- After significant refactoring
- **Always as the final step** before plan completion

## Configuration

The Gemini CLI uses the `GEMINI_API_KEY` environment variable for authentication. Set it in your shell profile or a `.env` file:

```bash
export GEMINI_API_KEY="your_api_key_here"
```

To verify Gemini configuration:
```bash
gemini --version
```

## Output Format

The skill presents review output in a structured format:

```
## Gemini Code Review Results

**Review Mode**: [uncommitted/branch comparison/commit]
**Custom Focus**: [if provided]

### Review Output

[Gemini review content]

### Summary

- Critical Issues: X
- Warnings: Y
- Suggestions: Z
```

## Error Handling

- **Gemini not installed**: Provides installation instructions (`npm install -g @google/gemini-cli`)
- **Not authenticated**: Prompts user to set `GEMINI_API_KEY` environment variable
- **No changes to review**: Informs user that working directory is clean
- **Timeout**: Reports timeout and suggests retrying with smaller scope

## Comparison with Codex Review

| Feature | Codex Review | Gemini Review |
|---------|--------------|---------------|
| Model | GPT 5.2 | Gemini 2.5 Pro |
| Built-in review command | Yes (`codex review`) | No (uses `-p` prompts) |
| Diff handling | Internal | Piped via git |
| Auth method | `codex login` | `GEMINI_API_KEY` env var |
| Sandbox mode | `--sandbox read-only` | Not needed (piped input) |

## Important Notes

- Gemini CLI must be installed (`npm install -g @google/gemini-cli`)
- Requires `GEMINI_API_KEY` environment variable to be set
- Uses Gemini 2.5 Pro model by default
- Runs in non-interactive mode using `-p` flag
- Git diff content is piped directly to Gemini for analysis
- No permission prompts - safe for automated/unattended execution by Claude Code
- Review output is captured and presented in the conversation
- Can be used standalone or integrated into automated workflows
- Supports custom review prompts for focused analysis
