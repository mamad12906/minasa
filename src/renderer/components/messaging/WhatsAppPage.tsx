import React, { useEffect, useState, useMemo } from 'react'
import { Table, Button, Input, Checkbox, Row, Col, Tag, Select, message, Modal, Divider, Progress } from 'antd'
import { WhatsAppOutlined, SendOutlined, SearchOutlined, MessageOutlined, CheckCircleOutlined, CloseCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuth } from '../../App'
import dayjs from 'dayjs'
import WASettings, { getWAConfig, setWAConfig as persistWAConfig, hydrateWAConfigFromPersistent } from './WASettings'
import WATemplates, { loadTemplates, type WATemplate } from './WATemplates'

const { TextArea } = Input

// Re-export for any external callers that used the old symbol
export function setWAConfig(phoneId: string, token: string) { persistWAConfig(phoneId, token) }

// Load persistent config into localStorage on module init
hydrateWAConfigFromPersistent()

const FIELDS = [
  { key: 'full_name', label: 'اسم الزبون' },
  { key: 'mother_name', label: 'اسم الأم' },
  { key: 'phone_number', label: 'رقم الهاتف' },
  { key: 'card_number', label: 'رقم البطاقة' },
  { key: 'platform_name', label: 'المنصة' },
  { key: 'ministry_name', label: 'الوزارة' },
  { key: 'category', label: 'الصنف' },
  { key: 'status_note', label: 'الحالة' },
  { key: 'months_count', label: 'عدد الأشهر' },
  { key: 'notes', label: 'ملاحظات' },
  { key: 'created_at', label: 'تاريخ الإنشاء' },
  { key: 'end_date', label: 'تاريخ الانتهاء' },
]

// Send via WhatsApp Business API
async function sendWhatsAppAPI(phone: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const { phoneId, token } = getWAConfig()
  if (!phoneId || !token) return { ok: false, error: 'إعدادات واتساب غير مكتملة - اذهب لإعدادات واتساب' }
  const formatted = phone.replace(/\D/g, '').replace(/^07/, '9647').replace(/^7(\d{9})$/, '964$1')
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formatted,
        type: 'text',
        text: { body: text }
      })
    })
    const data = await res.json()
    if (data.messages?.[0]?.id) return { ok: true }
    return { ok: false, error: data.error?.message || 'فشل الإرسال' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export default function WhatsAppPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [customers, setCustomers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | undefined>()
  const [filterUserId, setFilterUserId] = useState<number | undefined>()
  const [categories, setCategories] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [extraText, setExtraText] = useState('')
  const [includedFields, setIncludedFields] = useState<Set<string>>(new Set(['full_name']))
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [sendLog, setSendLog] = useState<{ name: string; phone: string; status: string }[]>([])
  const [logModal, setLogModal] = useState(false)
  const [templates, setTemplates] = useState<WATemplate[]>(() => loadTemplates())
  const [previewCustomer, setPreviewCustomer] = useState<any>(null)
  const [showWASettings, setShowWASettings] = useState(false)
  const [waPhoneId, setWaPhoneId] = useState(() => getWAConfig().phoneId)
  const [waToken, setWaToken] = useState(() => getWAConfig().token)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await window.api.customer.list({ page: 1, pageSize: 50000, userId: isAdmin ? undefined : user?.id })
      setCustomers(res?.data || [])
      setCategories(await window.api.customer.categories() || [])
      if (isAdmin) setAllUsers(await window.api.users.list() || [])
    } catch (err) { console.error('[WhatsAppPage] Failed to load customers:', err) } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let list = customers
    if (search) { const s = search.toLowerCase(); list = list.filter(c => c.full_name?.toLowerCase().includes(s) || c.phone_number?.includes(s)) }
    if (filterCategory) list = list.filter(c => c.category === filterCategory)
    if (filterUserId) list = list.filter(c => c.user_id === filterUserId)
    return list
  }, [customers, search, filterCategory, filterUserId])

  const withPhone = useMemo(() => filtered.filter(c => c.phone_number?.trim().length >= 7), [filtered])

  const toggleSelect = (id: number) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const selectAll = () => setSelectedIds(selectedIds.size === withPhone.length ? new Set() : new Set(withPhone.map(c => c.id)))
  const toggleField = (key: string) => setIncludedFields(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n })

  const buildMessage = (customer: any): string => {
    const parts: string[] = []
    for (const f of FIELDS) {
      if (!includedFields.has(f.key)) continue
      let value = ''
      if (f.key === 'end_date') {
        if (customer.months_count && customer.created_at) value = dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD')
      } else { value = customer[f.key] }
      if (value && String(value).trim()) parts.push(`${f.label}: ${value}`)
    }
    let msg = parts.length > 0 ? parts.join('\n') : ''
    if (extraText.trim()) { if (msg) msg += '\n\n'; msg += extraText }
    return msg
  }

  const previewMsg = useMemo(() => {
    const first = previewCustomer || customers.find(c => selectedIds.has(c.id)) || withPhone[0]
    if (!first) return '(اختر زبون لمعاينة الرسالة)'
    return buildMessage(first)
  }, [includedFields, extraText, selectedIds, previewCustomer, customers, withPhone])

  const sendAll = async () => {
    const selected = customers.filter(c => selectedIds.has(c.id) && c.phone_number?.trim().length >= 7)
    if (selected.length === 0) { message.warning('اختر زبائن أولاً'); return }
    const testMsg = buildMessage(selected[0])
    if (!testMsg.trim()) { message.warning('الرسالة فارغة'); return }

    setSending(true)
    setSendProgress({ current: 0, total: selected.length, success: 0, failed: 0 })
    const log: { name: string; phone: string; status: string }[] = []

    for (let i = 0; i < selected.length; i++) {
      const c = selected[i]
      const msg = buildMessage(c)
      const result = await sendWhatsAppAPI(c.phone_number, msg)
      log.push({ name: c.full_name, phone: c.phone_number, status: result.ok ? 'تم' : result.error || 'فشل' })
      setSendProgress(prev => ({
        current: i + 1, total: selected.length,
        success: prev.success + (result.ok ? 1 : 0),
        failed: prev.failed + (result.ok ? 0 : 1)
      }))
      if (i < selected.length - 1) await new Promise(r => setTimeout(r, 200))
    }

    setSendLog(log); setLogModal(true); setSending(false)
    const successCount = log.filter(l => l.status === 'تم').length
    message.success(`تم إرسال ${successCount} من ${selected.length} رسالة`)
  }

  const userMap: Record<number, string> = {}
  allUsers.forEach(u => { userMap[u.id] = u.display_name })

  const progressPercent = sendProgress.total > 0 ? Math.round((sendProgress.current / sendProgress.total) * 100) : 0

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><WhatsAppOutlined style={{ marginLeft: 8, color: '#25D366' }} />إرسال رسائل واتساب</h2>
          <p>اختر الزبائن وحدد المعلومات - يُرسل تلقائياً عبر WhatsApp API</p>
        </div>
        <Button icon={<SettingOutlined />} onClick={() => setShowWASettings(true)}
          style={{ borderRadius: 8 }}>إعدادات API</Button>
      </div>

      {(!getWAConfig().phoneId || !getWAConfig().token) && (
        <div style={{ padding: 12, borderRadius: 10, marginBottom: 16, background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', textAlign: 'center' }}>
          <span style={{ color: 'var(--warning)' }}>إعدادات واتساب غير مكتملة. </span>
          <Button type="link" onClick={() => setShowWASettings(true)} style={{ padding: 0 }}>اضغط هنا لإعداد API</Button>
        </div>
      )}

      {sending && (
        <div style={{ padding: 16, borderRadius: 12, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>جاري الإرسال...</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {sendProgress.current} / {sendProgress.total}
              <span style={{ color: 'var(--success)', marginRight: 12 }}> ✓ {sendProgress.success}</span>
              {sendProgress.failed > 0 && <span style={{ color: 'var(--error)' }}> ✗ {sendProgress.failed}</span>}
            </span>
          </div>
          <Progress percent={progressPercent} strokeColor="#25D366" status="active" />
        </div>
      )}

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <div className="hover-card">
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={10}>
                <Input placeholder="بحث بالاسم أو الرقم..." prefix={<SearchOutlined />}
                  value={search} onChange={e => setSearch(e.target.value)} allowClear />
              </Col>
              <Col xs={12} sm={7}>
                <Select placeholder="الصنف" value={filterCategory} onChange={v => setFilterCategory(v)}
                  allowClear style={{ width: '100%' }} options={categories.map(c => ({ value: c, label: c }))} />
              </Col>
              {isAdmin && (
                <Col xs={12} sm={7}>
                  <Select placeholder="الموظف" value={filterUserId} onChange={v => setFilterUserId(v)}
                    allowClear style={{ width: '100%' }}
                    options={allUsers.map(u => ({ value: u.id, label: u.display_name }))} />
                </Col>
              )}
            </Row>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Checkbox checked={withPhone.length > 0 && selectedIds.size === withPhone.length}
                indeterminate={selectedIds.size > 0 && selectedIds.size < withPhone.length}
                onChange={selectAll}>تحديد الكل</Checkbox>
              <Tag color="blue">{filtered.length} زبون</Tag>
              <Tag color="green">{withPhone.length} لديهم رقم</Tag>
              {selectedIds.size > 0 && <Tag color="orange">{selectedIds.size} محدد</Tag>}
            </div>

            <Table dataSource={withPhone} rowKey="id" size="small" loading={loading}
              pagination={{ pageSize: 15, showSizeChanger: false }}
              scroll={{ y: 400 }}
              onRow={(record) => ({ onClick: () => setPreviewCustomer(record), style: { cursor: 'pointer' } })}
              columns={[
                { title: '', key: 'sel', width: 40, align: 'center' as const,
                  render: (_: any, r: any) => <Checkbox checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /> },
                { title: 'الاسم', dataIndex: 'full_name', ellipsis: true, render: (v: string) => <strong>{v}</strong> },
                { title: 'الهاتف', dataIndex: 'phone_number', width: 120 },
                { title: 'الصنف', dataIndex: 'category', width: 80, render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
                ...(isAdmin ? [{ title: 'الموظف', dataIndex: 'user_id', width: 90,
                  render: (v: number) => userMap[v] ? <Tag color="cyan">{userMap[v]}</Tag> : '-' }] : []),
              ]}
            />
          </div>
        </Col>

        <Col xs={24} lg={10}>
          <div className="hover-card" style={{ position: 'sticky', top: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontWeight: 600 }}>
              <MessageOutlined style={{ marginLeft: 8 }} />بناء الرسالة
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>معلومات الزبون:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {FIELDS.map(f => (
                  <Checkbox key={f.key} checked={includedFields.has(f.key)} onChange={() => toggleField(f.key)}
                    style={{ fontSize: 12, marginInlineStart: 0, minWidth: 120 }}>{f.label}</Checkbox>
                ))}
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>نص إضافي:</div>
              <TextArea value={extraText} onChange={e => setExtraText(e.target.value)}
                placeholder="اكتب رسالتك الإضافية هنا..." rows={3} style={{ borderRadius: 10, fontSize: 13 }} />
            </div>

            <WATemplates
              templates={templates}
              includedFields={includedFields}
              extraText={extraText}
              onChange={setTemplates}
              onApply={(t) => { setIncludedFields(new Set(t.fields)); setExtraText(t.text) }}
            />

            <Divider style={{ margin: '12px 0' }} />

            <div style={{
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: '#DCF8C6', border: '1px solid #b5e1a0',
              minHeight: 60, whiteSpace: 'pre-wrap',
              fontSize: 13, color: '#1A2332', position: 'relative'
            }}>
              <div style={{ fontSize: 10, color: '#6B8E5E', marginBottom: 6 }}>معاينة:</div>
              {previewMsg || '(اختر حقول أو اكتب نص)'}
              <div style={{ position: 'absolute', bottom: 4, left: 8, fontSize: 10, color: '#6B8E5E' }}>
                <WhatsAppOutlined /> WhatsApp API
              </div>
            </div>

            <Button type="primary" block size="large" loading={sending} icon={<SendOutlined />}
              onClick={sendAll}
              disabled={sending || selectedIds.size === 0 || (includedFields.size === 0 && !extraText.trim())}
              style={{ borderRadius: 12, height: 50, fontSize: 16, fontWeight: 700, background: '#25D366', borderColor: '#25D366' }}>
              <WhatsAppOutlined /> إرسال تلقائي لـ {selectedIds.size} زبون
            </Button>

            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              يُرسل مباشرة عبر WhatsApp API - بدون فتح المتصفح
            </div>
          </div>
        </Col>
      </Row>

      <WASettings
        open={showWASettings}
        phoneId={waPhoneId}
        token={waToken}
        onPhoneIdChange={setWaPhoneId}
        onTokenChange={setWaToken}
        onCancel={() => setShowWASettings(false)}
        onSaved={() => setShowWASettings(false)}
      />

      <Modal title={<span><WhatsAppOutlined style={{ color: '#25D366' }} /> سجل الإرسال</span>}
        open={logModal} onCancel={() => setLogModal(false)} width={550}
        footer={<Button onClick={() => setLogModal(false)}>إغلاق</Button>}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
          <Tag color="green" style={{ fontSize: 14 }}><CheckCircleOutlined /> نجح: {sendLog.filter(l => l.status === 'تم').length}</Tag>
          <Tag color="red" style={{ fontSize: 14 }}><CloseCircleOutlined /> فشل: {sendLog.filter(l => l.status !== 'تم').length}</Tag>
        </div>
        <Table dataSource={sendLog} rowKey={(r, i) => `${r.phone}-${i}`} size="small" pagination={{ pageSize: 20 }}
          columns={[
            { title: 'الاسم', dataIndex: 'name', ellipsis: true },
            { title: 'الرقم', dataIndex: 'phone', width: 120 },
            { title: 'الحالة', dataIndex: 'status', width: 100, render: (v: string) => <Tag color={v === 'تم' ? 'green' : 'red'}>{v}</Tag> }
          ]}
        />
      </Modal>
    </div>
  )
}
