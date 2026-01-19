import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app, BrowserWindow } from 'electron';
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
  registerAllHandlers(db, () => mainWindow);
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
