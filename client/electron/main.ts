import { app, BrowserWindow, Menu, ipcMain, Tray, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Store from 'electron-store';
import chokidar from 'chokidar';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

Menu.setApplicationMenu(null);
let win: BrowserWindow | null;
let tray: Tray | null = null;
const store = new Store();
let watcher: chokidar.FSWatcher | null = null;

// 📌 For debounce logic (skip duplicate uploads)
const recentUploads = new Map<string, number>();
const UPLOAD_INTERVAL = 10_000; // 10 seconds

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.on('close', (e) => {
    e.preventDefault();
    win?.hide(); // minimize to tray, keep background running
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools(); // dev only
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function setupTray() {
  tray = new Tray(path.join(process.env.VITE_PUBLIC, 'logo.png'));
  tray.setToolTip('DotDrive');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open DotDrive', click: () => win?.show() },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
}

// 🧠 Upload logic
async function uploadFile(filePath: string, userId: string) {
  const now = Date.now();
  const lastUploaded = recentUploads.get(filePath) || 0;

  if (now - lastUploaded < UPLOAD_INTERVAL) {
    console.log("⏩ Skipping duplicate upload:", filePath);
    return;
  }

  recentUploads.set(filePath, now);

  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('userId', userId);

    const res = await axios.post('http://localhost:5000/api/v1/upload', form, {
      headers: form.getHeaders(),
    });

    console.log('✅ Auto-uploaded:', filePath, '→', res.data.filename);
  } catch (err: any) {
    console.error('❌ Auto-upload failed:', err.message);
  }
}

// 📂 Watcher
function watchFolders(folderPaths: string[], userId: string) {
  if (watcher) watcher.close();

  watcher = chokidar.watch(folderPaths, {
    ignored: /(^|[/\\])\../,
    ignoreInitial: true,
    persistent: true,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on('add', (filePath) => uploadFile(filePath, userId));
  watcher.on('change', (filePath) => uploadFile(filePath, userId));

  console.log("👁️ Watching folders:", folderPaths);
}

// 💾 IPC handlers
ipcMain.on('set-token', (_, token: string | null | undefined) => {
  if (!token) store.delete('token');
  else store.set('token', token);
});

ipcMain.on('set-user-id', (_, userId: string | null | undefined) => {
  if (!userId) store.delete('userId');
  else store.set('userId', userId);
});

ipcMain.on('clear-auth', () => {
  store.delete('token');
  store.delete('userId');
  store.delete('syncFolders');
  store.delete('syncUser');
});

ipcMain.handle('get-token', () => store.get('token') || null);
ipcMain.handle('get-user-id', () => store.get('userId') || null);

// Set sync folders and start watching
ipcMain.handle('set-sync-folders', (_, folders: string[], userId: string) => {
  store.set('syncFolders', folders);
  store.set('syncUser', userId);

  watchFolders(folders, userId); // 🔥 start immediately
  return true;
});

// Folder selector
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "multiSelections"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths;
  }

  return null;
});

ipcMain.handle('get-suggested-folder', () => {
  return [
    app.getPath('documents'),
    app.getPath('downloads'),
    app.getPath('desktop'),
  ];
});


// ✅ Auto-start on login
app.setLoginItemSettings({
  openAtLogin: true,
});

// 🧠 Restore sync on boot
app.whenReady().then(() => {
  createWindow();
  setupTray();

  const savedFolders = store.get('syncFolders') as string[] | undefined;
  const userId = store.get('syncUser') as string | undefined;

  if (savedFolders && userId) {
    console.log("📁 Resuming sync for:", savedFolders);
    watchFolders(savedFolders, userId);
  }
});

// Ensure background stays even when window is closed
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    // Do NOT quit — keep watching
    e.preventDefault();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
