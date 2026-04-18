import { BrowserWindow, ipcMain, dialog } from 'electron'

function getWin(event?: any): BrowserWindow {
  if (event?.sender) {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (w) return w
  }
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}

export function register(): void {
  // Excel file picker
  ipcMain.handle('excel:selectFile', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    } catch (err: any) {
      console.error('[excel:selectFile] Error:', err.message)
      return null
    }
  })

  // Read Excel - get ALL columns, no conditions, super simple
  ipcMain.handle('excel:readHeaders', (_event, filePath: string) => {
    const empty = { headers: [], hasHeaderRow: false, totalRows: 0, preview: [] }
    try {
      const XLSX = require('xlsx')
      const fs = require('fs')
      // Read file as buffer first (avoids permission issues)
      const buffer = fs.readFileSync(filePath)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      // Simple approach: get ref range
      const ref = sheet['!ref']
      if (!ref) return empty

      // Read all data as array of arrays
      const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (allRows.length === 0) return empty

      // Find max columns
      let maxCols = 0
      for (let i = 0; i < Math.min(allRows.length, 20); i++) {
        if (allRows[i] && allRows[i].length > maxCols) maxCols = allRows[i].length
      }

      // Build headers from first row
      const firstRow = allRows[0] || []
      const headers: string[] = []
      for (let c = 0; c < maxCols; c++) {
        const v = firstRow[c]
        const s = v != null && v !== '' ? String(v).trim() : ''
        headers.push(s || ('\u0639\u0645\u0648\u062f ' + (c + 1))) // عمود X
      }

      // Guess if first row is header
      let hasNum = false
      for (const v of firstRow) {
        if (v != null && /^\d{5,}$/.test(String(v).trim())) { hasNum = true; break }
      }
      const hasHeaderRow = !hasNum && headers.some(h => !/^\u0639\u0645\u0648\u062f \d+$/.test(h))

      // Preview
      const start = hasHeaderRow ? 1 : 0
      const preview: string[][] = []
      for (let r = start; r < Math.min(start + 3, allRows.length); r++) {
        const row: string[] = []
        for (let c = 0; c < maxCols; c++) {
          row.push(allRows[r] && allRows[r][c] != null ? String(allRows[r][c]) : '')
        }
        preview.push(row)
      }

      const result = { headers, hasHeaderRow, totalRows: allRows.length - (hasHeaderRow ? 1 : 0), preview }
      return result
    } catch (err: any) {
      console.error('[readHeaders] ERROR:', err.message, err.stack)
      return empty
    }
  })

  // Import Excel data - delegates to excel.service.ts
  ipcMain.handle('excel:import', (_event, filePath: string, mapping: any) => {
    try {
      const { importExcelData } = require('../services/excel.service')
      return importExcelData(filePath, mapping)
    } catch (err: any) {
      console.error('[excel:import] ERROR:', err.message, err.stack)
      return { success: 0, failed: 0, errors: [String(err?.message || err)] }
    }
  })

  // Backup: select directory
  ipcMain.handle('backup:select-dir', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مجلد'
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    } catch (err) { console.error('[backup:select-dir] Error:', err); return null }
  })
}
