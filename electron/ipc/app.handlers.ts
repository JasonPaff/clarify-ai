import { app, ipcMain, type IpcMainInvokeEvent } from "electron";

export function registerAppHandlers(): void {
  ipcMain.handle("app:getVersion", (): string => {
    return app.getVersion();
  });

  ipcMain.handle(
    "app:getPath",
    (
      _event: IpcMainInvokeEvent,
      name:
        | "appData"
        | "desktop"
        | "documents"
        | "downloads"
        | "home"
        | "temp"
        | "userData"
    ): string => {
      return app.getPath(name);
    }
  );
}
