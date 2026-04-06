import * as XLSX from 'xlsx'
import { getDatabase } from '../database/connection'
import { listCustomColumns } from '../database/columns'

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export interface ColumnMapping {
  [excelColumn: string]: string
}

export function readExcelHeaders(filePath: string): string[] {
  const workbook = XLSX.read(require('fs').readFileSync(filePath), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  // Try header: 1 first (raw rows)
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, defval: '' })
  if (!data || data.length === 0) return []

  // Find first non-empty row as headers (skip empty rows at top)
  for (let i = 0; i < Math.min(data.length, 5); i++) {
    const row = data[i] as any[]
    if (!row) continue
    const headers = row.map(h => String(h || '').trim()).filter(h => h.length > 0)
    if (headers.length >= 2) return headers // at least 2 columns = valid header row
  }

  // Fallback: use sheet_to_json keys
  const jsonData = XLSX.utils.sheet_to_json<any>(sheet)
  if (jsonData.length > 0) {
    return Object.keys(jsonData[0]).filter(k => k && k !== '__EMPTY')
  }

  return []
}

export function readExcelData(filePath: string): any[] {
  const workbook = XLSX.read(require('fs').readFileSync(filePath), { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<any>(sheet)
}

export function importExcelData(filePath: string, mapping: ColumnMapping): ImportResult {
  // Extract forced platform if present
  const forcePlatform = (mapping as any).__force_platform__ || ''
  delete (mapping as any).__force_platform__
  console.log('[import] Starting import. Platform:', forcePlatform)

  let rows: any[]
  try {
    rows = readExcelData(filePath)
  } catch (err: any) {
    console.error('[import] Failed to read Excel:', err)
    return { success: 0, failed: 0, errors: [`فشل قراءة الملف: ${err.message}`] }
  }

  if (!rows || rows.length === 0) {
    return { success: 0, failed: 0, errors: ['الملف فارغ أو لا يحتوي على بيانات'] }
  }

  console.log('[import] Rows:', rows.length)
  const db = getDatabase()

  let success = 0
  let failed = 0
  const errors: string[] = []

  // Custom columns
  let customColNames: string[] = []
  try {
    customColNames = listCustomColumns('customers').map(c => c.column_name)
  } catch (_) {}

  // Build SQL once
  const baseFields = ['platform_name', 'full_name', 'mother_name', 'phone_number', 'card_number', 'category', 'ministry_name', 'status_note', 'reminder_date', 'reminder_text', 'user_id', 'months_count', 'notes']
  const allFields = [...baseFields, ...customColNames]
  const placeholders = allFields.map(() => '?').join(', ')
  const insertCustomerSQL = `INSERT INTO customers (${allFields.join(', ')}) VALUES (${placeholders})`
  const insertInvoiceSQL = `INSERT INTO invoices (customer_id, invoice_number, total_months, total_amount, monthly_deduction, creation_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`

  // Prepare once, reuse for all rows
  const stmtCustomer = db.prepare(insertCustomerSQL)
  const stmtInvoice = db.prepare(insertInvoiceSQL)

  // Helper
  const getValue = (row: any, field: string): string => {
    for (const [excelCol, dbField] of Object.entries(mapping)) {
      if (dbField === field) {
        const val = row[excelCol]
        return val != null ? String(val).trim() : ''
      }
    }
    return ''
  }

  // Wrap ALL inserts in ONE transaction (fast: single disk write)
  const runImport = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i]
        const fullName = getValue(row, 'full_name')
        if (!fullName) {
          errors.push(`صف ${i + 2}: اسم الزبون فارغ`)
          failed++
          continue
        }

        const vals = [
          forcePlatform || getValue(row, 'platform_name'),
          fullName,
          getValue(row, 'mother_name'),
          getValue(row, 'phone_number'),
          getValue(row, 'card_number'),
          getValue(row, 'category'),
          getValue(row, 'ministry_name'),
          getValue(row, 'status_note'),
          getValue(row, 'reminder_date'),
          getValue(row, 'reminder_text'),
          parseInt(getValue(row, 'user_id')) || 0,
          parseInt(getValue(row, 'months_count')) || 0,
          getValue(row, 'notes'),
          ...customColNames.map(c => getValue(row, c))
        ]

        const res = stmtCustomer.run(...vals)

        const invNum = getValue(row, 'invoice_number')
        if (invNum) {
          stmtInvoice.run(
            res.lastInsertRowid,
            invNum,
            parseInt(getValue(row, 'total_months')) || 1,
            parseFloat(getValue(row, 'total_amount')) || 0,
            parseFloat(getValue(row, 'monthly_deduction')) || 0,
            getValue(row, 'creation_date') || new Date().toISOString().split('T')[0],
            getValue(row, 'status') || 'نشطة'
          )
        }

        success++
      } catch (err: any) {
        errors.push(`صف ${i + 2}: ${err.message}`)
        failed++
      }
    }
  })

  try {
    runImport()
  } catch (err: any) {
    console.error('[import] Transaction error:', err)
    errors.push(`خطأ في الحفظ: ${err.message}`)
  }

  console.log('[import] Done. Success:', success, 'Failed:', failed)
  return { success, failed, errors }
}

export function exportToExcel(filePath: string, data: any[], headers: { [key: string]: string }): void {
  const arabicData = data.map(row => {
    const newRow: any = {}
    for (const [eng, ar] of Object.entries(headers)) {
      newRow[ar] = row[eng] ?? ''
    }
    return newRow
  })

  const worksheet = XLSX.utils.json_to_sheet(arabicData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات')

  const colWidths = Object.values(headers).map(h => ({ wch: Math.max(h.length * 2, 15) }))
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, filePath)
}
