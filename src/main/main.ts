import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from '../shared/constants.js';

declare const __dirname: string;

let mainWindow: BrowserWindow | null = null;
let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();

function getCpuPercent(): number {
  const currentCpuTime = Date.now();
  const currentCpuUsage = process.cpuUsage(lastCpuUsage);

  const timeDiff = (currentCpuTime - lastCpuTime) * 1000; // microssegundos
  lastCpuTime = currentCpuTime;
  lastCpuUsage = process.cpuUsage();

  if (timeDiff <= 0) return 0;
  const totalUsage = (currentCpuUsage.user + currentCpuUsage.system) / timeDiff;
  return Math.min(100, Math.max(0, Math.round(totalUsage * 100)));
}

function setupWebviewSecurity(): void {
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      console.log(`[TibIdle Security] Bloqueio de popup: ${url}`);
      return { action: 'deny' };
    });
  });
}

app.commandLine.appendSwitch('ignore-gpu-blocklist');

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#0B0E14',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 18, y: 16 },
    show: false,
    title: 'TibIdle Manager',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      sandbox: false,
      backgroundThrottling: false, // CRÍTICO: Não reduz FPS/velocidade em background
    },
  });

  Menu.setApplicationMenu(null);

  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_STATE_CHANGE, true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_STATE_CHANGE, false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_INFO, () => {
    return {
      platform: process.platform as 'darwin' | 'win32' | 'linux',
      version: app.getVersion(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    const cpu = getCpuPercent();
    let memMb = 0;
    try {
      const memoryInfo = await process.getProcessMemoryInfo();
      memMb = Math.round(memoryInfo.private / 1024);
    } catch {
      const memUsage = process.memoryUsage();
      memMb = Math.round(memUsage.rss / (1024 * 1024));
    }

    return {
      cpuUsage: cpu,
      memoryUsageMb: memMb,
    };
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createMainWindow();
    }
  });

  app.whenReady().then(() => {
    setupWebviewSecurity();
    setupIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
