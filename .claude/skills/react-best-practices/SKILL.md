---
name: react-best-practices
description: Audits React codebases for universal best practices, identifies violations by severity and type, and provides refactoring guidance. Use proactively when analyzing or refactoring React code, or invoke with /react-best-practices.
---

# React Best Practices Auditor

## Purpose

This skill performs comprehensive audits of React codebases to identify violations of universal best practices. Unlike style/convention rules, these practices prevent bugs, improve performance, and maintain code quality regardless of project preferences.

## When to Use This Skill

**Proactive use** (agent should activate automatically):

- When analyzing or reviewing React code quality
- When refactoring React components
- When asked to improve or fix React code
- Before major changes to React components

**User-invocable** via `/react-best-practices`:

- Full codebase audit
- Can specify directory or file pattern as argument

## Architecture: Parallel Subagent Analysis

**CRITICAL**: This skill uses parallel subagents to avoid context window exhaustion. The main agent orchestrates; subagents analyze files.

```
┌─────────────────────────────────────────────────────────────┐
│                      MAIN AGENT                             │
│  1. Detect libraries (package.json)                         │
│  2. Find all React files (Glob)                             │
│  3. Batch files into groups of 3-5                          │
│  4. Spawn subagents IN PARALLEL (one per batch)             │
│  5. Collect results from all subagents                      │
│  6. Aggregate into final report                             │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │ Subagent  │     │ Subagent  │     │ Subagent  │
    │ Batch 1   │     │ Batch 2   │     │ Batch N   │
    │ (3-5 files)│     │ (3-5 files)│     │ (3-5 files)│
    └───────────┘     └───────────┘     └───────────┘
```

## How to Use This Skill

### Step 1: Detect Project Context (Main Agent)

Read `package.json` to identify libraries that affect rule application:

```
Read package.json
```

**Library adjustments:**

| Library | Adjustment |
|---------|------------|
| `@tanstack/react-query` | Skip manual loading/error state rules |
| `@tanstack/react-form` | Skip controlled/uncontrolled form rules |
| `react-hook-form` | Skip controlled input warnings |
| Next.js App Router | Apply RSC rules |

Store detected libraries as context string for subagents.

### Step 2: Find All React Files (Main Agent)

```
Glob pattern: **/*.tsx
Glob pattern: **/*.jsx
Exclude: node_modules, .next, dist, build, coverage
```

Collect all file paths into a list.

### Step 3: Batch Files (Main Agent)

Group files into batches of **3-5 files each** to keep subagent context manageable.

Example batching:
```
Batch 1: [src/components/Header.tsx, src/components/Footer.tsx, src/components/Nav.tsx]
Batch 2: [src/hooks/useAuth.ts, src/hooks/useData.ts, src/hooks/useForm.ts]
Batch 3: [src/pages/Home.tsx, src/pages/Dashboard.tsx, src/pages/Settings.tsx]
...
```

### Step 4: Spawn Parallel Subagents (Main Agent)

**IMPORTANT**: Launch ALL subagents in a SINGLE message with multiple Task tool calls.

For each batch, spawn a `general-purpose` subagent with this prompt template:

```
You are auditing React files for best practices violations.

## Context
- Libraries in use: {detected_libraries}
- RSC mode: {true/false}

## Rules Reference
Read the rules from: .claude/skills/react-best-practices/references/React-Best-Practices.md

## Files to Analyze
{list of 3-5 file paths}

## Task
1. Read the rules reference document
2. Read each file in your batch
3. Check each file against ALL rules
4. Return findings in this EXACT JSON format:

```json
{
  "findings": [
    {
      "file": "path/to/file.tsx",
      "line": 45,
      "severity": "critical|warning|info",
      "type": "Effects & Hooks|State Management|...",
      "rule": "4.1 Missing Cleanup",
      "issue": "useEffect with addEventListener has no cleanup",
      "currentCode": "useEffect(() => { window.addEventListener('resize', handler); }, []);",
      "fixedCode": "useEffect(() => { window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler); }, []);"
    }
  ]
}
```

Only return the JSON. No other text.
```

### Step 5: Collect and Aggregate Results (Main Agent)

Wait for all subagents to complete, then:

1. Parse JSON from each subagent response
2. Merge all findings into a single array
3. Sort by severity (critical first, then warning, then info)
4. Group by file for the checklist

### Step 6: Generate Final Report (Main Agent)

Write the report to a markdown file:

```
Write to: docs/react-best-practices-audit.md
```

**Summary Section:**

```markdown
# React Best Practices Audit Report

**Generated**: {timestamp}
**Files analyzed**: {count}

## Summary

| Severity | Count |
|----------|-------|
| Critical | X |
| Warning | Y |
| Info | Z |

**Files analyzed**: N
**Files with issues**: M
```

**Critical Issues Section:**

```markdown
## Critical Issues (Fix Immediately)

### src/components/UserDashboard.tsx

**Line 45** - Missing Cleanup for Subscriptions (Effects & Hooks)

useEffect with addEventListener has no cleanup

**Current:**
```tsx
useEffect(() => {
  window.addEventListener('resize', handler);
}, []);
```

**Fixed:**
```tsx
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```
```

**Warning and Info sections follow same pattern.**

**Refactoring Checklist:**

```markdown
## Refactoring Checklist

### src/components/UserDashboard.tsx
- [ ] Line 45: Add cleanup to useEffect
- [ ] Line 23: Replace derived state with computed value

### src/components/DataTable.tsx
- [ ] Line 112: Use stable key instead of index
```

## Rules Summary

### Critical (Must Fix)

- Missing cleanup for subscriptions/listeners/intervals
- Rules of Hooks violations (conditionals, loops)
- Dynamic list keys using array index
- Client-only code in Server Components
- Non-serializable props to Client Components

### Warning (Should Fix)

- Component size > 150 lines or multiple responsibilities
- Mixed controlled/uncontrolled inputs in same form
- Deeply nested ternaries in JSX
- Inline object/array literals as props
- Business logic in render
- Storing derived state
- Expensive state initialization without lazy init
- Duplicate state across sibling components
- Data fetching without AbortController
- Effects that should be derived state or event handlers
- Missing effect dependencies
- Custom hooks without `use` prefix
- Missing useMemo/useCallback where needed
- Unnecessary useMemo/useCallback where not needed
- React.memo misuse (overuse or missing where needed)
- Missing error state for async operations
- Try-catch missing in async handlers
- Silent catch blocks
- `any` type in props
- Wrong event handler types

### Info (Recommendations)

- URL state stored in React state
- Error boundaries for critical sections
- Props interface naming convention

## Important Notes

- **ALWAYS use parallel subagents** - Never read all files in main agent context
- **Batch size 3-5 files** - Keeps subagent context manageable
- **Single Task message** - Spawn all subagents in ONE message for true parallelism
- **JSON output from subagents** - Makes aggregation reliable
- **Prioritize by impact** - Critical issues first in final report
- **Write to file** - Output goes to `docs/react-best-practices-audit.md`, not just console

## Workflow Summary

```
MAIN AGENT:
1. Read package.json → detect libraries
2. Glob **/*.tsx and **/*.jsx → collect file list
3. Batch files into groups of 3-5
4. Spawn N subagents IN PARALLEL (single message, multiple Task calls)
5. Wait for all subagents to complete
6. Parse and merge all JSON findings
7. Sort by severity, group by file
8. Write report to docs/react-best-practices-audit.md
9. Inform user of file location and summary stats
```

This architecture scales to large codebases without exhausting context.
