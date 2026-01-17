import { ipcMain, type IpcMainInvokeEvent } from "electron";

import type { ProjectsRepository } from "../../db/repositories";
import type { NewProject, Project } from "../../db/schema";

export function registerProjectsHandlers(
  projectsRepository: ProjectsRepository
): void {
  ipcMain.handle("db:projects:getAll", (): Array<Project> => {
    return projectsRepository.getAll();
  });

  ipcMain.handle(
    "db:projects:getById",
    (_event: IpcMainInvokeEvent, id: number): Project | undefined => {
      return projectsRepository.getById(id);
    }
  );

  ipcMain.handle(
    "db:projects:create",
    (_event: IpcMainInvokeEvent, data: NewProject): Project => {
      return projectsRepository.create(data);
    }
  );

  ipcMain.handle(
    "db:projects:update",
    (
      _event: IpcMainInvokeEvent,
      id: number,
      data: Partial<NewProject>
    ): Project | undefined => {
      return projectsRepository.update(id, data);
    }
  );

  ipcMain.handle(
    "db:projects:delete",
    (_event: IpcMainInvokeEvent, id: number): boolean => {
      return projectsRepository.delete(id);
    }
  );
}
