import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'منصة - إدارة الزبائن والفواتير',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// File dialog IPC handlers
function registerFileIPC() {
  ipcMain.handle('excel:selectFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('backup:select-dir', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'],
      title: 'اختر مجلد'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}

// Auto-updater
function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    if (!mainWindow) return
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    if (!mainWindow) return
    mainWindow.webContents.send('update-progress', {
      percent: Math.round(progress.percent)
    })
  })

  autoUpdater.on('update-downloaded', () => {
    if (!mainWindow) return
    mainWindow.webContents.send('update-downloaded')
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
  })

  ipcMain.handle('updater:check', () => {
    autoUpdater.checkForUpdates().catch(() => {})
  })

  ipcMain.handle('updater:download', () => {
    autoUpdater.downloadUpdate().catch(() => {})
  })

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall()
  })

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 30 * 60 * 1000)

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 10000)
}

// Try to activate local SQLite IPC (may fail on some systems)
function tryRegisterLocalIPC() {
  try {
    const { registerAllIPC } = require('./ipc/handlers')
    registerAllIPC()
    console.log('Local SQLite IPC registered successfully')
    // Tell renderer that local DB is available
    if (mainWindow) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.send('local-db-ready', true)
      })
    }
  } catch (err) {
    console.error('Failed to register local IPC (SQLite not available):', err)
    // App will work in online-only mode
  }
}

app.whenReady().then(() => {
  registerFileIPC()
  createWindow()
  tryRegisterLocalIPC()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
