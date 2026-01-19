import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { RepositoryOverviewsRepository } from '@/db/repositories/repository-overviews.repository';
import type { NewRepositoryOverview, RepositoryOverview } from '@/db/schema/repository-overviews.schema';

import { IpcChannels } from './channels';

export function registerRepositoryOverviewsHandlers(
  repositoryOverviewsRepository: RepositoryOverviewsRepository
): void {
  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.getByRepositoryId,
    (_event: IpcMainInvokeEvent, repositoryId: number): null | RepositoryOverview => {
      return repositoryOverviewsRepository.getByRepositoryId(repositoryId);
    }
  );

  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.create,
    (_event: IpcMainInvokeEvent, data: NewRepositoryOverview): RepositoryOverview => {
      return repositoryOverviewsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.update,
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewRepositoryOverview>): null | RepositoryOverview => {
      return repositoryOverviewsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.upsert,
    (
      _event: IpcMainInvokeEvent,
      repositoryId: number,
      data: Omit<NewRepositoryOverview, 'repositoryId'>
    ): RepositoryOverview => {
      return repositoryOverviewsRepository.upsert(repositoryId, data);
    }
  );

  ipcMain.handle(IpcChannels.db.repositoryOverviews.delete, (_event: IpcMainInvokeEvent, id: number): boolean => {
    return repositoryOverviewsRepository.delete(id);
  });

  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.deleteByRepositoryId,
    (_event: IpcMainInvokeEvent, repositoryId: number): boolean => {
      return repositoryOverviewsRepository.deleteByRepositoryId(repositoryId);
    }
  );
}
