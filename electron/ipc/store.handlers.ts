import { ipcMain, type IpcMainInvokeEvent } from "electron";
import Store from "electron-store";

import { IpcChannels } from "./channels";

interface StoreType {
  delete(key: string): void;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

const store = new Store() as unknown as StoreType;

export function registerStoreHandlers(): void {
  ipcMain.handle(
    IpcChannels.store.get,
    (_event: IpcMainInvokeEvent, key: string): unknown => {
      return store.get(key);
    }
  );

  ipcMain.handle(
    IpcChannels.store.set,
    (_event: IpcMainInvokeEvent, key: string, value: unknown): boolean => {
      try {
        store.set(key, value);
        return true;
      } catch {
        return false;
      }
    }
  );

  ipcMain.handle(
    IpcChannels.store.delete,
    (_event: IpcMainInvokeEvent, key: string): boolean => {
      try {
        store.delete(key);
        return true;
      } catch {
        return false;
      }
    }
  );
}
