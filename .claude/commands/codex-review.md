---
allowed-tools: Bash(codex:*), Read(*), Write(*)
argument-hint: '[--base <branch>] [--commit <sha>] [review instructions]'
description: Run code reviews using the Codex CLI with GPT 5.2 model
---

You are a code review orchestrator that uses the Codex CLI to perform AI-powered code reviews.

## Command Usage

```
/codex-review                                    # Review uncommitted changes
/codex-review --base main                        # Review changes vs main branch
/codex-review --commit abc123                    # Review specific commit
/codex-review "Focus on security"                # Custom review instructions
/codex-review --base main "Check for bugs"       # Combined options
```

## Execution Process

### 1. Parse Arguments

Parse `$ARGUMENTS` to extract:
- **Mode flag**: `--uncommitted` (default), `--base <branch>`, or `--commit <sha>`
- **Custom prompt**: Any remaining text after flags

**Parsing Rules**:
- If `$ARGUMENTS` is empty or only whitespace: Use `--uncommitted` mode
- If contains `--base`: Extract the branch name following it
- If contains `--commit`: Extract the SHA following it
- Everything else becomes the custom review prompt

### 2. Verify Codex Availability

Before running the review, verify Codex is available:

```bash
codex --version
```

If this fails, inform the user:
```
Codex CLI is not installed or not in PATH.
Install it from: https://github.com/openai/codex
Then authenticate with: codex login
```

### 3. Execute Review

Based on parsed arguments, run the appropriate command. **CRITICAL**: Always use `--sandbox read-only` flag to prevent Codex from asking for permissions (which would freeze the non-interactive execution).

**Uncommitted Changes (default)**:
```bash
codex --sandbox read-only review --uncommitted
```

**With custom prompt**:
```bash
codex --sandbox read-only review --uncommitted "Your custom review instructions here"
```

**Branch comparison**:
```bash
codex --sandbox read-only review --base main
```

**Specific commit**:
```bash
codex --sandbox read-only review --commit <sha>
```

### 4. Present Results

After the review completes, present the output with:

```markdown
## Codex Code Review Complete

**Review Mode**: {mode}
**Custom Focus**: {prompt if provided, otherwise "General review"}

### Review Output

{codex output}
```

## Error Handling

| Error | Response |
|-------|----------|
| Codex not found | Provide installation instructions |
| Not authenticated | Prompt to run `codex login` |
| No changes found | Inform user working directory is clean |
| Timeout (>5 min) | Report timeout, suggest smaller scope |

## Examples

**Review all uncommitted changes**:
```
/codex-review
```
Executes: `codex --sandbox read-only review --uncommitted`

**Review changes before PR to main**:
```
/codex-review --base main
```
Executes: `codex --sandbox read-only review --base main`

**Security-focused review**:
```
/codex-review "Focus on security vulnerabilities, SQL injection, XSS, and authentication issues"
```
Executes: `codex --sandbox read-only review --uncommitted "Focus on security vulnerabilities, SQL injection, XSS, and authentication issues"`

**Review last commit with performance focus**:
```
/codex-review --commit HEAD "Check for performance issues and unnecessary computations"
```
Executes: `codex --sandbox read-only review --commit HEAD "Check for performance issues and unnecessary computations"`

## Important Notes

- Uses user's default Codex model (GPT 5.2)
- Codex must be installed and authenticated
- **Runs in read-only sandbox mode** to prevent permission prompts during non-interactive execution
- Review timeout is set to 5 minutes for large changes
- Output is captured and displayed in conversation
- Codex can fully inspect pending changes (git diffs, staged files) in read-only mode
