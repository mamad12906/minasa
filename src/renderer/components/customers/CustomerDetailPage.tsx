import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spin, Modal, Form, Input, Select, DatePicker, Checkbox, message, Popconfirm } from 'antd'
import dayjs from 'dayjs'
import type { Customer, CustomColumn } from '../../types'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'
import RemindersList from './detail/RemindersList'
import InvoicesCard from './detail/InvoicesCard'
import HistoryCard from './detail/HistoryCard'
import { printCustomerCard } from './detail/printCustomerCard'

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || '?'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

function statusTone(s?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!s) return 'neutral'
  if (s.includes('نشط') || s.includes('مكتمل') || s.includes('تم')) return 'success'
  if (s.includes('انتظار') || s.includes('قيد') || s.includes('معلّق') || s.includes('معلق')) return 'warning'
  if (s.includes('منتهي') || s.includes('متأخر') || s.includes('ملغي') || s.includes('رفض')) return 'danger'
  return 'neutral'
}

export default function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const canDelete = isAdmin || user?.permissions?.delete_customer === true
  const canEdit = isAdmin || user?.permissions?.edit_customer === true

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [reminders, setReminders] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [remindersLoading, setRemindersLoading] = useState(false)
  const [handleModal, setHandleModal] = useState<any>(null)
  const [form] = Form.useForm()
  const wantsReremind = Form.useWatch('wants_reremind', form)
  const [transferModal, setTransferModal] = useState(false)
  const [transferPlatform, setTransferPlatform] = useState('')
  const [platforms, setPlatforms] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    loadCustomer()
    window.api.columns.list('customers').then(setCustomColumns).catch(() => {})
    if (isAdmin) {
      window.api.platforms.list().then(setPlatforms).catch(() => {})
      window.api.users.list().then(setAllUsers).catch(() => {})
    }
  }, [id])

  const loadCustomer = async () => {
    setLoading(true)
    try {
      const c = await window.api.customer.get(Number(id))
      if (!c) { navigate('/customers'); return }
      setCustomer(c)
      loadReminders(c.id)
      loadHistory(c.id)
      loadInvoices(c.id)
    } catch (err) {
      console.error('[CustomerDetailPage] Failed to load customer:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async (cid: number) => {
    try {
      const ipc2 = (window as any).__ipc2
      const res = await ipc2?.invoiceList?.({ page: 1, pageSize: 100, customer_id: cid })
      setInvoices(res?.data || [])
    } catch (err) {
      console.error('[CustomerDetailPage] Failed to load invoices:', err)
      setInvoices([])
    }
  }

  const loadReminders = async (cid: number) => {
    setRemindersLoading(true)
    try { setReminders(await window.api.customer.reminders(cid)) }
    catch { }
    finally { setRemindersLoading(false) }
  }

  const loadHistory = async (cid: number) => {
    try {
      const h = await (window as any).__localApi?.customer?.history(cid)
      setHistory(h || [])
    } catch { setHistory([]) }
  }

  const printCard = () => {
    if (customer) printCustomerCard(customer)
  }

  const handleDelete = async () => {
    if (!customer) return
    await window.api.customer.delete(customer.id)
    message.success('تم حذف الزبون')
    navigate('/customers')
  }

  const openHandleModal = (r: any) => { setHandleModal(r); form.resetFields() }

  const confirmHandle = async () => {
    const vals = await form.validateFields()
    await window.api.reminders.done(handleModal.id, vals.handled_by, vals.handle_method)
    if (vals.wants_reremind && vals.new_date && vals.reremind_reason) {
      await window.api.reminders.reremind(handleModal.id, vals.new_date.format('YYYY-MM-DD'), vals.reremind_reason)
    }
    message.success('تم تسجيل التعامل مع التذكير')
    setHandleModal(null)
    if (customer) loadReminders(customer.id)
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleTransfer = async () => {
    if (!customer || !transferPlatform) return
    await window.api.transfer.customers([customer.id], transferPlatform)
    message.success(`تم نقل ${customer.full_name} إلى منصة "${transferPlatform}"`)
    setTransferModal(false); setTransferPlatform('')
    loadCustomer()
  }

  if (loading || !customer) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  const today = new Date().toISOString().split('T')[0]
  const baseDate = dayjs(customer.created_at)
  const endDate = customer.months_count && customer.created_at
    ? baseDate.add(customer.months_count, 'month')
    : null
  const nextReminder = reminders.find((r: any) => r.is_done === 0)
  const sTone = statusTone(customer.status_note)
  const userMap: Record<number, string> = {}
  allUsers.forEach((u: any) => { userMap[u.id] = u.display_name })
  const ownerName = userMap[customer.user_id] || (customer.user_id === user?.id ? user.display_name : '-')

  // Primary fields for the main info grid
  const mainFields: Array<{ label: string; value: any; numeric?: boolean }> = [
    { label: 'الهاتف', value: customer.phone_number || '-', numeric: true },
    { label: 'رقم البطاقة', value: customer.card_number || '-', numeric: true },
    { label: 'اسم الأم', value: customer.mother_name || '-' },
    { label: 'الوزارة', value: customer.ministry_name || '-' },
    { label: 'المنصة', value: customer.platform_name || '-' },
    { label: 'تاريخ الإضافة', value: customer.created_at?.split('T')[0] || '-', numeric: true },
    { label: 'تاريخ الانتهاء', value: endDate ? endDate.format('YYYY-MM-DD') : '-', numeric: true },
    { label: 'المدة', value: customer.months_count ? `${customer.months_count} شهر` : '-', numeric: true },
    { label: 'الموظف المسؤول', value: ownerName },
  ]

  return (
    <div>
      {/* ===== Top action bar ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/customers')}>
          <Icon name="arrow_right" size={14} /> عودة لقائمة الزبائن
        </button>
        <div style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={printCard}>
          <Icon name="printer" size={12} /> طباعة
        </button>
        {isAdmin && (
          <button className="btn btn--ghost btn--sm" onClick={() => setTransferModal(true)}>
            <Icon name="swap" size={12} /> نقل
          </button>
        )}
        {canDelete && (
          <Popconfirm
            title="هل أنت متأكد من حذف الزبون؟"
            onConfirm={handleDelete}
            okText="نعم، احذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <button className="btn btn--danger btn--sm">
              <Icon name="trash" size={12} /> حذف
            </button>
          </Popconfirm>
        )}
        <button className="btn btn--primary btn--sm" onClick={() => navigate(`/edit-customer/${customer.id}`)}>
          <Icon name="edit" size={12} /> تعديل
        </button>
      </div>

      {/* ===== Hero header ===== */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 18 }}>
        <div className="avatar avatar-ring" style={{ width: 72, height: 72, fontSize: 28, flexShrink: 0 }}>
          {initials(customer.full_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 26, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>
            {customer.full_name}
          </h1>
          <div className="num muted" style={{ fontSize: 13, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {customer.mother_name && <span>والدة: {customer.mother_name}</span>}
            {customer.mother_name && customer.card_number && <span style={{ opacity: 0.5 }}>·</span>}
            {customer.card_number && <span>بطاقة: {customer.card_number}</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {customer.status_note && (
              <span className={`chip chip--${sTone}`}>
                <span className="dot" style={{ background: 'currentColor' }} />
                {customer.status_note}
              </span>
            )}
            {customer.category && <span className="chip chip--brand">{customer.category}</span>}
            {customer.months_count && (
              <span className="chip chip--accent">
                <span className="num">{customer.months_count}</span> شهر
              </span>
            )}
            {customer.platform_name && <span className="chip chip--neutral">{customer.platform_name}</span>}
          </div>
        </div>
      </div>

      {/* ===== 2-column main layout ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* ===== LEFT: Main column ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Essential info */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 18, fontSize: 16, fontWeight: 600 }}>المعلومات الأساسية</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {mainFields.map((f, i) => (
                <div key={i}>
                  <div className="label-sm" style={{ marginBottom: 4 }}>{f.label}</div>
                  <div
                    className={f.numeric ? 'num' : ''}
                    style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}
                  >
                    {f.value}
                  </div>
                </div>
              ))}
              {customColumns.map(col => (
                <div key={col.id}>
                  <div className="label-sm" style={{ marginBottom: 4 }}>{col.display_name}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                    {(customer as any)[col.column_name] || <span className="muted">-</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RemindersList
            customerId={customer.id}
            reminders={reminders}
            loading={remindersLoading}
            onOpenHandle={openHandleModal}
          />
        </div>

        {/* ===== RIGHT: Sidebar column ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Notes */}
          <div className="card" style={{ padding: 22 }}>
            <h4 style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>ملاحظات</h4>
            <p style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: customer.notes ? 'var(--text-primary)' : 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {customer.notes || 'لا توجد ملاحظات'}
            </p>
          </div>

          {/* Status summary */}
          {(customer.months_count || reminders.length > 0) && (
            <div className="card" style={{ padding: 22 }}>
              <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>الحالة</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {endDate && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 9,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                  }}>
                    <div className="label-sm" style={{ marginBottom: 4 }}>ينتهي في</div>
                    <div className="num" style={{ fontSize: 14, fontWeight: 600 }}>
                      {endDate.format('YYYY-MM-DD')}
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {(() => {
                        const diff = endDate.diff(dayjs(), 'day')
                        if (diff < 0) return `متأخر ${Math.abs(diff)} يوم`
                        if (diff === 0) return 'ينتهي اليوم'
                        return `متبقٍ ${diff} يوم`
                      })()}
                    </div>
                  </div>
                )}
                {nextReminder && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 9,
                    background: 'var(--warning-bg)',
                    border: '1px solid var(--warning-border)',
                  }}>
                    <div className="label-sm" style={{ marginBottom: 4, color: 'var(--warning)' }}>التذكير القادم</div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>
                      {nextReminder.reminder_date}
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {nextReminder.reminder_text}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <InvoicesCard invoices={invoices} />

          <HistoryCard history={history} />
        </div>
      </div>

      {/* ===== Handle reminder modal ===== */}
      <Modal
        title="التعامل مع التذكير"
        open={!!handleModal}
        onOk={confirmHandle}
        onCancel={() => setHandleModal(null)}
        okText="تأكيد"
        cancelText="إلغاء"
        width={480}
        destroyOnClose
      >
        {handleModal && (
          <div style={{
            padding: '12px 14px',
            marginBottom: 16,
            borderRadius: 10,
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
          }}>
            <strong style={{ fontSize: 13.5 }}>{handleModal.reminder_text}</strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 2 }}>
              {customer?.full_name}
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="handle_method" label="كيف تم التعامل؟"
            rules={[{ required: true, message: 'يرجى كتابة طريقة التعامل' }]}>
            <Input placeholder="مثال: تم تواصل، لا يرد، تم الشمول..." style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="handled_by" label="اسم الموظف"
            rules={[{ required: true, message: 'يرجى كتابة اسم الموظف' }]}>
            <Input placeholder="اسم الموظف" style={{ borderRadius: 10 }} />
          </Form.Item>
          <Form.Item name="wants_reremind" valuePropName="checked">
            <Checkbox>إعادة تذكير بتاريخ جديد</Checkbox>
          </Form.Item>
          {wantsReremind && (
            <>
              <Form.Item name="new_date" label="تاريخ التذكير الجديد"
                rules={[{ required: true, message: 'اختر التاريخ' }]}>
                <DatePicker style={{ width: '100%', borderRadius: 10 }} placeholder="اختر التاريخ الجديد" />
              </Form.Item>
              <Form.Item name="reremind_reason" label="سبب إعادة التذكير"
                rules={[{ required: true, message: 'اكتب السبب' }]}>
                <Input.TextArea placeholder="مثال: لم يرد سنعاود الاتصال..." rows={2} style={{ borderRadius: 10 }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* ===== Transfer modal ===== */}
      <Modal
        title="نقل الزبون إلى منصة أخرى"
        open={transferModal}
        onOk={handleTransfer}
        onCancel={() => setTransferModal(false)}
        okText="نقل" cancelText="إلغاء"
        width={400}
        destroyOnClose
      >
        <p style={{ marginBottom: 12 }}>
          نقل <strong>{customer.full_name}</strong> من منصة{' '}
          <span className="chip chip--neutral">{customer.platform_name || 'بدون منصة'}</span>
        </p>
        <Select
          value={transferPlatform}
          onChange={setTransferPlatform}
          placeholder="اختر المنصة المستهدفة"
          style={{ width: '100%' }}
        >
          {platforms.filter(p => p.name !== customer.platform_name).map((p: any) => (
            <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </div>
  )
}
