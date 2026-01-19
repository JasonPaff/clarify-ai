import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { FeatureRequestRepositoriesRepository } from '@/db/repositories/feature-request-repositories.repository';

import { IpcChannels } from './channels';

export function registerFeatureRequestRepositoriesHandlers(
  featureRequestRepositoriesRepository: FeatureRequestRepositoriesRepository
): void {
  ipcMain.handle(
    IpcChannels.db.featureRequestRepositories.getByFeatureRequestId,
    (_event: IpcMainInvokeEvent, featureRequestId: number): Array<number> => {
      return featureRequestRepositoriesRepository.getByFeatureRequestId(featureRequestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRepositories.setForFeatureRequest,
    (_event: IpcMainInvokeEvent, featureRequestId: number, repositoryIds: Array<number>): void => {
      return featureRequestRepositoriesRepository.setForFeatureRequest(featureRequestId, repositoryIds);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRepositories.addToFeatureRequest,
    (_event: IpcMainInvokeEvent, featureRequestId: number, repositoryId: number): boolean => {
      return featureRequestRepositoriesRepository.addToFeatureRequest(featureRequestId, repositoryId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestRepositories.removeFromFeatureRequest,
    (_event: IpcMainInvokeEvent, featureRequestId: number, repositoryId: number): boolean => {
      return featureRequestRepositoriesRepository.removeFromFeatureRequest(featureRequestId, repositoryId);
    }
  );
}
