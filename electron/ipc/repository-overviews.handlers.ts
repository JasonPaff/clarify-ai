import { ipcMain, type IpcMainInvokeEvent } from 'electron';

import type { RepositoryOverviewsRepository } from '@/db/repositories/repository-overviews.repository';
import type { NewRepositoryOverview, RepositoryOverview } from '@/db/schema/repository-overviews.schema';

import { IpcChannels } from './channels';

export function registerRepositoryOverviewsHandlers(
  repositoryOverviewsRepository: RepositoryOverviewsRepository
): void {
  ipcMain.handle(
    IpcChannels.db.repositoryOverviews.getByRepositoryId,
    (_event: IpcMainInvokeEvent, repositoryId: number): RepositoryOverview | undefined => {
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
    (_event: IpcMainInvokeEvent, id: number, data: Partial<NewRepositoryOverview>): RepositoryOverview | undefined => {
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

  // Import handler for importing repository overviews from external markdown files
  ipcMain.handle(
    IpcChannels.electron.importRepositoryOverview,
    (
      _event: IpcMainInvokeEvent,
      repositoryId: number,
      content: string
    ): { error?: string; overview?: RepositoryOverview; success: boolean } => {
      // Validate repositoryId
      if (repositoryId <= 0) {
        return { error: 'Invalid repository ID', success: false };
      }

      // Validate content
      if (content.trim().length === 0) {
        return { error: 'Content cannot be empty', success: false };
      }

      try {
        const overview = repositoryOverviewsRepository.upsert(repositoryId, {
          content: content.trim(),
          generatedAt: new Date().toISOString(),
          modelId: 'imported',
          promptUsed: '',
        });
        return { overview, success: true };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to import overview',
          success: false,
        };
      }
    }
  );
}
