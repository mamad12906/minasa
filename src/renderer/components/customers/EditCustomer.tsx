import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Select, InputNumber, DatePicker, Checkbox, Button, message, Row, Col, Spin } from 'antd'
import {
  SaveOutlined, ArrowRightOutlined, BellOutlined,
  PhoneOutlined, IdcardOutlined, BankOutlined,
  FileTextOutlined, CalendarOutlined, LinkOutlined, EditOutlined, SwapOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'

export default function EditCustomer() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form] = Form.useForm()
  const hasReminder = Form.useWatch('has_reminder', form)
  const linkToPlatform = Form.useWatch('link_to_platform', form)
  const monthsCount = Form.useWatch('months_count', form)
  const reminderBefore = Form.useWatch('reminder_before', form)
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [createdAt, setCreatedAt] = useState<string>('')

  useEffect(() => {
    window.api.categories.list().then(setCategories).catch(() => {})
    window.api.platforms.list().then(setPlatforms).catch(() => {})
    if (isAdmin) {
      window.api.users.list().then((users: any[]) => setAllUsers(users.filter(u => u.role !== 'admin'))).catch(() => {})
    }
    loadCustomer()
  }, [])

  const loadCustomer = async () => {
    setLoading(true)
    const customer = await window.api.customer.get(Number(id))
    if (!customer) { navigate('/customers'); return }
    const values: any = { ...customer }
    if (values.platform_name) values.link_to_platform = true
    if (values.reminder_date) {
      values.has_reminder = true
      values.manual_reminder_date = dayjs(values.reminder_date)
      values.manual_reminder_text = values.reminder_text || ''
    }
    setCreatedAt(values.created_at || '')
    form.setFieldsValue(values)
    setLoading(false)
  }

  // Use created_at as base date, fallback to today
  const baseDate = createdAt ? dayjs(createdAt) : dayjs()
  const endDate = monthsCount && monthsCount > 0 ? baseDate.add(monthsCount, 'month') : null
  const autoReminderDate = endDate && reminderBefore && reminderBefore > 0
    ? endDate.subtract(reminderBefore, 'month') : null

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''

    // Auto reminder from months
    if (values.months_count && values.months_count > 0 && values.reminder_before && values.reminder_before > 0) {
      const end = baseDate.add(values.months_count, 'month')
      const remind = end.subtract(values.reminder_before, 'month')
      values.reminder_date = remind.format('YYYY-MM-DD')
      values.reminder_text = `تذكير تلقائي - انتهاء المدة ${end.format('YYYY-MM-DD')}`
    }
    delete values.reminder_before

    // Manual reminder overrides
    if (values.has_reminder && values.manual_reminder_date) {
      values.reminder_date = values.manual_reminder_date.format('YYYY-MM-DD')
      values.reminder_text = values.manual_reminder_text || 'تذكير يدوي'
    }
    delete values.has_reminder
    delete values.manual_reminder_date
    delete values.manual_reminder_text

    if (!values.link_to_platform) values.platform_name = ''
    delete values.link_to_platform
    await window.api.customer.update(Number(id), values)
    message.success('تم تعديل الزبون بنجاح!')
    setSaving(false)
    navigate('/customers')
  }

  const fieldCard = (icon: React.ReactNode, color: string, title: string, children: React.ReactNode) => (
    <div className="field-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16
        }}>{icon}</div>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2><EditOutlined style={{ marginLeft: 8 }} />تعديل بيانات الزبون</h2>
        </div>
        <Button icon={<ArrowRightOutlined />} onClick={() => navigate('/customers')}
          style={{ borderRadius: 8 }}>رجوع للزبائن</Button>
      </div>

      <Form form={form} layout="vertical" size="large">
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            {fieldCard(<IdcardOutlined />, '#1B6B93', 'المعلومات الأساسية', (
              <>
                <Form.Item name="full_name" label="اسم الزبون الرباعي" rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}>
                  <Input placeholder="أدخل الاسم الرباعي" />
                </Form.Item>
                <Form.Item name="mother_name" label="اسم الأم">
                  <Input placeholder="أدخل اسم الأم" />
                </Form.Item>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item name="phone_number" label="رقم الهاتف">
                      <Input prefix={<PhoneOutlined />} placeholder="رقم الهاتف" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="card_number" label="رقم البطاقة">
                      <Input prefix={<IdcardOutlined />} placeholder="رقم البطاقة" />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            ))}
            {fieldCard(<BankOutlined />, '#2DA44E', 'التصنيف والجهة', (
              <>
                <Form.Item name="link_to_platform" valuePropName="checked" style={{ marginBottom: 8 }}>
                  <Checkbox><LinkOutlined /> ربط بمنصة</Checkbox>
                </Form.Item>
                {linkToPlatform && (
                  <Form.Item name="platform_name" label="اسم المنصة" rules={[{ required: true, message: 'اختر المنصة' }]}>
                    <Select allowClear placeholder="اختر المنصة">
                      {platforms.map(p => <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                )}
                <Form.Item name="ministry_name" label="اسم الوزارة">
                  <Input prefix={<BankOutlined />} placeholder="أدخل اسم الوزارة" />
                </Form.Item>
                <Form.Item name="category" label="صنف الزبون">
                  <Select allowClear placeholder="اختر صنف الزبون"
                    options={categories.map(c => ({ value: c.name, label: c.name }))} />
                </Form.Item>
              </>
            ))}
            {isAdmin && fieldCard(<SwapOutlined />, '#D29922', 'نقل الزبون', (
              <Form.Item name="user_id" label="نقل إلى موظف">
                <Select allowClear placeholder="اختر الموظف">
                  <Select.Option key={user?.id} value={user?.id}>إليّ (الأدمن)</Select.Option>
                  {allUsers.map(u => <Select.Option key={u.id} value={u.id}>{u.display_name}</Select.Option>)}
                </Select>
              </Form.Item>
            ))}
          </Col>
          <Col xs={24} lg={12}>
            {fieldCard(<CalendarOutlined />, '#CF222E', 'المدة والتذكير التلقائي', (
              <>
                <Form.Item name="months_count" label="عدد الأشهر">
                  <InputNumber min={1} placeholder="مثال: 10، 18، 36..." style={{ width: '100%' }} addonAfter="شهر" />
                </Form.Item>
                {monthsCount && monthsCount > 0 && (
                  <>
                    <div style={{
                      fontSize: 13, color: 'var(--text-primary)',
                      background: 'var(--info-bg)', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--info-border)', marginBottom: 12
                    }}>
                      <div>تاريخ الإنشاء: <strong>{baseDate.format('YYYY-MM-DD')}</strong></div>
                      <div>تاريخ الانتهاء: <strong style={{ color: 'var(--error)' }}>{endDate?.format('YYYY-MM-DD')}</strong></div>
                    </div>
                    <Form.Item name="reminder_before" label="تذكير قبل الانتهاء بـ">
                      <InputNumber min={1} max={monthsCount - 1} placeholder="مثال: 2" style={{ width: '100%' }} addonAfter="شهر" />
                    </Form.Item>
                    {autoReminderDate && (
                      <div style={{
                        fontSize: 13, color: 'var(--text-primary)',
                        background: 'var(--success-bg)', padding: '10px 14px', borderRadius: 8,
                        border: '1px solid var(--success-border)', marginBottom: 12
                      }}>
                        تاريخ التذكير التلقائي: <strong style={{ color: 'var(--success)' }}>{autoReminderDate.format('YYYY-MM-DD')}</strong>
                      </div>
                    )}
                  </>
                )}
                <Form.Item name="status_note" label="الحالة">
                  <Input placeholder="مثال: تذبذب شمول، قيد المراجعة..." />
                </Form.Item>
              </>
            ))}
            {fieldCard(<BellOutlined />, '#D29922', 'تذكير يدوي إضافي', (
              <>
                <Form.Item name="has_reminder" valuePropName="checked">
                  <Checkbox>تفعيل تذكير يدوي</Checkbox>
                </Form.Item>
                {hasReminder && (
                  <>
                    <Form.Item name="manual_reminder_date" label="تاريخ التذكير" rules={[{ required: true, message: 'اختر التاريخ' }]}>
                      <DatePicker style={{ width: '100%' }} placeholder="اختر تاريخ التذكير" />
                    </Form.Item>
                    <Form.Item name="manual_reminder_text" label="نص التذكير" rules={[{ required: true, message: 'اكتب النص' }]}>
                      <Input placeholder="مثال: تم شموله، متابعة..." />
                    </Form.Item>
                  </>
                )}
              </>
            ))}
            {fieldCard(<FileTextOutlined />, '#1B6B93', 'ملاحظات', (
              <Form.Item name="notes" label="ملاحظات">
                <Input.TextArea rows={3} placeholder="ملاحظات إضافية..." />
              </Form.Item>
            ))}
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}
            onClick={handleSave} loading={saving}
            style={{ borderRadius: 10, minWidth: 220, height: 48, fontSize: 16, fontWeight: 600 }}>
            حفظ التعديلات
          </Button>
        </div>
      </Form>
    </div>
  )
}
