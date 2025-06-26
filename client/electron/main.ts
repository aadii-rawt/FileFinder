import { app, BrowserWindow, Menu, dialog, ipcMain, Tray } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import chokidar from 'chokidar';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import Store from 'electron-store';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

Menu.setApplicationMenu(null);
let win: BrowserWindow | null;
let tray: Tray | null = null;

const store = new Store();
let watcher: chokidar.FSWatcher | null = null;

// 🕒 Recent uploads map for deduplication
const recentUploads = new Map<string, number>();
const UPLOAD_INTERVAL_MS = 5000; // Minimum time between reuploads per file

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
    win?.hide(); // minimize to tray
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

function setupTray() {
  tray = new Tray(path.join(process.env.VITE_PUBLIC, 'logo.png'));
  tray.setToolTip('DotDrive');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open DotDrive', click: () => win?.show() },
    { label: 'Quit', click: () => app.quit() },
  ]));
}

function shouldUpload(filePath: string): boolean {
  const now = Date.now();
  const lastTime = recentUploads.get(filePath) || 0;

  if (now - lastTime > UPLOAD_INTERVAL_MS) {
    recentUploads.set(filePath, now);
    return true;
  }

  return false;
}

async function uploadFileToServer(filePath: string) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('parent', ''); // You can customize folder ID logic here

    const res = await axios.post('http://localhost:5000/api/v1/upload', formData, {
      headers: formData.getHeaders(),
    });

    console.log('✅ Uploaded:', filePath, '→', res.data.filename);
  } catch (err: any) {
    console.error('❌ Upload failed:', filePath, err.message);
  }
}

function watchFolder(folderPath: string) {
  console.log('📂 Watching:', folderPath);

  if (watcher) watcher.close();

  watcher = chokidar.watch(folderPath, {
    ignored: (filePath) => {
      const fileName = path.basename(filePath);
      return (
        fileName.startsWith('.') ||
        fileName.endsWith('.crdownload') ||
        fileName.endsWith('.tmp') ||
        fileName.endsWith('.part') ||
        fileName.endsWith('.download')
      );
    },
    persistent: true,
    ignoreInitial: true,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s to make sure file is done writing
      pollInterval: 100,
    },
  });

  const recentUploads = new Map<string, number>();
  const UPLOAD_INTERVAL_MS = 10_000; // 10 seconds window

  const uploadIfNotDuplicate = async (filePath: string) => {
    const now = Date.now();
    const lastUploaded = recentUploads.get(filePath) || 0;

    if (now - lastUploaded < UPLOAD_INTERVAL_MS) {
      console.log('⏩ Skipping duplicate upload for:', filePath);
      return;
    }

    recentUploads.set(filePath, now);
    await uploadFileToServer(filePath);
  };

  watcher.on('add', (filePath) => {
    console.log('📥 File added:', filePath);
    uploadIfNotDuplicate(filePath);
  });

  watcher.on('change', (filePath) => {
    console.log('✏️ File changed:', filePath);
    uploadIfNotDuplicate(filePath);
  });

  watcher.on('error', (error) => {
    console.error('❌ Watcher error:', error);
  });
}


ipcMain.handle('get-selected-folder', () => {
  return store.get('syncFolder');
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    store.set('syncFolder', selectedPath);
    watchFolder(selectedPath);
    return selectedPath;
  }
  return null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  setupTray();

  const savedFolder = store.get('syncFolder') as string | undefined;
  if (savedFolder) {
    watchFolder(savedFolder);
  }

  app.setLoginItemSettings({
    openAtLogin: true,
  });
});
