// @ts-ignore
import { testConnection } from './services/github.ts';
import axios from 'axios';
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import store from './services/store.ts'
import { startBackgroundService, restartBackgroundService } from './services/background.ts'
// @ts-ignore
import AutoLaunch from 'auto-launch';

// const require = createRequire(import.meta.url)

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null

// Auto launch config
const autoLauncher = new AutoLaunch({
  name: 'GumroadToGit',
  path: app.getPath('exe'),
});

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    width: 900,
    height: 670,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // Security: contextIsolation true is default and good.
      // We will need to expose IPC via preload if contextIsolation is true.
      // Or enable nodeIntegration: true (less secure but easier for local app).
      // Given user rules, professional coder... stick to contextIsolation + preload.
      contextIsolation: true,
      nodeIntegration: false,
    },
    skipTaskbar: true, // Hide from taskbar (Tray only)
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  win.on('close', (event) => {
    // If we want to minimize to tray instead of quitting window
    if (!(app as any).isQuiting) {
      event.preventDefault();
      win?.hide();
    }
    return false;
  });
}

function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'logo.png'); // Use built-in icon or custom
  // Note: svg might not work well for tray on Windows, prefers .ico or .png.
  // Using nativeImage to handle it.
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: () => win?.show() },
    { type: 'separator' },
    {
      label: 'Quit', click: () => {
        (app as any).isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Gumroad to Git');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    win?.show();
  });
}

// ----- IPC Handlers -----

ipcMain.handle('get-store-value', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (_event, key, value) => {
  store.set(key, value);
  // If config changes, restart service might be needed
  if (['pollingIntervalMinutes'].includes(key)) {
    restartBackgroundService();
  }
  return true;
});

ipcMain.handle('get-all-settings', () => {
  return store.store; // returns entire object
});

ipcMain.handle('get-logs', () => {
  return store.get('logs');
});

ipcMain.handle('clear-logs', () => {
  store.set('logs', []);
  return true;
});

ipcMain.handle('set-auto-launch', async (_event, enable: boolean) => {
  try {
    if (enable) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    return await autoLauncher.isEnabled();
  } catch (error) {
    console.error('AutoLaunch error:', error);
    return false;
  }
});

ipcMain.handle('get-auto-launch', async () => {
  try {
    return await autoLauncher.isEnabled();
  } catch (error) {
    return false;
  }
});

ipcMain.handle('test-github-connection', async (_event, config) => {
  return await testConnection(config.token, config.owner, config.repo);
});

async function testGumroadConnection(accessToken: string) {
  try {
    const response = await axios.get('https://api.gumroad.com/v2/user', {
      params: { access_token: accessToken }
    });

    if (response.data.success) {
      return {
        success: true,
        user: response.data.user.name || response.data.user.email,
        email: response.data.user.email
      };
    }
    return { success: false, error: 'Token invalid or unknown error' };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || (error.message ? error.message : 'Unknown Error')
    };
  }
}

ipcMain.handle('test-gumroad-connection', async (_event, token) => {
  return await testGumroadConnection(token);
});

ipcMain.handle('reset-data', () => {
  store.set('processedSaleIds', []);
  store.set('lastCheckTime', new Date(0).toISOString());
  restartBackgroundService(); // Force immediate restart to pick up the 1970 date
  return true;
});



// ----- App Lifecycle -----

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Do not quit, keep running in tray
    // Unless explicitly quitting
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else {
    win?.show();
  }
})

app.whenReady().then(() => {
  createWindow();
  createTray();
  startBackgroundService();
});

// Helper for tray to distinguish close vs quit
(app as any).isQuiting = false;
