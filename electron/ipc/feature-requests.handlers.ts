import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { FeatureRequestsRepository } from '../../db/repositories/feature-requests.repository';
import type { FeatureRequest, NewFeatureRequest } from '../../db/schema/feature-requests.schema';

import { IpcChannels } from './channels';

export function registerFeatureRequestsHandlers(featureRequestsRepository: FeatureRequestsRepository): void {
  ipcMain.handle(
    IpcChannels.db.featureRequests.getById,
    (_event: IpcMainInvokeEvent, id: number): FeatureRequest | undefined => {
      return featureRequestsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequests.getByProjectId,
    (_event: IpcMainInvokeEvent, projectId: number): Array<FeatureRequest> => {
      return featureRequestsRepository.getByProjectId(projectId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequests.create,
    (_event: IpcMainInvokeEvent, data: NewFeatureRequest): FeatureRequest => {
      return featureRequestsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequests.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewFeatureRequest>): FeatureRequest | undefined => {
      return featureRequestsRepository.update(id, data);
    }
  );

  ipcMain.handle(IpcChannels.db.featureRequests.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    return featureRequestsRepository.delete(id);
  });
}
