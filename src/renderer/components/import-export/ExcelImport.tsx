import React, { useState, useEffect } from 'react'
import { Steps, Button, Select, Table, Alert, message, Space, Result, Checkbox, Tag, Modal, Input } from 'antd'
import { UploadOutlined, FileExcelOutlined, PlusOutlined } from '@ant-design/icons'
import type { CustomColumn } from '../../types'
import { useAuth } from '../../App'

const BASE_DB_FIELDS = [
  { value: 'platform_name', label: 'اسم المنصة' }, { value: 'full_name', label: 'اسم الزبون الرباعي' },
  { value: 'mother_name', label: 'اسم الأم' }, { value: 'phone_number', label: 'رقم الهاتف' },
  { value: 'card_number', label: 'رقم البطاقة' }, { value: 'category', label: 'صنف الزبون' },
  { value: 'ministry_name', label: 'اسم الوزارة' }, { value: 'status_note', label: 'الحالة' },
  { value: 'months_count', label: 'عدد الأشهر' }, { value: 'notes', label: 'ملاحظات' },
  { value: 'invoice_number', label: 'رقم الفاتورة' },
  { value: 'total_months', label: 'أشهر الفاتورة' }, { value: 'total_amount', label: 'المبلغ الكلي' },
  { value: 'monthly_deduction', label: 'الاستقطاع الشهري' }, { value: 'creation_date', label: 'تاريخ الفاتورة' },
  { value: 'status', label: 'حالة الفاتورة' }
]

const AUTO_MAP: Record<string, string> = {
  'اسم منصة': 'platform_name', 'المنصة': 'platform_name', 'اسم المنصة': 'platform_name',
  'اسم زبون': 'full_name', 'اسم الزبون': 'full_name', 'الاسم': 'full_name', 'اسم زبون رباعي': 'full_name', 'الاسم الرباعي': 'full_name',
  'اسم ام': 'mother_name', 'اسم الام': 'mother_name', 'اسم ام زبون': 'mother_name', 'اسم الأم': 'mother_name',
  'هاتف': 'phone_number', 'رقم هاتف': 'phone_number', 'رقم الهاتف': 'phone_number', 'الهاتف': 'phone_number', 'موبايل': 'phone_number',
  'رقم فاتورة': 'invoice_number', 'رقم الفاتورة': 'invoice_number',
  'رقم بطاقة': 'card_number', 'رقم البطاقة': 'card_number', 'رقم بطاقة زبون': 'card_number', 'رقم بطاقة الزبون': 'card_number',
  'صنف': 'category', 'الصنف': 'category', 'صنف الزبون': 'category',
  'الوزارة': 'ministry_name', 'اسم الوزارة': 'ministry_name', 'وزارة': 'ministry_name',
  'عدد الاشهر': 'months_count', 'عدد الأشهر': 'months_count',
  'الحالة': 'status_note', 'حالة': 'status_note', 'ملاحظات': 'notes', 'ملاحظة': 'notes',
  'المبلغ الكلي': 'total_amount', 'استقطاع شهري': 'monthly_deduction', 'الاستقطاع الشهري': 'monthly_deduction',
  'القسط': 'monthly_deduction', 'القسط الشهري': 'monthly_deduction',
  'تاريخ الفاتورة': 'creation_date', 'حالة الفاتورة': 'status'
}

export default function ExcelImport() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [enabledColumns, setEnabledColumns] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [addColModal, setAddColModal] = useState<string | null>(null)
  const [newColName, setNewColName] = useState('')

  useEffect(() => {
    window.api.columns.list('customers').then(setCustomColumns).catch(() => {})
  }, [])

  const allFields = [
    ...BASE_DB_FIELDS,
    ...customColumns.map(col => ({ value: col.column_name, label: col.display_name }))
  ]

  const selectFile = async () => {
    try {
      setError(null)
      const path = await window.api.excel.selectFile()
      if (!path) return
      setFilePath(path)
      const hdrs = await window.api.excel.readHeaders(path)
      if (!hdrs || hdrs.length === 0) {
        setError('الملف فارغ أو لا يحتوي على عناوين أعمدة. تأكد أن الصف الأول يحتوي على أسماء الأعمدة.')
        return
      }
      setHeaders(hdrs)

      // Auto-map
      const autoMapping: Record<string, string> = {}
      const autoEnabled: Record<string, boolean> = {}
      for (const header of hdrs) {
        const normalized = header.trim()
        for (const [key, field] of Object.entries(AUTO_MAP)) {
          if (key === normalized || key.toLowerCase() === normalized.toLowerCase()) {
            autoMapping[header] = field
            autoEnabled[header] = true
            break
          }
        }
        // Enable all by default
        if (!autoEnabled[header]) autoEnabled[header] = true
      }
      setMapping(autoMapping)
      setEnabledColumns(autoEnabled)
      setStep(1)
    } catch (err: any) {
      setError(`خطأ في قراءة الملف: ${err.message}`)
    }
  }

  const toggleAll = (checked: boolean) => {
    const u: Record<string, boolean> = {}
    headers.forEach(h => u[h] = checked)
    setEnabledColumns(u)
  }

  const doImport = () => {
    if (!filePath || importing) return
    setImporting(true); setError(null)

    const activeMapping: Record<string, string> = {}
    for (const [header, field] of Object.entries(mapping)) {
      if (enabledColumns[header] && field) activeMapping[header] = field
    }

    // Set user platform if available
    if (user?.platform_name) {
      (activeMapping as any).__force_platform__ = user.platform_name
    }

    window.api.excel.importData(filePath, activeMapping)
      .then((res: any) => { setResult(res || { success: 0, failed: 0, errors: ['نتيجة فارغة'] }); setStep(2); setImporting(false) })
      .catch((err: any) => { setResult({ success: 0, failed: 0, errors: [`خطأ: ${String(err?.message || err)}`] }); setStep(2); setImporting(false) })
  }

  const reset = () => { setStep(0); setFilePath(null); setHeaders([]); setMapping({}); setEnabledColumns({}); setResult(null); setError(null) }

  // Add new custom column from Excel header
  const handleAddColumn = async () => {
    if (!addColModal || !newColName) return
    try {
      await window.api.columns.add({ display_name: newColName, column_type: 'text', table_name: 'customers' })
      // Refresh custom columns
      const cols = await window.api.columns.list('customers')
      setCustomColumns(cols)
      // Auto-map the Excel header to the new column
      const newCol = cols.find((c: any) => c.display_name === newColName)
      if (newCol) {
        setMapping(prev => ({ ...prev, [addColModal]: newCol.column_name }))
        setEnabledColumns(prev => ({ ...prev, [addColModal]: true }))
      }
      message.success(`تم إضافة العمود "${newColName}" للنظام`)
      setAddColModal(null); setNewColName('')
    } catch (err: any) {
      message.error('فشل إضافة العمود: ' + (err?.message || ''))
    }
  }

  const enabledCount = Object.values(enabledColumns).filter(Boolean).length
  const mappedCount = Object.entries(mapping).filter(([h, v]) => enabledColumns[h] && v).length

  return (
    <div className="hover-card">
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)', fontWeight: 700 }}>استيراد من Excel</h2>

      <Steps current={step}
        items={[{ title: 'اختيار الملف' }, { title: 'ربط الأعمدة' }, { title: 'النتيجة' }]}
        style={{ marginBottom: 32 }} />

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      {/* Step 0: Select file */}
      {step === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <FileExcelOutlined style={{ fontSize: 56, color: 'var(--success)', marginBottom: 16 }} />
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>اختر ملف Excel يحتوي على بيانات الزبائن</p>
          <Button type="primary" size="large" icon={<UploadOutlined />} onClick={selectFile}>
            اختيار ملف Excel
          </Button>
        </div>
      )}

      {/* Step 1: Map columns */}
      {step === 1 && (
        <div>
          <Alert type="info" showIcon style={{ marginBottom: 16 }}
            message={`${headers.length} عمود في الملف. حدد الأعمدة واربطها بحقول النظام. الأعمدة غير المربوطة لن تُستورد.`} />

          <div style={{
            marginBottom: 16, padding: 14, background: 'var(--success-bg)', borderRadius: 8,
            border: '1px solid var(--success-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
          }}>
            <Space>
              <Button type="primary" size="large" onClick={doImport} loading={importing}
                disabled={mappedCount === 0}>
                {importing ? 'جاري الاستيراد...' : `بدء الاستيراد (${mappedCount} عمود مربوط)`}
              </Button>
              <Button onClick={() => { setStep(0); setHeaders([]); setMapping({}) }} disabled={importing}>رجوع</Button>
            </Space>
            <Space>
              <Button size="small" onClick={() => toggleAll(true)}>تحديد الكل</Button>
              <Button size="small" onClick={() => toggleAll(false)}>إلغاء الكل</Button>
            </Space>
          </div>

          <Table
            dataSource={headers.map((h, i) => ({ key: i, header: h }))}
            pagination={false} size="small"
            columns={[
              {
                title: 'استيراد', key: 'enabled', width: 60, align: 'center' as const,
                render: (_: any, r: any) => <Checkbox checked={enabledColumns[r.header] || false}
                  onChange={e => setEnabledColumns(prev => ({ ...prev, [r.header]: e.target.checked }))} />
              },
              {
                title: 'عمود Excel', dataIndex: 'header', width: '30%',
                render: (v: string) => <span style={{ opacity: enabledColumns[v] ? 1 : 0.4, fontWeight: 500 }}>{v}</span>
              },
              {
                title: 'الحقل المقابل في النظام', key: 'mapping',
                render: (_: any, r: any) => (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Select value={mapping[r.header]} allowClear placeholder="-- اختر الحقل --"
                      style={{ flex: 1, opacity: enabledColumns[r.header] ? 1 : 0.4 }}
                      disabled={!enabledColumns[r.header]} options={allFields}
                      onChange={v => {
                        setMapping(prev => { const n = { ...prev }; if (v) n[r.header] = v; else delete n[r.header]; return n })
                        if (v) setEnabledColumns(prev => ({ ...prev, [r.header]: true }))
                      }}
                      showSearch optionFilterProp="label" />
                    {enabledColumns[r.header] && !mapping[r.header] && (
                      <Button size="small" type="dashed" icon={<PlusOutlined />}
                        onClick={() => { setAddColModal(r.header); setNewColName(r.header) }}
                        title="إضافة كعمود جديد في النظام">
                        إضافة عمود
                      </Button>
                    )}
                  </div>
                )
              },
              {
                title: 'الحالة', key: 'status', width: 80, align: 'center' as const,
                render: (_: any, r: any) => {
                  if (!enabledColumns[r.header]) return <Tag>متجاهل</Tag>
                  if (mapping[r.header]) return <Tag color="green">مربوط</Tag>
                  return <Tag color="orange">غير مربوط</Tag>
                }
              }
            ]}
          />

          <div style={{ marginTop: 16 }}>
            <Button type="primary" size="large" onClick={doImport} loading={importing}
              disabled={mappedCount === 0}>
              {importing ? 'جاري الاستيراد...' : `بدء الاستيراد (${mappedCount} عمود مربوط)`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Result */}
      {step === 2 && (
        <div>
          {result ? (
            <>
              <Result
                status={result.failed === 0 && result.success > 0 ? 'success' : result.success > 0 ? 'warning' : 'error'}
                title={result.success > 0 && result.failed === 0 ? 'تم الاستيراد بنجاح!'
                  : result.success > 0 ? 'تم الاستيراد مع بعض الأخطاء' : 'فشل الاستيراد'}
                subTitle={`تم استيراد ${result.success} سجل${result.failed > 0 ? ` | فشل ${result.failed}` : ''}`} />
              {result.errors.length > 0 && (
                <Alert message={`أخطاء (${result.errors.length})`}
                  description={<ul style={{ maxHeight: 200, overflow: 'auto', paddingRight: 20 }}>
                    {result.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>} type="warning" style={{ marginBottom: 16 }} />
              )}
            </>
          ) : <Result status="error" title="خطأ غير متوقع" />}
          <Button type="primary" onClick={reset}>استيراد ملف آخر</Button>
        </div>
      )}

      {/* Add Column Modal */}
      <Modal title="إضافة عمود جديد للنظام" open={!!addColModal}
        onOk={handleAddColumn} onCancel={() => { setAddColModal(null); setNewColName('') }}
        okText="إضافة" cancelText="إلغاء" okButtonProps={{ disabled: !newColName.trim() }}>
        <p style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          عمود Excel: <Tag color="blue">{addColModal}</Tag>
        </p>
        <p style={{ marginBottom: 8 }}>اسم العمود في النظام:</p>
        <Input value={newColName} onChange={e => setNewColName(e.target.value)}
          placeholder="مثال: العنوان، رقم الجواز..." />
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          سيتم إنشاء عمود نصي جديد في جدول الزبائن وربطه تلقائياً بعمود Excel.
        </p>
      </Modal>
    </div>
  )
}
