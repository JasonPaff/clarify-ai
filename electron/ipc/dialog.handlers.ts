import {
  type BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
} from "electron";

export function registerDialogHandlers(
  getMainWindow: () => BrowserWindow | null
): void {
  ipcMain.handle("dialog:openDirectory", async (): Promise<null | string> => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    const options: OpenDialogOptions = {
      properties: ["openDirectory"],
    };
    const result = await dialog.showOpenDialog(mainWindow, options);
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0] ?? null;
  });

  ipcMain.handle(
    "dialog:openFile",
    async (
      _event: IpcMainInvokeEvent,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      const options: OpenDialogOptions = {
        filters: filters ?? [{ extensions: ["*"], name: "All Files" }],
        properties: ["openFile"],
      };
      const result = await dialog.showOpenDialog(mainWindow, options);
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0] ?? null;
    }
  );

  ipcMain.handle(
    "dialog:saveFile",
    async (
      _event: IpcMainInvokeEvent,
      defaultPath?: string,
      filters?: Array<{ extensions: Array<string>; name: string }>
    ): Promise<null | string> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) return null;

      const options: SaveDialogOptions = {
        defaultPath,
        filters: filters ?? [{ extensions: ["*"], name: "All Files" }],
      };
      const result = await dialog.showSaveDialog(mainWindow, options);
      if (result.canceled || !result.filePath) {
        return null;
      }
      return result.filePath;
    }
  );
}
