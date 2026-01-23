---
allowed-tools: Task(subagent_type:gemini-review)
argument-hint: '[--base <branch>] [--commit <sha>] [review instructions]'
description: Run code reviews using the Gemini CLI
---

You are a code review orchestrator that delegates AI-powered code reviews to the gemini-review agent.

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

### 2. Delegate to Gemini Review Agent

Use the Task tool to invoke the gemini-review agent with the parsed parameters:

```
Task(subagent_type: "gemini-review")
```

**Prompt construction**:
- Include the review mode (uncommitted, base branch, or commit)
- Include any custom focus/instructions from the user
- Let the agent handle all Gemini CLI interaction

**Example prompts to the agent**:

For uncommitted changes (default):
```
Execute a Gemini code review of uncommitted changes. Review mode: uncommitted.
```

For uncommitted changes with custom focus:
```
Execute a Gemini code review of uncommitted changes. Review mode: uncommitted. Custom focus: Focus on security vulnerabilities and input validation.
```

For base branch comparison:
```
Execute a Gemini code review comparing against the main branch. Review mode: base branch comparison. Base branch: main.
```

For specific commit:
```
Execute a Gemini code review of a specific commit. Review mode: commit. Commit SHA: abc123.
```

### 3. Present Results

After the agent completes, present a summary to the user:

```markdown
## Gemini Code Review Complete

**Review Mode**: {mode}
**Custom Focus**: {prompt if provided, otherwise "General review"}

{agent's review output}
```

## Examples

**Review all uncommitted changes**:
```
/gemini-review
```
Delegates to gemini-review agent with: "Execute a Gemini code review of uncommitted changes."

**Review changes before PR to main**:
```
/gemini-review --base main
```
Delegates to gemini-review agent with: "Execute a Gemini code review comparing against main branch."

**Security-focused review**:
```
/gemini-review "Focus on security vulnerabilities, SQL injection, XSS, and authentication issues"
```
Delegates to gemini-review agent with custom focus instructions.

**Review last commit with performance focus**:
```
/gemini-review --commit HEAD "Check for performance issues"
```
Delegates to gemini-review agent for specific commit review.

## Important Notes

- Uses Gemini 3 Pro model via the Gemini CLI
- All review execution happens in the gemini-review agent (keeps main context clean)
- Agent handles Gemini CLI verification, diff gathering, and result formatting
- Review timeout is set to 5 minutes for large changes
- Results are returned from the agent and presented in the conversation
