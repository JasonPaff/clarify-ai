import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import Store from 'electron-store';

import type { AiLogFilterParams, AiLogsRepository } from '@/db/repositories/ai-logs.repository';
import type { AiLog, NewAiLog } from '@/db/schema/ai-logs.schema';
import type { AiLogConfig } from '@/types/ai-log';

import { AI_DEBUG_LOGGING_STORAGE_KEY, DEFAULT_AI_DEBUG_LOGGING_CONFIG } from '@/lib/ai/debug-logging/constants';

import { IpcChannels } from './channels';

interface StoreType {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

export function registerAiLogsHandlers(
  aiLogsRepository: AiLogsRepository,
  createDevToolsWindow: () => Promise<boolean>
): void {
  // Database handlers

  ipcMain.handle(
    IpcChannels.db.aiLogs.create,
    (_event: IpcMainInvokeEvent, data: NewAiLog): AiLog => {
      return aiLogsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewAiLog>): AiLog | undefined => {
      return aiLogsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return aiLogsRepository.delete(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.getById,
    (_event: IpcMainInvokeEvent, id: number): AiLog | undefined => {
      return aiLogsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.getByRequestId,
    (_event: IpcMainInvokeEvent, requestId: string): AiLog | undefined => {
      return aiLogsRepository.getByRequestId(requestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.query,
    (_event: IpcMainInvokeEvent, params: AiLogFilterParams) => {
      return aiLogsRepository.query(params);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.purge,
    (_event: IpcMainInvokeEvent, date: string): number => {
      return aiLogsRepository.purgeOlderThan(date);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.getCount,
    (_event: IpcMainInvokeEvent, filters?: AiLogFilterParams): number => {
      return aiLogsRepository.getCount(filters);
    }
  );

  ipcMain.handle(
    IpcChannels.db.aiLogs.getLatest,
    (_event: IpcMainInvokeEvent, limit?: number): Array<AiLog> => {
      return aiLogsRepository.getLatest(limit);
    }
  );

  // Config handlers using electron-store

  ipcMain.handle(IpcChannels.aiDebugLogging.getConfig, (): AiLogConfig => {
    const config = store.get(AI_DEBUG_LOGGING_STORAGE_KEY) as AiLogConfig | undefined;
    return config ?? DEFAULT_AI_DEBUG_LOGGING_CONFIG;
  });

  ipcMain.handle(
    IpcChannels.aiDebugLogging.setConfig,
    (_event: IpcMainInvokeEvent, config: AiLogConfig): boolean => {
      try {
        store.set(AI_DEBUG_LOGGING_STORAGE_KEY, config);
        return true;
      } catch {
        return false;
      }
    }
  );

  // DevTools window handler - opens or focuses the AI Debug Logs window
  ipcMain.handle(IpcChannels.aiDebugLogging.openWindow, async (): Promise<boolean> => {
    return createDevToolsWindow();
  });
}
