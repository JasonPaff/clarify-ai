import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { RepositoriesRepository } from '../../db/repositories/repositories.repository';
import type { NewRepository, Repository } from '../../db/schema/repositories.schema';

import { IpcChannels } from './channels';

export function registerRepositoriesHandlers(repositoriesRepository: RepositoriesRepository): void {
  ipcMain.handle(
    IpcChannels.db.repositories.getById,
    (_event: IpcMainInvokeEvent, id: number): Repository | undefined => {
      return repositoriesRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.repositories.getByProjectId,
    (_event: IpcMainInvokeEvent, projectId: number): Array<Repository> => {
      return repositoriesRepository.getByProjectId(projectId);
    }
  );

  ipcMain.handle(IpcChannels.db.repositories.create, (_event: IpcMainInvokeEvent, data: NewRepository): Repository => {
    return repositoriesRepository.create(data);
  });

  ipcMain.handle(
    IpcChannels.db.repositories.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewRepository>): Repository | undefined => {
      return repositoriesRepository.update(id, data);
    }
  );

  ipcMain.handle(IpcChannels.db.repositories.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    return repositoriesRepository.delete(id);
  });
}
