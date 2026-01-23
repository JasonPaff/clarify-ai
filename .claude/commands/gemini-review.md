---
allowed-tools: Bash(gemini:*), Bash(git:*), Read(*), Write(*)
argument-hint: '[--base <branch>] [--commit <sha>] [review instructions]'
description: Run code reviews using the Gemini CLI with Gemini 2.5 Pro model
---

You are a code review orchestrator that uses the Gemini CLI to perform AI-powered code reviews.

## Command Usage

```
/gemini-review                                    # Review uncommitted changes
/gemini-review --base main                        # Review changes vs main branch
/gemini-review --commit abc123                    # Review specific commit
/gemini-review "Focus on security"                # Custom review instructions
/gemini-review --base main "Check for bugs"       # Combined options
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

### 2. Verify Gemini Availability

Before running the review, verify Gemini CLI is available:

```bash
gemini --version
```

If this fails, inform the user:
```
Gemini CLI is not installed or not in PATH.
Install it with: npm install -g @google/gemini-cli
Then authenticate by setting GEMINI_API_KEY environment variable.
```

### 3. Gather Diff Content

Based on parsed arguments, gather the appropriate diff content:

**Uncommitted Changes (default)**:
```bash
git diff HEAD
```
Also check for untracked files:
```bash
git status --porcelain
```

**Branch comparison**:
```bash
git diff <base>...HEAD
```

**Specific commit**:
```bash
git show <sha> --stat
git diff <sha>^..<sha>
```

### 4. Execute Review

Use Gemini CLI in non-interactive mode with the diff content piped in. The `-p` flag runs Gemini non-interactively with a prompt.

**Construct the review prompt**:
```bash
(echo "You are an expert code reviewer. Review the following code changes and provide detailed feedback on:
1. Code quality and best practices
2. Potential bugs or logic errors
3. Security vulnerabilities
4. Performance concerns
5. Readability and maintainability

{CUSTOM_INSTRUCTIONS_IF_PROVIDED}

Provide a structured review with:
- Critical Issues (must fix)
- Warnings (should consider)
- Suggestions (nice to have)
- Summary

Here are the changes to review:
" && git diff HEAD) | gemini -p "Review this code diff"
```

**For uncommitted changes**:
```bash
git diff HEAD | gemini -p "You are an expert code reviewer. Review these uncommitted code changes. Identify: 1) Critical issues that must be fixed, 2) Warnings to consider, 3) Suggestions for improvement. {custom_prompt}"
```

**For branch comparison**:
```bash
git diff <base>...HEAD | gemini -p "You are an expert code reviewer. Review these changes compared to <base> branch. Identify: 1) Critical issues that must be fixed, 2) Warnings to consider, 3) Suggestions for improvement. {custom_prompt}"
```

**For specific commit**:
```bash
git show <sha> | gemini -p "You are an expert code reviewer. Review this commit. Identify: 1) Critical issues that must be fixed, 2) Warnings to consider, 3) Suggestions for improvement. {custom_prompt}"
```

### 5. Present Results

After the review completes, present the output with:

```markdown
## Gemini Code Review Complete

**Review Mode**: {mode}
**Custom Focus**: {prompt if provided, otherwise "General review"}

### Review Output

{gemini output}
```

## Error Handling

| Error | Response |
|-------|----------|
| Gemini not found | Provide installation instructions |
| Not authenticated | Prompt to set `GEMINI_API_KEY` environment variable |
| No changes found | Inform user working directory is clean |
| Timeout (>5 min) | Report timeout, suggest smaller scope |

## Examples

**Review all uncommitted changes**:
```
/gemini-review
```
Executes: `git diff HEAD | gemini -p "Review these code changes..."`

**Review changes before PR to main**:
```
/gemini-review --base main
```
Executes: `git diff main...HEAD | gemini -p "Review these changes compared to main..."`

**Security-focused review**:
```
/gemini-review "Focus on security vulnerabilities, SQL injection, XSS, and authentication issues"
```
Executes: `git diff HEAD | gemini -p "Review these code changes. Focus on security vulnerabilities, SQL injection, XSS, and authentication issues..."`

**Review last commit with performance focus**:
```
/gemini-review --commit HEAD "Check for performance issues and unnecessary computations"
```
Executes: `git show HEAD | gemini -p "Review this commit. Check for performance issues and unnecessary computations..."`

## Important Notes

- Uses Gemini 2.5 Pro model (Gemini CLI default)
- Gemini CLI must be installed (`npm install -g @google/gemini-cli`)
- Requires `GEMINI_API_KEY` environment variable to be set
- Runs in non-interactive mode using `-p` flag
- Review timeout is set to 5 minutes for large changes
- Output is captured and displayed in conversation
- Diff content is piped directly to Gemini for analysis
