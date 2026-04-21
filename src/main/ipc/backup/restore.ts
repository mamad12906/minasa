import { app, ipcMain, dialog } from 'electron'
import path from 'path'
import { getWin } from './shared'

export function registerRestore(): void {
  ipcMain.handle('backup:restore', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'], title: 'اختر ملف النسخة الاحتياطية',
        filters: [{ name: 'Database', extensions: ['db'] }]
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const fs = require('fs')
      const srcFile = result.filePaths[0]
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')

      try { const { closeDatabase } = require('../../database/connection'); closeDatabase() } catch (err) { console.error('[backup:restore] Failed to close database:', err) }

      if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, dbPath + '.before-restore')
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
      fs.copyFileSync(srcFile, dbPath)

      try { const { getDatabase } = require('../../database/connection'); getDatabase() } catch (err) { console.error('[backup:restore] Failed to reopen database:', err) }
      return { success: true, message: 'تم استرجاع النسخة. يرجى إعادة تشغيل البرنامج.' }
    } catch (err: any) {
      return { success: false, message: `خطأ: ${err.message}` }
    }
  })
}
