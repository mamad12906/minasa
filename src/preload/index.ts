import { contextBridge, ipcRenderer } from 'electron'

// Expose only file-system operations via IPC (dialogs need main process)
const ipcApi = {
  excel: {
    selectFile: () => ipcRenderer.invoke('excel:selectFile'),
    readHeaders: (filePath: string) => ipcRenderer.invoke('excel:readHeaders', filePath),
    importData: (filePath: string, mapping: any) => ipcRenderer.invoke('excel:import', filePath, mapping),
  },
  backup: {
    database: () => ipcRenderer.invoke('backup:database'),
    restore: () => ipcRenderer.invoke('backup:restore'),
    excelAll: () => ipcRenderer.invoke('backup:excel-all'),
    excelUser: (userId: number, userName: string) => ipcRenderer.invoke('backup:excel-user', userId, userName),
    autoSetup: (dir: string, hours: number) => ipcRenderer.invoke('backup:auto-setup', dir, hours),
    autoStop: () => ipcRenderer.invoke('backup:auto-stop'),
    autoGet: () => ipcRenderer.invoke('backup:auto-get'),
    selectDir: () => ipcRenderer.invoke('backup:select-dir')
  }
}

// Expose IPC for file operations only
contextBridge.exposeInMainWorld('__ipc', ipcApi)

// Updater
contextBridge.exposeInMainWorld('__updater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable: (callback: any) => ipcRenderer.on('update-available', (_e, info) => callback(info)),
  onProgress: (callback: any) => ipcRenderer.on('update-progress', (_e, info) => callback(info)),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', () => callback())
})
