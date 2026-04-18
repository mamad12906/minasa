import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer, Spin, Empty, Button, Modal, Form, Input, Select, DatePicker, Checkbox, message } from 'antd'
import dayjs from 'dayjs'
import type { Customer, CustomColumn } from '../../types'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'

interface Props {
  customer: Customer | null
  onClose: () => void
  onRefresh?: () => void
  customColumns: CustomColumn[]
}

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

export default function CustomerDetail({ customer, onClose, customColumns, onRefresh }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [handleModal, setHandleModal] = useState<any>(null)
  const [form] = Form.useForm()
  const wantsReremind = Form.useWatch('wants_reremind', form)
  const [transferModal, setTransferModal] = useState(false)
  const [transferPlatform, setTransferPlatform] = useState('')
  const [platforms, setPlatforms] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => { if (isAdmin) window.api.platforms.list().then(setPlatforms).catch(() => {}) }, [])
  useEffect(() => {
    if (customer) { loadReminders(); loadHistory() }
  }, [customer])

  const loadHistory = async () => {
    if (!customer) return
    try {
      const h = await (window as any).__localApi?.customer?.history(customer.id)
      setHistory(h || [])
    } catch { setHistory([]) }
  }

  const loadReminders = async () => {
    if (!customer) return
    setLoading(true)
    try { setReminders(await window.api.customer.reminders(customer.id)) }
    catch (err) { console.error('[CustomerDetail] Failed to load reminders:', err) }
    finally { setLoading(false) }
  }

  const printCard = () => {
    if (!customer) return
    const endDate = customer.months_count && customer.created_at
      ? dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD')
      : '-'
    const w = window.open('', '_blank', 'width=600,height=800')
    if (!w) return
    w.document.write(`<html dir="rtl"><head><title>بطاقة زبون</title>
      <style>body{font-family:'Segoe UI',Tahoma,Arial;padding:30px;color:#1A1F1C}
      h1{text-align:center;color:#0F4C3A;border-bottom:3px solid #0F4C3A;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      td,th{padding:10px 14px;border:1px solid #E2DED5;text-align:right}
      th{background:#F7F5F0;font-weight:600;width:35%}
      .f{text-align:center;margin-top:30px;color:#94A3B8;font-size:12px}</style></head><body>
      <h1>بطاقة زبون - منصة</h1><table>
      <tr><th>الاسم</th><td>${customer.full_name}</td></tr>
      <tr><th>اسم الأم</th><td>${customer.mother_name || '-'}</td></tr>
      <tr><th>الهاتف</th><td>${customer.phone_number || '-'}</td></tr>
      <tr><th>البطاقة</th><td>${customer.card_number || '-'}</td></tr>
      <tr><th>المنصة</th><td>${customer.platform_name || '-'}</td></tr>
      <tr><th>الوزارة</th><td>${customer.ministry_name || '-'}</td></tr>
      <tr><th>الصنف</th><td>${customer.category || '-'}</td></tr>
      <tr><th>الحالة</th><td>${customer.status_note || '-'}</td></tr>
      <tr><th>الأشهر</th><td>${customer.months_count || '-'}</td></tr>
      <tr><th>الانتهاء</th><td>${endDate}</td></tr>
      <tr><th>ملاحظات</th><td>${customer.notes || '-'}</td></tr>
      </table><div class="f">طُبعت ${dayjs().format('YYYY-MM-DD')} | منصة</div></body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const openHandleModal = (r: any) => { setHandleModal(r); form.resetFields() }

  const confirmHandle = async () => {
    const vals = await form.validateFields()
    await window.api.reminders.done(handleModal.id, vals.handled_by, vals.handle_method)
    if (vals.wants_reremind && vals.new_date && vals.reremind_reason) {
      await window.api.reminders.reremind(handleModal.id, vals.new_date.format('YYYY-MM-DD'), vals.reremind_reason)
    }
    message.success('تم تسجيل التعامل مع التذكير')
    setHandleModal(null); loadReminders()
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleTransfer = async () => {
    if (!customer || !transferPlatform) return
    await window.api.transfer.customers([customer.id], transferPlatform)
    message.success(`تم نقل ${customer.full_name} إلى منصة "${transferPlatform}"`)
    setTransferModal(false); setTransferPlatform(''); onRefresh?.()
  }

  const today = new Date().toISOString().split('T')[0]
  const endDate = customer?.months_count && customer?.created_at
    ? dayjs(customer.created_at).add(customer.months_count, 'month')
    : null
  const nextReminder = reminders.find((r: any) => r.is_done === 0)
  const activeReminders = reminders.filter((r: any) => r.is_done === 0).length
  const sTone = statusTone(customer?.status_note)

  // ===== Primary grid fields =====
  const fields: Array<{ label: string; value: any; numeric?: boolean; icon?: any }> = customer ? [
    { label: 'رقم الهاتف', value: customer.phone_number || '-', numeric: true, icon: 'phone' },
    { label: 'رقم البطاقة', value: customer.card_number || '-', numeric: true, icon: 'id' },
    { label: 'اسم الأم', value: customer.mother_name || '-' },
    { label: 'المنصة', value: customer.platform_name || '-', icon: 'layers' },
    { label: 'الوزارة', value: customer.ministry_name || '-', icon: 'building' },
    { label: 'الصنف', value: customer.category || '-', icon: 'tag' },
    { label: 'المدة', value: customer.months_count ? `${customer.months_count} شهر` : '-', numeric: true, icon: 'calendar' },
    { label: 'تاريخ الإضافة', value: customer.created_at?.split('T')[0] || '-', numeric: true },
    { label: 'تاريخ الانتهاء', value: endDate ? endDate.format('YYYY-MM-DD') : '-', numeric: true },
  ] : []

  return (
    <Drawer
      open={!!customer}
      onClose={onClose}
      width={720}
      placement="left"
      title={null}
      closable={false}
      styles={{
        body: { padding: 0, background: 'var(--bg-base)' },
        header: { display: 'none' },
      }}
    >
      {customer && (
        <div style={{ padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* ===== Top action bar ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn--ghost btn--sm" onClick={onClose}>
              <Icon name="x" size={12} /> إغلاق
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btn--ghost btn--sm" onClick={printCard}>
              <Icon name="printer" size={12} /> طباعة
            </button>
            {isAdmin && (
              <button className="btn btn--ghost btn--sm" onClick={() => setTransferModal(true)}>
                <Icon name="swap" size={12} /> نقل لمنصة
              </button>
            )}
            <button
              className="btn btn--primary btn--sm"
              onClick={() => { onClose(); navigate(`/edit-customer/${customer.id}`) }}
            >
              <Icon name="edit" size={12} /> تعديل
            </button>
          </div>

          {/* ===== Hero header ===== */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div className="avatar avatar-ring" style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}>
                {initials(customer.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ fontSize: 22, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {customer.full_name}
                </h1>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {customer.mother_name && <span>والدة: {customer.mother_name}</span>}
                  {customer.phone_number && (
                    <>
                      {customer.mother_name && <span style={{ opacity: 0.5 }}>·</span>}
                      <span className="num">{customer.phone_number}</span>
                    </>
                  )}
                  {customer.card_number && (
                    <>
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span className="num">{customer.card_number}</span>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  {customer.status_note && (
                    <span className={`chip chip--${sTone}`}>
                      <span className="dot" style={{ background: 'currentColor' }} />
                      {customer.status_note}
                    </span>
                  )}
                  {customer.category && <span className="chip chip--brand">{customer.category}</span>}
                  {customer.months_count && <span className="chip chip--accent"><span className="num">{customer.months_count}</span> شهر</span>}
                  {customer.platform_name && <span className="chip chip--neutral">{customer.platform_name}</span>}
                  {activeReminders > 0 && (
                    <span className="chip chip--warning">
                      <Icon name="bell" size={10} />
                      <span className="num">{activeReminders}</span> تذكير
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Essential info grid ===== */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 15, margin: 0, marginBottom: 18, fontWeight: 600 }}>المعلومات الأساسية</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {fields.map((f, i) => (
                <div key={i}>
                  <div className="label-sm" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {f.icon && <Icon name={f.icon} size={10} />}
                    {f.label}
                  </div>
                  <div className={f.numeric ? 'num' : ''} style={{
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word',
                  }}>{f.value}</div>
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

          {/* ===== Notes ===== */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Icon name="file" size={14} />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>ملاحظات</h4>
            </div>
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

          {/* ===== Reminders ===== */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="bell" size={14} />
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>سجل التذكيرات</h3>
              </div>
              {nextReminder && (
                <span className={`chip chip--${nextReminder.reminder_date <= today ? 'danger' : 'warning'}`}>
                  <span className="num">{nextReminder.reminder_date}</span>
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : reminders.length === 0 ? (
              <Empty description="لا توجد تذكيرات لهذا الزبون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reminders.map((r: any) => {
                  const isDone = r.is_done === 1
                  const isDue = !isDone && r.reminder_date <= today
                  const tone = isDone ? 'success' : isDue ? 'danger' : 'info'
                  const label = isDone ? 'تم' : isDue ? 'مستحق' : 'قادم'
                  const iconName = isDone ? 'check' : isDue ? 'bell' : 'clock'

                  return (
                    <div key={r.id} style={{
                      padding: 14,
                      borderRadius: 10,
                      background: `var(--${tone}-bg)`,
                      border: `1px solid var(--${tone}-border)`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 13.5, minWidth: 0 }}>
                          <Icon name={iconName} size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reminder_text}</span>
                        </div>
                        <span className={`chip chip--${tone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{label}</span>
                      </div>
                      <div className="num muted" style={{ fontSize: 12 }}>
                        {r.reminder_date}
                        {r.original_date && r.original_date !== r.reminder_date && (
                          <> · <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{r.original_date}</span></>
                        )}
                        {r.is_postponed === 1 && r.postpone_reason && (
                          <> · <span style={{ color: 'var(--warning)' }}>{r.postpone_reason}</span></>
                        )}
                      </div>
                      {isDone && (r.handle_method || r.handled_by) && (
                        <div style={{
                          marginTop: 8,
                          padding: '6px 10px',
                          borderRadius: 7,
                          background: 'var(--bg-elevated)',
                          fontSize: 11.5,
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}>
                          {r.handle_method && <span>طريقة: <strong>{r.handle_method}</strong></span>}
                          {r.handled_by && <span>الموظف: <strong>{r.handled_by}</strong></span>}
                        </div>
                      )}
                      {!isDone && isDue && (
                        <button
                          className="btn btn--primary btn--sm"
                          onClick={() => openHandleModal(r)}
                          style={{ marginTop: 8 }}
                        >
                          <Icon name="check" size={11} /> تعامل مع التذكير
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ===== History ===== */}
          {history.length > 0 && (
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Icon name="history" size={14} />
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>سجل التعديلات</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 260, overflowY: 'auto' }}>
                {history.map((h: any, i: number) => {
                  const aTone = h.action === 'إضافة' ? 'success'
                    : h.action === 'حذف' ? 'danger'
                    : h.action === 'تعديل' ? 'info'
                    : 'neutral'
                  return (
                    <div key={h.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 0',
                      borderBottom: i < history.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontSize: 12.5,
                    }}>
                      <span className={`chip chip--${aTone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{h.action}</span>
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
                        {h.details || <span className="muted">—</span>}
                      </span>
                      <span className="num muted" style={{ fontSize: 11, flexShrink: 0 }}>
                        {dayjs(h.created_at).isValid()
                          ? dayjs(h.created_at).format('YYYY-MM-DD HH:mm')
                          : h.created_at}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
              {handleModal.full_name || customer?.full_name}
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
          نقل <strong>{customer?.full_name}</strong> من منصة{' '}
          <span className="chip chip--neutral">{customer?.platform_name || 'بدون منصة'}</span>
        </p>
        <Select
          value={transferPlatform}
          onChange={setTransferPlatform}
          placeholder="اختر المنصة المستهدفة"
          style={{ width: '100%' }}
        >
          {platforms.filter(p => p.name !== customer?.platform_name).map((p: any) => (
            <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </Drawer>
  )
}
