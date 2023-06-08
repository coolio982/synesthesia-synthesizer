/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, ipcRenderer } from 'electron';
import { autoUpdater } from 'electron-updater';
import { WebSocket } from 'ws';
import { PythonShell } from 'python-shell';
import log from 'electron-log';
import fs from 'fs';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const backendDirectory = path.join(__dirname, '/../../../../Backend');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let socket: WebSocket | null = null;
let connection = false;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

ipcMain.handle('read-ini-file', async (event, filePath) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8');
    return data;
  } catch (err) {
    throw err;
  }
});

ipcMain.on('get-loc', async (event, args) => {
  if (connection) {
    console.log('nint');
    event.reply('get-loc', 'INITIALISED');
    console.log('replied');
  } else {
    event.reply('get-loc', 'No device found.');
  }
});

ipcMain.on('calibrate', async (event, args) => {
  const locationPath = path.join(backendDirectory, './Calibration.py');
  const pyshell = new PythonShell(String(locationPath));
  pyshell.on('message', function (results) {
    event.reply('calibrate', results);
  });
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1500,
    height: 880,
    autoHideMenuBar: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // WebSocket connection

  socket = new WebSocket('ws://localhost:7890');
  socket.onopen = () => {
    console.log('WebSocket connection established');
    connection = true;
    // Send a message to the server
    if (socket) {
      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const byteStream = encoder.encode('Hello from Electron');
      socket.send(byteStream);
    }
  };

  socket.onmessage = (event) => {
    // console.log(`Received message from server: ${event.data}`);
    // Handle the received message as needed
    if (mainWindow) {
      const data = event.data.toString();
      if (data.includes('wave')) {
        mainWindow.webContents.send('use-wav', data);
      } else {
        mainWindow.webContents.send('use-loc', data);
      }
      if (data.includes('effects-toggle')) {
        mainWindow.webContents.send('effects-toggle', data);
      }
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket connection error:', error);
    connection = false;
    if (mainWindow) {
      mainWindow.webContents.send('get-loc', ['No device found']);
    } else {
      console.log('the thing did not send');
    }
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  function closeWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
  
      socket.close();
    }
  }
  
  // Add window close event listener
  window.addEventListener('beforeunload', () => {
    closeWebSocket();
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
