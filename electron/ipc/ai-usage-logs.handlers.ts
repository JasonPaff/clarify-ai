import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { AiUsageLogsRepository, AiUsageLogTotals } from '@/db/repositories/ai-usage-logs.repository';
import type { AiUsageLog, NewAiUsageLog } from '@/db/schema/ai-usage-logs.schema';

import { IpcChannels } from './channels';

export function registerAiUsageLogsHandlers(aiUsageLogsRepository: AiUsageLogsRepository): void {
  ipcMain.handle(IpcChannels.db.aiUsageLogs.create, (_event: IpcMainInvokeEvent, data: NewAiUsageLog): AiUsageLog => {
    return aiUsageLogsRepository.create(data);
  });

  ipcMain.handle(
    IpcChannels.db.aiUsageLogs.getByProjectId,
    (_event: IpcMainInvokeEvent, projectId: number): Array<AiUsageLog> => {
      return aiUsageLogsRepository.getByProjectId(projectId);
    }
  );

  ipcMain.handle(IpcChannels.db.aiUsageLogs.delete, (_event: IpcMainInvokeEvent, projectId: number): void => {
    aiUsageLogsRepository.deleteByProjectId(projectId);
  });

  ipcMain.handle(
    IpcChannels.db.aiUsageLogs.getTotalsByProjectId,
    (_event: IpcMainInvokeEvent, projectId: number): AiUsageLogTotals | null => {
      return aiUsageLogsRepository.getTotalsByProjectId(projectId);
    }
  );
}
