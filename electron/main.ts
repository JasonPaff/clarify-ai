import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app, BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron';
import serve from 'electron-serve';
import * as path from 'path';

import { closeDatabase, type DrizzleDatabase, initializeDatabase } from '@/db';

import { registerAllHandlers } from './ipc/register-handlers';

const isDev = process.env.NODE_ENV === 'development';
const loadURL = isDev ? null : serve({ directory: 'out' });

if (!process.env.APP_BASE_URL) {
  throw new Error('APP_BASE_URL environment variable is not set');
}

let db: DrizzleDatabase;

let mainWindow: BrowserWindow | null = null;
let devToolsWindow: BrowserWindow | null = null;

// Create DevTools window for AI debug logging
export async function createDevToolsWindow(): Promise<boolean> {
  // If window already exists, focus it
  if (devToolsWindow && !devToolsWindow.isDestroyed()) {
    devToolsWindow.focus();
    return true;
  }

  devToolsWindow = new BrowserWindow({
    backgroundColor: '#000000',
    height: 800,
    minHeight: 600,
    minWidth: 800,
    show: false,
    title: 'AI Debug Logs',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
    width: 1200,
  });

  devToolsWindow.once('ready-to-show', () => {
    devToolsWindow?.show();
  });

  try {
    if (isDev) {
      await devToolsWindow.loadURL(`${process.env.APP_BASE_URL}/devtools`);
    } else {
      await loadURL?.(devToolsWindow);
      // Navigate to the devtools route after loading
      await devToolsWindow.loadFile(path.join(__dirname, '../out/devtools.html'));
    }
  } catch (error) {
    console.error('[DevTools] Failed to load window:', error);
    devToolsWindow.destroy();
    devToolsWindow = null;
    return false;
  }

  devToolsWindow.on('closed', () => {
    devToolsWindow = null;
  });

  return true;
}

// Create application menu with View menu containing AI Debug Logs
function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Array<MenuItemConstructorOptions> = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            role: 'appMenu' as const,
          },
        ]
      : []),
    // File menu
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' as const } : { role: 'quit' as const }],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [{ role: 'pasteAndMatchStyle' as const }, { role: 'delete' as const }, { role: 'selectAll' as const }]
          : [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }]),
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        {
          accelerator: isMac ? 'Cmd+Shift+D' : 'Ctrl+Shift+D',
          click: () => {
            void createDevToolsWindow();
          },
          label: 'AI Debug Logs',
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    backgroundColor: '#000000',
    height: 1000,
    minHeight: 600,
    minWidth: 800,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
    width: 1600,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    await mainWindow.loadURL(process.env.APP_BASE_URL!);
    // mainWindow.webContents.openDevTools();
  } else {
    await loadURL?.(mainWindow);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize database and run migrations
function initializeDb(): void {
  const dbPath = isDev ? path.join(process.cwd(), 'clarify-dev.db') : path.join(app.getPath('userData'), 'clarify.db');

  db = initializeDatabase(dbPath);

  // Run migrations
  const migrationsFolder = isDev ? path.join(process.cwd(), 'drizzle') : path.join(process.resourcesPath, 'drizzle');

  migrate(db, { migrationsFolder });
}

// App lifecycle
app.whenReady().then(async () => {
  initializeDb();
  createApplicationMenu();
  registerAllHandlers(db, () => mainWindow, createDevToolsWindow);
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});
