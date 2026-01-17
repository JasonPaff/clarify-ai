# Step 2: File Discovery

## Metadata

- **Started**: 2026-01-17T00:01:00Z
- **Completed**: 2026-01-17T00:02:00Z
- **Status**: Complete

## Input

Refined feature request from Step 1 (edit and delete projects with TanStack Form, IPC handlers, cache invalidation, etc.)

## Agent Prompt Sent

```
I need you to discover all files relevant to implementing an "edit and delete projects" feature in this Electron + Next.js application.

REFINED FEATURE REQUEST:
[Full refined request provided]

DISCOVERY REQUIREMENTS:
1. Find all files related to the projects domain
2. Find existing "Create Project" dialog/form implementations
3. Find IPC channel definitions and preload script
4. Find TanStack Query hooks for projects
5. Find sidebar components
6. Find delete confirmation dialog patterns
7. Find form field components

Categorize files by priority: CRITICAL, HIGH, MEDIUM, LOW
```

## Discovery Results

### CRITICAL PRIORITY (Files that must be modified or created)

| File                                               | Status                 | Notes                                                        |
| -------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `db/schema/projects.schema.ts`                     | Ready                  | Schema supports edit/delete                                  |
| `db/repositories/projects.repository.ts`           | Ready                  | update() and delete() already implemented                    |
| `electron/ipc/channels.ts`                         | Ready                  | "db:projects:update" and "db:projects:delete" channels exist |
| `electron/ipc/projects.handlers.ts`                | Ready                  | Update and delete handlers implemented                       |
| `electron/preload.ts`                              | Ready                  | electronAPI.db.projects has update/delete methods            |
| `types/electron.d.ts`                              | Ready                  | Type definitions complete                                    |
| `hooks/queries/use-projects.ts`                    | Ready                  | useUpdateProject and useDeleteProject hooks exist            |
| `lib/validations/project.ts`                       | **NEEDS UPDATE**       | Add updateProjectSchema                                      |
| `app/(app)/projects/[projectId]/settings/page.tsx` | **NEEDS MODIFICATION** | Add edit/delete UI                                           |

### HIGH PRIORITY (New files to create)

| File                                            | Action     | Notes                            |
| ----------------------------------------------- | ---------- | -------------------------------- |
| `components/projects/edit-project-dialog.tsx`   | **CREATE** | Modal for editing project        |
| `components/projects/edit-project-form.tsx`     | **CREATE** | Form component for editing       |
| `components/projects/delete-project-dialog.tsx` | **CREATE** | Confirmation dialog for deletion |

### MEDIUM PRIORITY (Pattern references)

| File                                          | Purpose                         |
| --------------------------------------------- | ------------------------------- |
| `components/projects/create-project-form.tsx` | Pattern for edit form           |
| `components/projects/new-project-dialog.tsx`  | Pattern for edit dialog         |
| `lib/forms/form-hook.ts`                      | useAppForm hook factory         |
| `components/ui/form/text-field.tsx`           | Text input component            |
| `components/ui/form/textarea-field.tsx`       | Textarea component              |
| `components/ui/form/submit-button.tsx`        | Submit button                   |
| `components/ui/dialog.tsx`                    | Dialog primitives               |
| `components/ui/button.tsx`                    | Button with destructive variant |

### LOW PRIORITY (Context)

| File                                   | Purpose                  |
| -------------------------------------- | ------------------------ |
| `db/index.ts`                          | Database setup reference |
| `components/layout/sidebar.tsx`        | Layout patterns          |
| `app/(app)/projects/page.tsx`          | Projects list page       |
| `components/projects/project-card.tsx` | Project display patterns |

## Key Findings

### Backend Infrastructure Status

- Database schema: **COMPLETE**
- Repository methods: **COMPLETE**
- IPC channels: **COMPLETE**
- IPC handlers: **COMPLETE**
- Preload API: **COMPLETE**
- Query hooks: **COMPLETE**
- Type definitions: **COMPLETE**

### Work Required

1. **Validation Schema** - Add `updateProjectSchema` to `lib/validations/project.ts`
2. **Edit Form Component** - Create `edit-project-form.tsx` based on create form pattern
3. **Edit Dialog** - Create `edit-project-dialog.tsx` using Base UI Dialog
4. **Delete Dialog** - Create `delete-project-dialog.tsx` using Base UI AlertDialog
5. **Settings Page** - Modify to integrate edit and delete functionality

## File Path Validation

All discovered files verified to exist:

- 35 files discovered
- 35 files validated as existing
- 0 missing files

## Discovery Statistics

- Total files discovered: 35
- Critical priority: 9
- High priority: 3 (to be created)
- Medium priority: 12
- Low priority: 11

---

_Step 2 Complete - MILESTONE:STEP_2_COMPLETE_
