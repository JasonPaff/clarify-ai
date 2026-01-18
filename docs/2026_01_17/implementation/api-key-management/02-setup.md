# Setup and Routing Table

## Routing Table

| Step | Title                                         | Specialist           | Files                                           |
| ---- | --------------------------------------------- | -------------------- | ----------------------------------------------- |
| 1    | Define IPC Channels for API Keys              | `ipc-handler`        | `electron/ipc/channels.ts`                      |
| 2    | Create API Key Types and Validation Schemas   | `tanstack-form`      | `lib/validations/api-key.ts`                    |
| 3    | Create API Keys IPC Handlers with safeStorage | `ipc-handler`        | `electron/ipc/api-keys.handlers.ts`             |
| 4    | Implement API Key Test Connection Logic       | `ipc-handler`        | `electron/ipc/api-keys.handlers.ts`             |
| 5    | Register API Keys Handlers                    | `ipc-handler`        | `electron/ipc/register-handlers.ts`             |
| 6    | Update Electron Type Definitions              | `ipc-handler`        | `types/electron.d.ts`                           |
| 7    | Expose API Keys Methods in Preload Script     | `ipc-handler`        | `electron/preload.ts`                           |
| 8    | Create useElectronApiKeys Hook                | `tanstack-query`     | `hooks/useElectron.ts`                          |
| 9    | Create Query Key Factory for API Keys         | `tanstack-query`     | `lib/queries/api-keys.ts`                       |
| 10   | Create TanStack Query Hooks for API Keys      | `tanstack-query`     | `hooks/queries/use-api-keys.ts`                 |
| 11   | Add Provider Badge Variants                   | `frontend-component` | `components/ui/badge.tsx`                       |
| 12   | Create API Key Table Component                | `frontend-component` | `components/settings/api-key-table.tsx`         |
| 13   | Create API Key Form Component                 | `tanstack-form`      | `components/settings/api-key-form.tsx`          |
| 14   | Create API Key Dialog Component               | `frontend-component` | `components/settings/api-key-dialog.tsx`        |
| 15   | Create Delete API Key Confirmation Dialog     | `frontend-component` | `components/settings/delete-api-key-dialog.tsx` |
| 16   | Create API Keys Section Component             | `frontend-component` | `components/settings/api-keys-section.tsx`      |
| 17   | Integrate API Keys Section into Settings Page | `general-purpose`    | `app/(app)/settings/page.tsx`                   |

## Specialist Breakdown

- **ipc-handler**: Steps 1, 3, 4, 5, 6, 7 (6 steps)
- **tanstack-form**: Steps 2, 13 (2 steps)
- **tanstack-query**: Steps 8, 9, 10 (3 steps)
- **frontend-component**: Steps 11, 12, 14, 15, 16 (5 steps)
- **general-purpose**: Step 17 (1 step)

## Status

✅ Routing table created. Ready to proceed with step implementation.

---

**MILESTONE:PHASE_2_COMPLETE**
