import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { FeatureRequestContextFilesRepository } from '@/db/repositories/feature-request-context-files.repository';
import type {
  ContextFileType,
  FeatureRequestContextFile,
  NewFeatureRequestContextFile,
} from '@/db/schema/feature-request-context-files.schema';

import { IpcChannels } from './channels';

export function registerFeatureRequestContextFilesHandlers(
  featureRequestContextFilesRepository: FeatureRequestContextFilesRepository
): void {
  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.getById,
    (_event: IpcMainInvokeEvent, id: number): FeatureRequestContextFile | undefined => {
      return featureRequestContextFilesRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.getByFeatureRequestId,
    (_event: IpcMainInvokeEvent, featureRequestId: number): Array<FeatureRequestContextFile> => {
      return featureRequestContextFilesRepository.getByFeatureRequestId(featureRequestId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.getByFeatureRequestIdAndType,
    (
      _event: IpcMainInvokeEvent,
      featureRequestId: number,
      fileType: ContextFileType
    ): Array<FeatureRequestContextFile> => {
      return featureRequestContextFilesRepository.getByFeatureRequestIdAndType(featureRequestId, fileType);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.create,
    (_event: IpcMainInvokeEvent, data: NewFeatureRequestContextFile): FeatureRequestContextFile => {
      return featureRequestContextFilesRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.bulkCreate,
    (_event: IpcMainInvokeEvent, data: Array<NewFeatureRequestContextFile>): Array<FeatureRequestContextFile> => {
      return featureRequestContextFilesRepository.bulkCreate(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewFeatureRequestContextFile>
    ): FeatureRequestContextFile | undefined => {
      return featureRequestContextFilesRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.setIncludedInContext,
    (_event: IpcMainInvokeEvent, id: number, includedInContext: boolean): FeatureRequestContextFile | undefined => {
      return featureRequestContextFilesRepository.setIncludedInContext(id, includedInContext);
    }
  );

  ipcMain.handle(
    IpcChannels.db.featureRequestContextFiles.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return featureRequestContextFilesRepository.delete(id);
    }
  );
}
