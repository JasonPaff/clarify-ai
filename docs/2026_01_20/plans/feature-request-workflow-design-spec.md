# Feature Request Workflow Design Specification

## Overview

This document captures the complete design for the feature request workflow in Clarify AI. The workflow transforms informal feature requests into actionable implementation plans through a 4-step AI-assisted process.

---

## Workflow Structure

### Steps

The workflow consists of 4 sequential steps:

| Step | Name         | Purpose                                            |
| ---- | ------------ | -------------------------------------------------- |
| 1    | **Describe** | User enters feature request with context           |
| 2    | **Clarify**  | AI asks clarifying questions, user refines request |
| 3    | **Discover** | AI scans repositories to find relevant files       |
| 4    | **Plan**     | AI generates implementation plan                   |

### Navigation

- **Free navigation**: Users can jump to any previously completed step
- **Stale state handling**: When a user goes back and changes something, later steps are marked "stale" with a warning banner (content remains visible)
- **Re-run behavior**: Users must manually re-run each stale step individually (no cascade)

### Step Stepper UI

- **Layout**: Horizontal stepper across the top (checkout-style)
- **Visual indicators**:
  - Checkmarks on completed steps
  - Current step highlighted
  - Warning icons on stale steps

---

## Feature Request Lifecycle

### Creation

Feature requests are created via a dialog with:

- **Title** (required)
- **Description** (optional)
- **Repository selection** (at least one required - blocks creation without)

After creation, the workflow opens to:

- Step 1 (Describe) for new feature requests
- Last active step for in-progress feature requests

### Status Labels (Auto-assigned)

Status is automatically determined by workflow progress:

```
Describing → Clarifying → Researching → Planning → Complete
```

### Persistence

- **Auto-save on change**: All changes saved automatically (like Google Docs)
- **All run history kept**: Every AI run for each step is saved and viewable

### Archiving & Deletion

- **Manual archive**: User can choose to archive completed feature requests
- **Archive location**: Same list with a filter to show/hide archived
- **Hard delete**: Permanent deletion with confirmation dialog

### Concurrent Feature Requests

- Multiple feature requests can be in progress simultaneously per project
- No limit on concurrent feature requests

---

## Step 1: Describe

### Input Fields

- **Feature description**: Main text input for the feature request
- **Repository selection**: Pre-populated from creation dialog, can add/remove
- **Context files**:
  - Repository overviews (auto-included if available)
  - Manual file picker (can select from anywhere on filesystem)

### Repository Overviews

- **Requirement**: Optional but encouraged (show warning if missing)
- **Regeneration**: Per-repo refresh button to regenerate overview
- **Prompt if missing**: When proceeding to Discover, prompt user to generate overview or proceed without

### Context Size Handling

- Show warning if combined context is very large
- Let user proceed or remove files (user decides)

---

## Step 2: Clarify

### Flow Type

**Hybrid approach**:

1. AI generates all clarifying questions at once (user waits for all to stream)
2. User answers complete set via form-style fields
3. Explicit "Request more clarification" button for additional rounds
4. "Skip clarification" option available

### When No Clarification Needed

- Display message: "Your request is clear!"
- Allow override: User can force clarification anyway
- User clicks to proceed (not auto-proceed)

### Q&A Display

- **Form-style**: Questions shown as form fields with answer inputs below each
- **Timing**: Wait for all questions to finish streaming before user answers

---

## Step 3: Discover

### Repository Processing

- **Execution**: Parallel processing across all selected repositories
- **Progress**: Individual progress bars for each repository

### Scope Selector

Before running discovery, user can limit scope:

- **Folder tree**: Visual tree with checkboxes to include/exclude directories
- **Glob patterns**: Input field for patterns (e.g., `src/**/*.ts`)
- **Per-repository**: Each repo has its own scope configuration

### Output Format

**Detailed cards** showing:

- File path
- Action needed (add/modify/review)
- Reason for inclusion
- Risk level
- Dependencies
- Relevant code snippets

**Display behavior**:

- Summary + expand: Key info visible (path, action, risk)
- Click to expand for full details (dependencies, snippets, full reason)

### User Editing

- **Full edit capability**: Users can add/remove files AND edit AI-generated descriptions
- **Edit tracking**: Visual "Edited" badge/indicator on manually modified content

---

## Step 4: Plan

### Output Format

**Rich markdown document** including:

- Headers and sections
- Step-by-step instructions
- File paths and code snippets
- Quality gates per step

### Quality Gates

Two types:

1. **Automated commands**: Commands to run (e.g., `npm test`, `npm run build`)
2. **Manual verification**: Human checkpoints describing what to verify

### User Editing

- Full editing capability on the generated plan
- "Edited" indicator on modified content

### Export Options

Three export formats available with equal prominence:

1. Copy to clipboard (as markdown)
2. Save as .md file to user-chosen location
3. Save to project docs folder (configurable per-project in settings)

### Post-Plan Actions

- **Export** and **Mark Complete** buttons shown equally
- Marking complete changes status and allows archiving

---

## Settings Panel

Each step has a collapsible settings panel containing:

### Model Selection

- Per-step model dropdown
- **Project persistence**: Selected model for a step is saved and reloaded for future feature requests in the same project

### Prompt Customization

- **Advanced mode**: Hidden by default, toggle reveals editable prompts

### AI Parameters

- **Temperature**: Slider control
- **Max tokens**: Numeric input
- **Thinking budget**:
  - On/off toggle for models without configurable budget
  - Preset levels (Off, Low, Medium, High) for models with configurable budget

### Cost Estimation

- Use third-party library for model pricing
- Display context size and estimated cost before running each step

---

## Run History

### Storage

- All runs for each step are kept permanently

### Access

- Dropdown selector showing timestamps of previous runs
- Select to view any historical run

### Viewing Historical Runs

- No visual distinction (content looks same as current)
- Dropdown indicates which run is selected
- "Use this version" button to restore an old run as current

---

## Error Handling

### AI Failures

- Show error message with "Retry" button
- No auto-retry (manual only)

### Cancellation

- Cancel button visible during streaming
- Canceling discards partial output
- Confirmation dialog before canceling

### Leaving During AI Operation

- Prompt user with warning that leaving will cancel
- User chooses to stay or leave (and cancel)

### Step Validation

- **Soft validation**: Show warning if data seems incomplete
- Allow proceeding anyway (user decides)

---

## Confirmation Dialogs

Required for all destructive actions:

- Deleting a feature request
- Restoring an old run version
- Canceling a running AI operation
- Clearing/discarding results

---

## List & Filtering

### Feature Request List

- Filter by status (dropdown)
- Search by title/description
- Archived items in same list with show/hide filter

---

## Project Settings (Related)

The following settings are configured at the project level:

- **Plan export folder**: Configurable path for "save to project docs" export option
- **Per-step model defaults**: Persisted when user selects a model for a step

---

## Technical Notes

### AI Streaming

- All AI responses stream in real-time
- Thinking/reasoning tokens always visible during streaming

### Data Flow Between Steps

1. **Describe → Clarify**: Feature description + context (overviews, files)
2. **Clarify → Discover**: Refined feature request + Q&A answers
3. **Discover → Plan**: All above + file discovery results (with user edits)

### Stale Detection

A step becomes stale when any preceding step's output changes:

- If Describe changes → Clarify, Discover, Plan become stale
- If Clarify changes → Discover, Plan become stale
- If Discover changes → Plan becomes stale

---

## UI/UX Summary

| Aspect             | Decision                            |
| ------------------ | ----------------------------------- |
| Step navigation    | Horizontal stepper, free navigation |
| AI streaming       | Always stream, show thinking        |
| Save behavior      | Auto-save on change                 |
| Model selection    | Per-step with project persistence   |
| Prompt editing     | Advanced mode (hidden by default)   |
| Q&A format         | Form-style fields                   |
| File cards         | Summary + expand                    |
| Run history        | Dropdown with timestamps            |
| Stale indicator    | Warning banner + stepper icons      |
| Keyboard shortcuts | None                                |

---

## Open Questions / Future Considerations

_None identified during design session - all major decisions captured above._
