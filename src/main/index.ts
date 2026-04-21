import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { register as registerFileDialogIPC } from './ipc/file-dialog.ipc'
import { register as registerBackupIPC } from './ipc/backup.ipc'
import { register as registerSyncIPC } from './ipc/sync.ipc'
import { restoreAutoBackupOnStartup, stopAutoBackup } from './services/backup.service'

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
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.maximize()
  })

  // Only forward http(s) to the OS browser. Anything else (javascript:,
  // file:, data:, custom protocols) gets silently denied to block injection.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(url)
      }
    } catch { /* malformed URL — drop */ }
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// ===== SQLite IPC (may fail on some systems) =====
function tryRegisterLocalIPC() {
  try {
    const { registerAllIPC } = require('./ipc/handlers')
    registerAllIPC()
  } catch (err: any) {
    console.error('Failed to register SQLite IPC:', err.message)
  }
}

// ===== Auto-updater =====
function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', { version: info.version, releaseNotes: info.releaseNotes })
  })
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', { percent: Math.round(progress.percent) })
  })
  autoUpdater.on('update-downloaded', () => { mainWindow?.webContents.send('update-downloaded') })
  autoUpdater.on('error', (err) => { console.error('Updater error:', err) })

  ipcMain.handle('updater:check', () => { autoUpdater.checkForUpdates().catch(() => {}) })
  ipcMain.handle('updater:download', () => { autoUpdater.downloadUpdate().catch(() => {}) })
  ipcMain.handle('updater:install', () => { autoUpdater.quitAndInstall() })

  setInterval(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 30 * 60 * 1000)
  setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 10000)
}

app.whenReady().then(() => {
  // Register IPC modules
  registerFileDialogIPC()
  registerBackupIPC()
  registerSyncIPC(() => mainWindow)
  tryRegisterLocalIPC()

  createWindow()
  setupAutoUpdater()

  // Start auto-backup from saved settings on launch
  setTimeout(() => restoreAutoBackupOnStartup(), 5000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Clear auto-backup interval on quit to prevent memory leak
app.on('before-quit', () => {
  stopAutoBackup()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
