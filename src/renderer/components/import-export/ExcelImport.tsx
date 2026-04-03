import React, { useState, useEffect } from 'react'
import { Card, Steps, Button, Select, Table, Alert, message, Space, Result, Checkbox, Tag } from 'antd'
import { UploadOutlined, FileExcelOutlined } from '@ant-design/icons'
import type { CustomColumn } from '../../types'
import { useAuth } from '../../App'

const BASE_DB_FIELDS = [
  { value: 'platform_name', label: 'اسم المنصة' },
  { value: 'full_name', label: 'اسم الزبون الرباعي' },
  { value: 'mother_name', label: 'اسم الأم' },
  { value: 'phone_number', label: 'رقم الهاتف' },
  { value: 'card_number', label: 'رقم البطاقة' },
  { value: 'category', label: 'صنف الزبون' },
  { value: 'ministry_name', label: 'اسم الوزارة' },
  { value: 'invoice_number', label: 'رقم الفاتورة' },
  { value: 'total_months', label: 'عدد الأشهر' },
  { value: 'total_amount', label: 'المبلغ الكلي' },
  { value: 'monthly_deduction', label: 'الاستقطاع الشهري' },
  { value: 'creation_date', label: 'تاريخ الفاتورة' },
  { value: 'status', label: 'حالة الفاتورة' }
]

const AUTO_MAP: Record<string, string> = {
  'اسم منصة': 'platform_name', 'المنصة': 'platform_name', 'اسم المنصة': 'platform_name',
  'اسم زبون': 'full_name', 'اسم الزبون': 'full_name', 'الاسم': 'full_name', 'اسم زبون رباعي': 'full_name',
  'اسم ام': 'mother_name', 'اسم الام': 'mother_name', 'اسم ام زبون': 'mother_name', 'اسم الأم': 'mother_name',
  'هاتف': 'phone_number', 'رقم هاتف': 'phone_number', 'رقم الهاتف': 'phone_number', 'الهاتف': 'phone_number',
  'رقم هاتف الزبون': 'phone_number', 'موبايل': 'phone_number',
  'رقم فاتورة': 'invoice_number', 'رقم الفاتورة': 'invoice_number',
  'رقم بطاقة': 'card_number', 'رقم البطاقة': 'card_number', 'رقم بطاقة زبون': 'card_number',
  'رقم بطاقة الزبون': 'card_number',
  'صنف': 'category', 'الصنف': 'category', 'صنف الزبون': 'category',
  'الوزارة': 'ministry_name', 'اسم الوزارة': 'ministry_name', 'وزارة': 'ministry_name',
  'عدد الاشهر': 'total_months', 'عدد الأشهر': 'total_months',
  'المبلغ الكلي': 'total_amount',
  'استقطاع شهري': 'monthly_deduction', 'الاستقطاع الشهري': 'monthly_deduction',
  'القسط': 'monthly_deduction', 'القسط الشهري': 'monthly_deduction',
  'تاريخ الفاتورة': 'creation_date', 'تاريخ انشاء الفاتورة': 'creation_date',
  'تاريخ إنشاء الفاتورة': 'creation_date',
  'حالة': 'status', 'الحالة': 'status', 'حالة الفاتورة': 'status'
}

export default function ExcelImport() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [step, setStep] = useState(0)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [enabledColumns, setEnabledColumns] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string>(user?.platform_name || '')
  const [adminPlatforms, setAdminPlatforms] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    window.api.columns.list('customers').then(setCustomColumns).catch(() => {})
    if (isAdmin) {
      window.api.platforms.list().then(setAdminPlatforms).catch(() => {})
    }
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
        setError('الملف فارغ أو لا يحتوي على عناوين أعمدة')
        return
      }
      setHeaders(hdrs)

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
        // If no auto-map, default to unchecked
        if (!autoEnabled[header]) {
          autoEnabled[header] = false
        }
      }
      setMapping(autoMapping)
      setEnabledColumns(autoEnabled)
      setStep(1)
    } catch (err: any) {
      setError(`خطأ في قراءة الملف: ${err.message}`)
    }
  }

  const toggleAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {}
    headers.forEach(h => updated[h] = checked)
    setEnabledColumns(updated)
  }

  const doImport = () => {
    if (!filePath || importing) return
    if (isAdmin && !selectedPlatform) {
      setError('يرجى اختيار المنصة قبل الاستيراد')
      return
    }
    setImporting(true)
    setError(null)

    // Only send enabled columns in the mapping
    const activeMapping: Record<string, string> = {}
    for (const [header, field] of Object.entries(mapping)) {
      if (enabledColumns[header] && field) {
        activeMapping[header] = field
      }
    }

    // Pass platform override
    const importPlatform = selectedPlatform || user?.platform_name || ''
    ;(activeMapping as any).__force_platform__ = importPlatform

    window.api.excel.importData(filePath, activeMapping)
      .then((res: any) => {
        setResult(res || { success: 0, failed: 0, errors: ['نتيجة فارغة'] })
        setStep(2)
        setImporting(false)
      })
      .catch((err: any) => {
        setResult({ success: 0, failed: 0, errors: [`خطأ: ${String(err?.message || err)}`] })
        setStep(2)
        setImporting(false)
      })
  }

  const reset = () => {
    setStep(0); setFilePath(null); setHeaders([]); setMapping({})
    setEnabledColumns({}); setResult(null); setError(null)
  }

  const enabledCount = Object.values(enabledColumns).filter(Boolean).length

  return (
    <Card>
      <h2 style={{ marginBottom: 24 }}>استيراد من Excel</h2>

      <Steps current={step}
        items={[{ title: 'اختيار الملف' }, { title: 'ربط الأعمدة' }, { title: 'النتيجة' }]}
        style={{ marginBottom: 32 }} />

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      {step === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <FileExcelOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: '#666', marginBottom: 16 }}>اختر ملف Excel يحتوي على بيانات الزبائن</p>

          {isAdmin && (
            <div style={{ marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
              <p style={{ fontSize: 14, color: '#333', marginBottom: 8 }}>اختر المنصة التي سيتم الاستيراد إليها:</p>
              <Select value={selectedPlatform || undefined} onChange={setSelectedPlatform}
                placeholder="اختر المنصة" style={{ width: '100%' }}>
                {adminPlatforms.map(p => (
                  <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
                ))}
              </Select>
            </div>
          )}
          {!isAdmin && user?.platform_name && (
            <p style={{ fontSize: 14, color: '#1677ff', marginBottom: 16 }}>المنصة: <Tag color="blue">{user.platform_name}</Tag></p>
          )}

          <Button type="primary" size="large" icon={<UploadOutlined />} onClick={selectFile}
            disabled={isAdmin && !selectedPlatform}>
            اختيار ملف Excel
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <Alert message={`${headers.length} عمود في الملف. ضع علامة (صح) على الأعمدة التي تريد استيرادها.`}
            type="info" showIcon style={{ marginBottom: 16 }} />

          <div style={{ marginBottom: 16, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Space>
              <Button type="primary" size="large" onClick={doImport} loading={importing}>
                {importing ? 'جاري الاستيراد...' : `بدء الاستيراد (${enabledCount} عمود)`}
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
            pagination={false}
            size="small"
            columns={[
              {
                title: 'استيراد',
                key: 'enabled',
                width: 70,
                align: 'center' as const,
                render: (_: any, record: any) => (
                  <Checkbox
                    checked={enabledColumns[record.header] || false}
                    onChange={(e) => setEnabledColumns(prev => ({ ...prev, [record.header]: e.target.checked }))}
                  />
                )
              },
              {
                title: 'عمود Excel',
                dataIndex: 'header',
                key: 'header',
                width: '35%',
                render: (v: string) => (
                  <span style={{ opacity: enabledColumns[v] ? 1 : 0.4 }}>{v}</span>
                )
              },
              {
                title: 'الحقل المقابل',
                key: 'mapping',
                render: (_: any, record: any) => (
                  <Select
                    value={mapping[record.header]}
                    onChange={(v) => {
                      setMapping(prev => {
                        const next = { ...prev }
                        if (v) next[record.header] = v
                        else delete next[record.header]
                        return next
                      })
                      if (v) setEnabledColumns(prev => ({ ...prev, [record.header]: true }))
                    }}
                    allowClear
                    placeholder="-- تجاهل --"
                    style={{ width: '100%', opacity: enabledColumns[record.header] ? 1 : 0.4 }}
                    options={allFields}
                    disabled={!enabledColumns[record.header]}
                  />
                )
              }
            ]}
          />

          <div style={{ marginTop: 16 }}>
            <Button type="primary" size="large" onClick={doImport} loading={importing}>
              {importing ? 'جاري الاستيراد...' : `بدء الاستيراد (${enabledCount} عمود)`}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          {result ? (
            <>
              <Result
                status={result.failed === 0 && result.success > 0 ? 'success' : result.success > 0 ? 'warning' : 'error'}
                title={result.success > 0 && result.failed === 0 ? 'تم الاستيراد بنجاح!'
                  : result.success > 0 ? 'تم الاستيراد مع بعض الأخطاء' : 'فشل الاستيراد'}
                subTitle={`تم استيراد ${result.success} سجل${result.failed > 0 ? ` | فشل ${result.failed}` : ''}`}
              />
              {result.errors.length > 0 && (
                <Alert message={`أخطاء (${result.errors.length})`}
                  description={<ul style={{ maxHeight: 200, overflow: 'auto', paddingRight: 20 }}>
                    {result.errors.slice(0, 30).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>} type="warning" style={{ marginBottom: 16 }} />
              )}
            </>
          ) : (
            <Result status="error" title="خطأ غير متوقع" />
          )}
          <Button type="primary" onClick={reset}>استيراد ملف آخر</Button>
        </div>
      )}
    </Card>
  )
}
