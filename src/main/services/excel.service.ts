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

// Parse date formats: "05/27/2025 11:03:52 AM" or "2025-05-27" -> "YYYY-MM-DD"
export function parseDate(dateStr: string): string {
  if (!dateStr) return ''
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0].split(' ')[0]
  // MM/DD/YYYY format (with optional time)
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`
  // DD-MM-YYYY format
  const m2 = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/)
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
  return dateStr
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
  // Extract special keys
  const forcePlatform = (mapping as any).__force_platform__ || ''
  const hasHeaderRow = (mapping as any).__has_header_row__ !== false
  const forceUserId = (mapping as any).__user_id__ || 0
  delete (mapping as any).__force_platform__
  delete (mapping as any).__has_header_row__
  delete (mapping as any).__user_id__

  // Import started

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

  // Processing rows
  const db = getDatabase()

  let success = 0
  let failed = 0
  const errors: string[] = []

  // Custom columns
  let customColNames: string[] = []
  try {
    customColNames = listCustomColumns('customers').map(c => c.column_name)
  } catch (err) { console.error('[excel:import] Failed to load custom columns:', err) }

  // Build SQL once
  const baseFields = ['platform_name', 'full_name', 'mother_name', 'phone_number', 'card_number', 'category', 'ministry_name', 'status_note', 'reminder_date', 'reminder_text', 'user_id', 'months_count', 'notes']
  const allFields = [...baseFields, ...customColNames]
  const placeholders = allFields.map(() => '?').join(', ')
  const insertCustomerSQL = `INSERT INTO customers (${allFields.join(', ')}) VALUES (${placeholders})`
  const insertInvoiceSQL = `INSERT INTO invoices (customer_id, invoice_number, total_months, total_amount, monthly_deduction, creation_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)`

  // Prepare once, reuse for all rows
  const stmtCustomer = db.prepare(insertCustomerSQL)
  const stmtInvoice = db.prepare(insertInvoiceSQL)
  const checkDup = db.prepare('SELECT id FROM customers WHERE full_name = ? AND mother_name = ? AND phone_number = ?')

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

  // Check which invoice fields are mapped
  const invoiceFields = ['total_amount', 'monthly_deduction', 'creation_date', 'status', 'remaining_amount', 'paid_amount']
  const hasInvoiceData = invoiceFields.some(f => {
    for (const dbField of Object.values(mapping)) { if (dbField === f) return true }
    return false
  })

  let skipped = 0
  let invoicesCreated = 0

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

        const motherName = getValue(row, 'mother_name')
        const phone = getValue(row, 'phone_number')

        // Skip duplicate
        const existing = checkDup.get(fullName, motherName, phone)
        if (existing) { skipped++; continue }

        const monthsCount = parseInt(getValue(row, 'months_count')) || 0

        const vals = [
          forcePlatform || getValue(row, 'platform_name'),
          fullName,
          motherName,
          phone,
          getValue(row, 'card_number'),
          getValue(row, 'category'),
          getValue(row, 'ministry_name'),
          getValue(row, 'status_note'),
          parseDate(getValue(row, 'reminder_date')),
          getValue(row, 'reminder_text'),
          forceUserId || parseInt(getValue(row, 'user_id')) || 0,
          monthsCount,
          getValue(row, 'notes'),
          ...customColNames.map(c => getValue(row, c))
        ]

        const res = stmtCustomer.run(...vals)
        success++

        // Auto-create invoice if invoice data exists
        const invNum = getValue(row, 'invoice_number')
        const totalAmount = parseFloat(getValue(row, 'total_amount')) || 0
        const monthlyDeduction = parseFloat(getValue(row, 'monthly_deduction')) || 0
        const creationDate = parseDate(getValue(row, 'creation_date'))
        const invStatus = getValue(row, 'status')

        if (hasInvoiceData && (invNum || totalAmount > 0)) {
          const finalInvNum = invNum || `IMP-${Date.now()}-${i}`
          const finalMonths = monthsCount || (monthlyDeduction > 0 ? Math.ceil(totalAmount / monthlyDeduction) : 1)
          const finalDate = creationDate || new Date().toISOString().split('T')[0]
          const finalStatus = invStatus || 'نشطة'

          stmtInvoice.run(
            res.lastInsertRowid,
            finalInvNum,
            finalMonths,
            totalAmount,
            monthlyDeduction,
            finalDate,
            finalStatus
          )
          invoicesCreated++
        }
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

  if (skipped > 0) errors.unshift(`تم تخطي ${skipped} اسم مكرر`)
  if (invoicesCreated > 0) errors.unshift(`تم إنشاء ${invoicesCreated} فاتورة تلقائياً`)

  // Import complete
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
