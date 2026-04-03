import React, { useEffect, useState } from 'react'
import { Drawer, Descriptions, Tag, Spin, Divider, Timeline, Empty, Button, Modal, Form, Input, Select, DatePicker, Checkbox, message } from 'antd'
import { BellOutlined, CheckCircleOutlined, ClockCircleOutlined, PauseCircleOutlined, SwapOutlined } from '@ant-design/icons'
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

  useEffect(() => {
    if (isAdmin) {
      window.api.platforms.list().then(setPlatforms).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (customer) loadReminders()
  }, [customer])

  const loadReminders = async () => {
    if (!customer) return
    setLoading(true)
    const data = await window.api.customer.reminders(customer.id)
    setReminders(data)
    setLoading(false)
  }

  const openHandleModal = (r: any) => {
    setHandleModal(r)
    form.resetFields()
  }

  const confirmHandle = async () => {
    const vals = await form.validateFields()

    // Mark as done
    await window.api.reminders.done(handleModal.id, vals.handled_by, vals.handle_method)

    // If wants re-reminder
    if (vals.wants_reremind && vals.new_date && vals.reremind_reason) {
      await window.api.reminders.reremind(handleModal.id, vals.new_date.format('YYYY-MM-DD'), vals.reremind_reason)
    }

    message.success('تم تسجيل التعامل مع التذكير')
    setHandleModal(null)
    loadReminders()
    // Notify sidebar to refresh
    window.dispatchEvent(new Event('reminders-updated'))
  }

  const handleTransfer = async () => {
    if (!customer || !transferPlatform) return
    await window.api.transfer.customers([customer.id], transferPlatform)
    message.success(`تم نقل ${customer.full_name} إلى منصة "${transferPlatform}"`)
    setTransferModal(false)
    setTransferPlatform('')
    onRefresh?.()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Drawer
      title="تفاصيل الزبون"
      open={!!customer}
      onClose={onClose}
      width={650}
      placement="left"
    >
      {customer && (
        <div style={{ overflow: 'auto' }}>
          {/* Admin: Transfer button */}
          {isAdmin && (
            <Button icon={<SwapOutlined />} onClick={() => setTransferModal(true)}
              style={{ marginBottom: 12, borderRadius: 8 }}>
              نقل إلى منصة أخرى
            </Button>
          )}

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="الاسم الرباعي">{customer.full_name}</Descriptions.Item>
            <Descriptions.Item label="اسم الأم">{customer.mother_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="رقم الهاتف">{customer.phone_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="رقم البطاقة">{customer.card_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="المنصة">{customer.platform_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الوزارة">{customer.ministry_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الصنف">{customer.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="الحالة">
              {customer.status_note ? <Tag color="orange">{customer.status_note}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="عدد الأشهر">
              {customer.months_count ? <Tag color="blue">{customer.months_count} شهر</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="تاريخ الإنشاء">{customer.created_at}</Descriptions.Item>
            {customColumns.map(col => (
              <Descriptions.Item key={col.id} label={col.display_name}>
                {customer[col.column_name] || '-'}
              </Descriptions.Item>
            ))}
          </Descriptions>

          {/* Notes */}
          {customer.notes && (
            <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#0050b3' }}>📝 ملاحظات</div>
              <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{customer.notes}</div>
            </div>
          )}

          <Divider><BellOutlined /> سجل التذكيرات</Divider>

          {loading ? <Spin /> : reminders.length === 0 ? (
            <Empty description="لا توجد تذكيرات لهذا الزبون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Timeline items={reminders.map(r => {
              const isDone = r.is_done === 1
              const isDue = !isDone && r.reminder_date <= today
              const isPending = !isDone && !isDue

              let color = 'blue'
              let icon = <ClockCircleOutlined />
              let statusText = 'قادم'
              let statusColor = 'blue'
              let bgColor = '#e6f4ff'
              let borderColor = '#91caff'

              if (isDone) {
                color = 'green'; icon = <CheckCircleOutlined />
                statusText = 'تم التعامل'; statusColor = 'green'
                bgColor = '#f6ffed'; borderColor = '#b7eb8f'
              } else if (isDue) {
                color = 'red'; icon = <ClockCircleOutlined />
                statusText = 'يحتاج تعامل'; statusColor = 'red'
                bgColor = '#fff1f0'; borderColor = '#ffa39e'
              }

              return {
                color,
                dot: icon,
                children: (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: bgColor, border: `1px solid ${borderColor}`,
                    marginBottom: 4, transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: 14 }}>{r.reminder_text}</strong>
                      <Tag color={statusColor}>{statusText}</Tag>
                    </div>

                    <div style={{ fontSize: 12, color: '#666' }}>
                      <div>تاريخ التذكير: <strong>{r.reminder_date}</strong></div>

                      {r.original_date && r.original_date !== r.reminder_date && (
                        <div>التاريخ الأصلي: <span style={{ textDecoration: 'line-through', color: '#bbb' }}>{r.original_date}</span></div>
                      )}

                      {r.is_postponed === 1 && r.postpone_reason && (
                        <div style={{ color: '#faad14' }}>سبب الإعادة: <strong>{r.postpone_reason}</strong></div>
                      )}

                      {isDone && (
                        <div style={{
                          marginTop: 6, padding: '8px 10px', borderRadius: 8,
                          background: 'rgba(82, 196, 26, 0.08)', border: '1px solid rgba(82, 196, 26, 0.2)'
                        }}>
                          {r.handle_method && <div>طريقة التعامل: <Tag color="green">{r.handle_method}</Tag></div>}
                          {r.handled_by && <div>الموظف: <strong>{r.handled_by}</strong></div>}
                          {r.handled_at && <div style={{ color: '#bbb' }}>تاريخ التعامل: {r.handled_at}</div>}
                        </div>
                      )}

                      <div style={{ color: '#ccc', marginTop: 4, fontSize: 11 }}>أُنشئ: {r.created_at}</div>
                    </div>

                    {/* Handle button - only for due/pending and not done */}
                    {!isDone && isDue && (
                      <Button type="primary" size="small" style={{
                        marginTop: 8, borderRadius: 8,
                        background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                        border: 'none'
                      }} onClick={() => openHandleModal(r)}>
                        تعامل مع التذكير
                      </Button>
                    )}
                  </div>
                )
              }
            })} />
          )}
        </div>
      )}

      {/* Handle Modal */}
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
            padding: '10px 14px', marginBottom: 16, borderRadius: 10,
            background: '#fff1f0', border: '1px solid #ffa39e'
          }}>
            <strong>{handleModal.reminder_text}</strong>
            <div style={{ color: '#666', fontSize: 13 }}>{handleModal.full_name || customer?.full_name}</div>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="handle_method" label="كيف تم التعامل؟"
            rules={[{ required: true, message: 'يرجى كتابة طريقة التعامل' }]}>
            <Input placeholder="مثال: تم تواصل، لا يرد، تم الشمول، تم مراجعة..." />
          </Form.Item>

          <Form.Item name="handled_by" label="اسم الموظف الذي تعامل"
            rules={[{ required: true, message: 'يرجى كتابة اسم الموظف' }]}>
            <Input placeholder="اسم الموظف" />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />

          <Form.Item name="wants_reremind" valuePropName="checked">
            <Checkbox>إعادة تذكير بتاريخ جديد</Checkbox>
          </Form.Item>

          {wantsReremind && (
            <>
              <Form.Item name="new_date" label="تاريخ التذكير الجديد"
                rules={[{ required: true, message: 'اختر التاريخ' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ الجديد" />
              </Form.Item>
              <Form.Item name="reremind_reason" label="سبب إعادة التذكير"
                rules={[{ required: true, message: 'اكتب السبب' }]}>
                <Input.TextArea placeholder="مثال: لم يرد سنعاود الاتصال، بحاجة متابعة..." rows={2} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Transfer Modal */}
      <Modal title="نقل الزبون إلى منصة أخرى" open={transferModal}
        onOk={handleTransfer} onCancel={() => setTransferModal(false)}
        okText="نقل" cancelText="إلغاء" width={400} destroyOnClose>
        <p style={{ marginBottom: 12 }}>نقل <strong>{customer?.full_name}</strong> من منصة <Tag color="blue">{customer?.platform_name || 'بدون منصة'}</Tag></p>
        <Select value={transferPlatform} onChange={setTransferPlatform}
          placeholder="اختر المنصة المستهدفة" style={{ width: '100%' }}>
          {platforms.filter(p => p.name !== customer?.platform_name).map((p: any) => (
            <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
          ))}
        </Select>
      </Modal>
    </Drawer>
  )
}
