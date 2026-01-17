import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { ProjectsRepository } from "../../db/repositories";
import type { NewProject, Project } from "../../db/schema";

import { IpcChannels } from "./channels";

export function registerProjectsHandlers(
  projectsRepository: ProjectsRepository
): void {
  ipcMain.handle(IpcChannels.db.projects.getAll, (): Array<Project> => {
    return projectsRepository.getAll();
  });

  ipcMain.handle(
    IpcChannels.db.projects.getById,
    (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
      return projectsRepository.getById(id);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.create,
    (_event: IpcMainInvokeEvent, data: NewProject): Project => {
      return projectsRepository.create(data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.update,
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewProject>
    ): Project | undefined => {
      return projectsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    IpcChannels.db.projects.delete,
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return projectsRepository.delete(id);
    }
  );
}
