# Repository Overview Generation - Feature Design

## Executive Summary

This feature enables users to generate AI-powered project overview documents from connected repositories. These overviews provide structured context about a codebase's architecture, tech stack, and patterns, which can then be included in the feature request refinement step to improve AI-generated clarifications without requiring full codebase analysis.

---

## 1. Feature Overview

### 1.1 Core Concept

A **Repository Overview** is an AI-generated markdown document that summarizes:
- Project purpose and goals
- Technology stack with versions
- Key features and capabilities
- Folder structure and organization
- Architectural patterns
- Development commands

This document serves as "codebase context" that can be injected into the refinement step prompt, allowing the AI to generate more relevant clarifying questions without analyzing the entire repository.

### 1.2 Value Proposition

| Without Overview | With Overview |
|------------------|---------------|
| Refinement step has no codebase context | AI understands tech stack, patterns, structure |
| Generic clarifying questions | Context-aware questions specific to the codebase |
| User must manually explain architecture | Overview provides structured project knowledge |
| Each refinement starts from scratch | Reusable context across all feature requests |

---

## 2. User Experience Design

### 2.1 Generation Entry Points

The overview can be generated from **two locations**:

#### Entry Point 1: Repository Management (Primary)

**Location:** `/projects/[projectId]/repositories` page

After connecting a repository, users see a repository card with a new "Generate Overview" action:

```
┌─────────────────────────────────────────────────────────────┐
│ my-react-app                                                │
│ C:\Users\dev\projects\my-react-app                          │
│ 1,234 files • Last scanned: 2 hours ago                     │
│                                                             │
│ Overview: ✓ Generated (Jan 18, 2026)                        │
│                                                             │
│ [Edit] [Delete] [Generate Overview] [View Overview]         │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- No overview: "Generate Overview" button shown
- Overview exists: "View Overview" and "Regenerate" options shown
- Generating: Loading spinner with "Generating overview..." text

#### Entry Point 2: Refinement Step (Secondary)

**Location:** Clarification panel in feature request workflow

When starting clarification, users can select which repository contexts to include:

```
┌─────────────────────────────────────────────────────────────┐
│ Include Repository Context                                  │
│                                                             │
│ ☑ my-react-app (overview generated)          [View] [Regen] │
│ ☐ shared-components (no overview)            [Generate]     │
│                                                             │
│ Additional Context                                          │
│ [+ Add files from this computer]                            │
│ • /docs/api-spec.md                              [Remove]   │
│ • /design/mockups.pdf                            [Remove]   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Overview Generation Flow

#### From Repository Management:

1. User clicks "Generate Overview" on a repository card
2. Modal opens showing:
   - Model selector (default: configured default model)
   - Optional: Custom prompt override
   - Repository path (read-only)
   - "Generate" and "Cancel" buttons
3. User clicks "Generate"
4. Streaming output shown in modal with real-time markdown preview
5. On completion: "Save Overview" and "Regenerate" buttons
6. Overview saved to database
7. Modal closes, card updates to show overview status

#### From Refinement Step:

1. User expands "Repository Context" section in clarification panel
2. For repos without overview: "Generate" button shown inline
3. Clicking "Generate" opens same modal as above
4. After generation, overview is automatically selected for inclusion

### 2.3 Overview Viewer/Editor

**Full Overview Modal:**
- Read-only markdown preview (default)
- "Edit" toggle switches to markdown editor
- Manual edits saved separately from AI-generated content
- "Regenerate" button to get fresh AI-generated version
- "Export" button to download as .md file

### 2.4 Using Overview in Refinement

When user starts clarification:

1. **Pre-clarification UI** shows repository context selection
2. Selected overviews are concatenated and injected into clarification prompt
3. Prompt template updated to include `{{repositoryContext}}` variable
4. AI receives: original prompt + repository overview(s) + feature request

---

## 3. Data Model

### 3.1 Database Schema Changes

**New Table: `repository_overviews`**

```typescript
// db/schema/repository-overviews.schema.ts
export const repositoryOverviews = sqliteTable(
  'repository_overviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    repositoryId: integer('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' })
      .unique(), // One overview per repository

    // AI-generated content
    content: text('content').notNull(),

    // Generation metadata
    modelId: text('model_id').notNull(), // e.g., "anthropic:claude-sonnet-4-20250514"
    promptUsed: text('prompt_used').notNull(),
    generatedAt: text('generated_at').notNull(),

    // Manual edits (if user modified the generated content)
    manualContent: text('manual_content'), // null if not manually edited
    lastEditedAt: text('last_edited_at'),

    // Standard timestamps
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  },
  (table) => [
    index('repository_overviews_repository_id_idx').on(table.repositoryId),
  ]
);
```

**Alternative: Add to existing `repositories` table**

```typescript
// Simpler approach - add columns to repositories table
{
  // ... existing fields ...
  overviewContent: text('overview_content'),
  overviewModelId: text('overview_model_id'),
  overviewPromptUsed: text('overview_prompt_used'),
  overviewGeneratedAt: text('overview_generated_at'),
  overviewManualContent: text('overview_manual_content'),
  overviewLastEditedAt: text('overview_last_edited_at'),
}
```

**Recommendation:** Use separate `repository_overviews` table for:
- Cleaner separation of concerns
- Easier to add metadata fields later
- Can track generation history if needed

### 3.2 Feature Request Context

**Update `feature_requests` table:**

```typescript
{
  // ... existing fields ...

  // Context included in refinement
  includedRepositoryIds: text('included_repository_ids'), // JSON array: [1, 2, 3]
  additionalContextFiles: text('additional_context_files'), // JSON array of file paths
  additionalContextContent: text('additional_context_content'), // JSON map: {path: content}
}
```

### 3.3 Types

```typescript
// db/schema/repository-overviews.schema.ts
export type RepositoryOverview = typeof repositoryOverviews.$inferSelect;
export type NewRepositoryOverview = typeof repositoryOverviews.$inferInsert;

// For API/UI usage
export interface RepositoryWithOverview extends Repository {
  overview: RepositoryOverview | null;
}
```

---

## 4. Technical Architecture

### 4.1 Overview Generation Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    Renderer      │     │   Main Process   │     │    AI Provider   │
│   (React UI)     │     │   (Electron)     │     │   (Anthropic)    │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │  1. Generate Overview  │                        │
         │  (repoId, modelId,     │                        │
         │   customPrompt?)       │                        │
         │───────────────────────>│                        │
         │                        │                        │
         │                        │  2. Read repo files    │
         │                        │  (file tree, package   │
         │                        │   .json, key configs)  │
         │                        │────────────┐           │
         │                        │            │           │
         │                        │<───────────┘           │
         │                        │                        │
         │                        │  3. Stream generation  │
         │                        │  (prompt + repo data)  │
         │                        │───────────────────────>│
         │                        │                        │
         │  4. Stream chunks      │  5. Stream response    │
         │<───────────────────────│<───────────────────────│
         │                        │                        │
         │  6. Complete           │                        │
         │<───────────────────────│                        │
         │                        │                        │
         │  7. Save overview      │                        │
         │───────────────────────>│                        │
         │                        │  8. Write to database  │
         │                        │────────────┐           │
         │                        │<───────────┘           │
         │  9. Confirm saved      │                        │
         │<───────────────────────│                        │
```

### 4.2 IPC Channels

```typescript
// electron/ipc/channels.ts
export const IPC_CHANNELS = {
  // ... existing channels ...

  ai: {
    // ... existing ...
    repositoryOverview: {
      generate: 'ai:repository-overview:generate',
      chunk: 'ai:repository-overview:chunk',
      complete: 'ai:repository-overview:complete',
      error: 'ai:repository-overview:error',
      cancel: 'ai:repository-overview:cancel',
    },
  },

  db: {
    // ... existing ...
    repositoryOverviews: {
      getByRepositoryId: 'db:repository-overviews:getByRepositoryId',
      create: 'db:repository-overviews:create',
      update: 'db:repository-overviews:update',
      delete: 'db:repository-overviews:delete',
    },
  },
} as const;
```

### 4.3 Repository Data Collection

Before sending to AI, the main process collects:

```typescript
interface RepositoryData {
  name: string;
  path: string;

  // File tree (directories and files, not content)
  fileTree: string; // ASCII tree representation

  // Key configuration files (content included)
  packageJson?: string;
  tsConfig?: string;
  readmeFile?: string;
  envExample?: string;

  // Detected patterns
  hasTypeScript: boolean;
  hasTailwind: boolean;
  framework: 'next' | 'react' | 'vue' | 'angular' | 'node' | 'unknown';

  // Statistics
  totalFiles: number;
  totalDirectories: number;
  primaryLanguages: string[];
}
```

**File Collection Strategy:**

1. **Always include:**
   - `package.json` / `Cargo.toml` / `requirements.txt` (dependency info)
   - `tsconfig.json` / `jsconfig.json` (config)
   - `README.md` (project description)
   - `.env.example` (environment variables)

2. **Include if present:**
   - `tailwind.config.*` (styling)
   - `next.config.*` / `vite.config.*` (framework config)
   - `drizzle.config.*` (database)
   - `eslint.config.*` (linting)

3. **Generate:**
   - File tree (directories + filenames, no content)
   - Language statistics
   - Framework detection

### 4.4 Prompt Template

```typescript
// lib/ai/prompts/repository-overview.ts
export const DEFAULT_REPOSITORY_OVERVIEW_PROMPT = `
Analyze this codebase and create a comprehensive project overview file following this exact structure:

## 1. Project Overview
Write 2-3 sentences describing what this project is and its primary purpose.

## 2. Purpose
Create 4-5 bullet points explaining the main goals and use cases of the application. Each bullet should have a bold title followed by a description.

## 3. Tech Stack
Organize the technology stack into logical categories. For each category, list the specific packages/tools with their versions when relevant. Categories should include:
- Core Framework
- Database & Backend
- Authentication & User Management (if applicable)
- UI Components & Styling
- State Management & Data Fetching
- Testing & Development Tools
- Monitoring & Error Tracking (if applicable)

## 4. Key Features
List 10-15 key features as bullet points.

## 5. Folder Structure
Document the main directories with:
- Directory path in bold
- Brief description of what it contains
- Subdirectories with their purposes (indented)

## 6. Architecture
Describe 6-8 key architectural patterns and decisions used in the project as bullet points.

## 7. Development Commands
List the essential npm/yarn scripts with descriptions:
- dev, build, test, lint, format, typecheck
- Any project-specific commands (migrations, code generation, etc.)

---

Important guidelines:
- Be specific, not generic. Reference actual file paths and package names from the codebase.
- Use consistent markdown formatting with headers, bold text, and bullet points.
- Keep descriptions concise but informative.
- Focus on what makes this project unique, not boilerplate explanations.

Here is the repository data to analyze:

Repository: {{repositoryName}}
Path: {{repositoryPath}}

### File Tree
\`\`\`
{{fileTree}}
\`\`\`

### package.json
\`\`\`json
{{packageJson}}
\`\`\`

### TypeScript Config
\`\`\`json
{{tsConfig}}
\`\`\`

### README
{{readme}}

### Other Configuration Files
{{otherConfigs}}
`;
```

---

## 5. UI Components

### 5.1 New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `RepositoryOverviewDialog` | `components/repositories/` | Modal for generating/viewing overview |
| `RepositoryOverviewPreview` | `components/repositories/` | Markdown preview of overview |
| `RepositoryOverviewEditor` | `components/repositories/` | Markdown editor for manual edits |
| `RepositoryContextSelector` | `components/features/clarification/` | Checkbox list for selecting repo contexts |
| `AdditionalContextSelector` | `components/features/clarification/` | File picker for additional context files |

### 5.2 Updated Components

| Component | Changes |
|-----------|---------|
| `RepositoryCard` | Add overview status badge, generate/view buttons |
| `ClarificationPanel` | Add repository context selection step before model selection |

### 5.3 Repository Card Enhancement

```tsx
// components/repositories/repository-card.tsx

// Add to existing card actions
{repository.overview ? (
  <>
    <Badge variant="success">Overview generated</Badge>
    <Button variant="ghost" size="sm" onClick={onViewOverview}>
      View
    </Button>
    <Button variant="ghost" size="sm" onClick={onRegenerateOverview}>
      Regenerate
    </Button>
  </>
) : (
  <Button variant="outline" size="sm" onClick={onGenerateOverview}>
    Generate Overview
  </Button>
)}
```

---

## 6. Clarification Integration

### 6.1 Updated Clarification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLARIFICATION PANEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 0: Select Context (NEW)                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Repository Context                                         │ │
│  │ ☑ my-react-app ✓        [View Overview] [Regenerate]      │ │
│  │ ☐ shared-lib            [Generate Overview]                │ │
│  │                                                            │ │
│  │ Additional Context                                         │ │
│  │ [+ Add files]                                              │ │
│  │ • design-spec.md                              [x Remove]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Step 1: Select Model                                           │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Model: [Claude Sonnet 4 ▼]                                 │ │
│  │ Custom prompt: (optional) [Edit]                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Start Clarification]                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Prompt Enhancement

```typescript
// lib/ai/prompts/clarification.ts

export function buildClarificationPrompt(
  featureRequest: string,
  repositoryContexts: string[], // Array of overview contents
  additionalContext: string[], // Array of additional file contents
  customPrompt?: string
): string {
  const basePrompt = customPrompt || DEFAULT_CLARIFICATION_PROMPT;

  let contextSection = '';

  if (repositoryContexts.length > 0) {
    contextSection += `
## Repository Context

The following repositories are associated with this project:

${repositoryContexts.map((ctx, i) => `### Repository ${i + 1}\n${ctx}`).join('\n\n')}
`;
  }

  if (additionalContext.length > 0) {
    contextSection += `
## Additional Context

${additionalContext.join('\n\n---\n\n')}
`;
  }

  return basePrompt.replace('{{repositoryContext}}', contextSection);
}
```

---

## 7. Additional Context Files

### 7.1 File Selection UX

Users can add files from their computer as additional context:

1. Click "+ Add files" button
2. File picker dialog opens (supports multiple selection)
3. Selected files are read and stored temporarily
4. Files shown as chips with remove option
5. Content included in clarification prompt

### 7.2 Supported File Types

| Type | Extensions | Handling |
|------|------------|----------|
| Markdown | `.md` | Direct inclusion |
| Text | `.txt`, `.json`, `.yaml`, `.yml` | Direct inclusion |
| Code | `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, etc. | Direct inclusion |
| PDF | `.pdf` | Text extraction (future enhancement) |
| Images | `.png`, `.jpg` | Not supported (show warning) |

### 7.3 Size Limits

- Individual file: Max 100KB
- Total additional context: Max 500KB
- Warning shown if limits exceeded

### 7.4 Storage

```typescript
// Feature request stores references only (not content)
{
  additionalContextFiles: JSON.stringify([
    { path: '/docs/spec.md', addedAt: '2026-01-18T10:00:00Z' },
    { path: '/design/api.yaml', addedAt: '2026-01-18T10:00:00Z' },
  ])
}

// Content read fresh each time clarification runs
// (files might have changed since selection)
```

---

## 8. Implementation Phases

### Phase 1: Database & Core Infrastructure
1. Create `repository_overviews` table schema
2. Create repository pattern for overviews
3. Add IPC handlers for overview CRUD
4. Add query hooks for overview data
5. Update repository queries to include overview status

### Phase 2: Overview Generation
1. Implement repository data collection (file tree, configs)
2. Create overview generation prompt template
3. Implement streaming generation handler
4. Create generation dialog component
5. Add generation action to repository card

### Phase 3: Overview Management UI
1. Create overview viewer modal
2. Create overview editor component
3. Add regenerate functionality
4. Add export to markdown
5. Update repository card with overview status

### Phase 4: Clarification Integration
1. Add repository context selector to clarification panel
2. Update clarification prompt builder
3. Update feature request schema for context tracking
4. Wire up context selection to clarification flow

### Phase 5: Additional Context Files
1. Create file picker component
2. Implement file reading and validation
3. Add storage for selected file references
4. Integrate into clarification prompt

---

## 9. Open Questions

### 9.1 Answered by This Design

| Question | Answer |
|----------|--------|
| When to generate? | Both: on repo connect AND from refinement step |
| Where to store? | Database (`repository_overviews` table) |
| Only overview or any file? | Both: overview as primary, additional files as supplement |

### 9.2 Remaining Decisions

| Question | Options | Recommendation |
|----------|---------|----------------|
| Auto-generate on repo connect? | Yes / No / Prompt user | **Prompt user** with "Generate overview now?" |
| Overview edit history? | Track all versions / Just current + original | **Just current + original** (simpler) |
| Shared overviews across projects? | Allow sharing / Repo-specific only | **Repo-specific only** (repos tied to projects) |
| File content caching? | Cache in memory / Read fresh each time | **Read fresh** (files may change) |

---

## 10. Success Metrics

| Metric | Measurement |
|--------|-------------|
| Overview generation rate | % of repositories with generated overviews |
| Context usage rate | % of clarifications that include repository context |
| Clarification quality improvement | User satisfaction with clarifying questions (future survey) |
| Generation success rate | % of overview generations that complete successfully |
| Time to generate | Average duration of overview generation |

---

## 11. Summary

This feature adds AI-generated repository overviews that:

1. **Capture codebase knowledge** - Tech stack, architecture, structure
2. **Improve refinement quality** - Context-aware clarifying questions
3. **Reduce repetitive analysis** - Reusable across all feature requests
4. **Maintain flexibility** - Users can edit, regenerate, or add more context

The design balances automation (AI-generated overviews) with user control (editing, additional files, selective inclusion).
