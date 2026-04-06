import React, { useEffect, useState } from 'react'
import { Drawer, Descriptions, Tag, Spin, Divider, Timeline, Empty, Button, Modal, Form, Input, Select, DatePicker, Checkbox, message } from 'antd'
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, SwapOutlined, CalendarOutlined, PrinterOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Customer, CustomColumn } from '../../types'
import { useAuth } from '../../App'

interface Props {
  customer: Customer | null
  onClose: () => void
  onRefresh?: () => void
  customColumns: CustomColumn[]
}

export default function CustomerDetail({ customer, onClose, customColumns, onRefresh }: Props) {
  const { user } = useAuth()
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

  const printCard = () => {
    if (!customer) return
    const endDate = customer.months_count && customer.created_at
      ? dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD') : '-'
    const w = window.open('', '_blank', 'width=600,height=800')
    if (!w) return
    w.document.write(`<html dir="rtl"><head><title>بطاقة زبون</title>
      <style>body{font-family:'Segoe UI',Tahoma,Arial;padding:30px;color:#1A2332}
      h1{text-align:center;color:#1B6B93;border-bottom:3px solid #1B6B93;padding-bottom:10px}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      td,th{padding:10px 14px;border:1px solid #E2E8F0;text-align:right}
      th{background:#F0F4F7;font-weight:600;width:35%}
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

  const loadReminders = async () => {
    if (!customer) return
    setLoading(true); setReminders(await window.api.customer.reminders(customer.id)); setLoading(false)
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

  return (
    <Drawer title="تفاصيل الزبون" open={!!customer} onClose={onClose} width={650} placement="left">
      {customer && (
        <div style={{ overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Button icon={<PrinterOutlined />} onClick={printCard} style={{ borderRadius: 8 }}>طباعة بطاقة</Button>
            {isAdmin && <Button icon={<SwapOutlined />} onClick={() => setTransferModal(true)} style={{ borderRadius: 8 }}>نقل لمنصة أخرى</Button>}
          </div>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="الاسم الرباعي">{customer.full_name}</Descriptions.Item>
            <Descriptions.Item label="اسم الأم">{customer.mother_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="رقم الهاتف">{customer.phone_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="رقم البطاقة">{customer.card_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="المنصة">{customer.platform_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الوزارة">{customer.ministry_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الصنف">{customer.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="الحالة">{customer.status_note ? <Tag color="orange">{customer.status_note}</Tag> : '-'}</Descriptions.Item>
            <Descriptions.Item label="عدد الأشهر">{customer.months_count ? <Tag color="blue">{customer.months_count} شهر</Tag> : '-'}</Descriptions.Item>
            <Descriptions.Item label="تاريخ الإنشاء">{customer.created_at}</Descriptions.Item>
            {customer.months_count && customer.months_count > 0 && customer.created_at && (
              <Descriptions.Item label="تاريخ الانتهاء">
                <Tag color="red">{dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD')}</Tag>
              </Descriptions.Item>
            )}
            {customer.months_count && customer.months_count > 0 && customer.created_at && reminders.length > 0 && (
              <Descriptions.Item label="تاريخ التذكير">
                <Tag color="orange">{reminders.find((r: any) => r.is_done === 0)?.reminder_date || reminders[0]?.reminder_date || '-'}</Tag>
              </Descriptions.Item>
            )}
            {customColumns.map(col => (
              <Descriptions.Item key={col.id} label={col.display_name}>{customer[col.column_name] || '-'}</Descriptions.Item>
            ))}
          </Descriptions>

          {/* Notes - always show section */}
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'var(--info-bg)', border: '1px solid var(--info-border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--info)', fontSize: 13 }}>ملاحظات</div>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', fontSize: 13 }}>{customer.notes || 'لا توجد ملاحظات'}</div>
          </div>

          {/* Edit History */}
          {history.length > 0 && (
            <>
              <Divider><HistoryOutlined /> سجل التعديلات</Divider>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {history.map((h: any) => (
                  <div key={h.id} style={{
                    padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                    background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)', fontSize: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Tag color={h.action === 'إضافة' ? 'green' : h.action === 'حذف' ? 'red' : 'blue'} style={{ fontSize: 11 }}>{h.action}</Tag>
                      <span style={{ color: 'var(--text-muted)' }}>{dayjs(h.created_at).format('YYYY-MM-DD hh:mm A')}</span>
                    </div>
                    {h.details && <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{h.details}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          <Divider><BellOutlined /> سجل التذكيرات</Divider>

          {loading ? <Spin /> : reminders.length === 0 ? (
            <Empty description="لا توجد تذكيرات لهذا الزبون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Timeline items={reminders.map(r => {
              const isDone = r.is_done === 1
              const isDue = !isDone && r.reminder_date <= today
              const color = isDone ? 'green' : isDue ? 'red' : 'blue'
              const icon = isDone ? <CheckCircleOutlined /> : <ClockCircleOutlined />
              const statusText = isDone ? 'تم التعامل' : isDue ? 'يحتاج تعامل' : 'قادم'
              const bgColor = isDone ? 'var(--success-bg)' : isDue ? 'var(--error-bg)' : 'var(--info-bg)'
              const borderColor = isDone ? 'var(--success-border)' : isDue ? 'var(--error-border)' : 'var(--info-border)'

              return {
                color, dot: icon,
                children: (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: bgColor, border: `1px solid ${borderColor}`, marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>{r.reminder_text}</strong>
                      <Tag color={color}>{statusText}</Tag>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <div>تاريخ التذكير: <strong>{r.reminder_date}</strong></div>
                      {r.original_date && r.original_date !== r.reminder_date && (
                        <div>التاريخ الأصلي: <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{r.original_date}</span></div>
                      )}
                      {r.is_postponed === 1 && r.postpone_reason && (
                        <div style={{ color: 'var(--warning)' }}>سبب الإعادة: <strong>{r.postpone_reason}</strong></div>
                      )}
                      {isDone && (
                        <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 6, background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                          {r.handle_method && <div>طريقة التعامل: <Tag color="green">{r.handle_method}</Tag></div>}
                          {r.handled_by && <div>الموظف: <strong>{r.handled_by}</strong></div>}
                          {r.handled_at && <div style={{ color: 'var(--text-muted)' }}>تاريخ التعامل: {r.handled_at}</div>}
                        </div>
                      )}
                      <div style={{ color: 'var(--text-muted)', marginTop: 3, fontSize: 11 }}>أُنشئ: {dayjs(r.created_at).isValid() ? dayjs(r.created_at).add(3, 'hour').format('YYYY-MM-DD hh:mm A') : r.created_at}</div>
                    </div>
                    {!isDone && isDue && (
                      <Button type="primary" size="small" style={{ marginTop: 6, borderRadius: 6, background: '#2DA44E', border: 'none' }}
                        onClick={() => openHandleModal(r)}>تعامل مع التذكير</Button>
                    )}
                  </div>
                )
              }
            })} />
          )}
        </div>
      )}

      <Modal title="التعامل مع التذكير" open={!!handleModal} onOk={confirmHandle}
        onCancel={() => setHandleModal(null)} okText="تأكيد" cancelText="إلغاء" width={480} destroyOnClose>
        {handleModal && (
          <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 8, background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
            <strong>{handleModal.reminder_text}</strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{handleModal.full_name || customer?.full_name}</div>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="handle_method" label="كيف تم التعامل؟" rules={[{ required: true, message: 'يرجى كتابة طريقة التعامل' }]}>
            <Input placeholder="مثال: تم تواصل، لا يرد، تم الشمول..." />
          </Form.Item>
          <Form.Item name="handled_by" label="اسم الموظف الذي تعامل" rules={[{ required: true, message: 'يرجى كتابة اسم الموظف' }]}>
            <Input placeholder="اسم الموظف" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item name="wants_reremind" valuePropName="checked">
            <Checkbox>إعادة تذكير بتاريخ جديد</Checkbox>
          </Form.Item>
          {wantsReremind && (
            <>
              <Form.Item name="new_date" label="تاريخ التذكير الجديد" rules={[{ required: true, message: 'اختر التاريخ' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ الجديد" />
              </Form.Item>
              <Form.Item name="reremind_reason" label="سبب إعادة التذكير" rules={[{ required: true, message: 'اكتب السبب' }]}>
                <Input.TextArea placeholder="مثال: لم يرد سنعاود الاتصال..." rows={2} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal title="نقل الزبون إلى منصة أخرى" open={transferModal}
        onOk={handleTransfer} onCancel={() => setTransferModal(false)} okText="نقل" cancelText="إلغاء" width={400} destroyOnClose>
        <p style={{ marginBottom: 12 }}>نقل <strong>{customer?.full_name}</strong> من منصة <Tag color="blue">{customer?.platform_name || 'بدون منصة'}</Tag></p>
        <Select value={transferPlatform} onChange={setTransferPlatform} placeholder="اختر المنصة المستهدفة" style={{ width: '100%' }}>
          {platforms.filter(p => p.name !== customer?.platform_name).map((p: any) => (
            <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </Drawer>
  )
}
