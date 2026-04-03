import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Select, InputNumber, DatePicker, Checkbox, Button, Divider, message, Row, Col, Spin } from 'antd'
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
  const [categories, setCategories] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

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
      values.reminder_date = dayjs(values.reminder_date)
    }
    form.setFieldsValue(values)
    setLoading(false)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''
    if (values.reminder_date) values.reminder_date = values.reminder_date.format('YYYY-MM-DD')
    if (!values.has_reminder) { values.reminder_date = ''; values.reminder_text = '' }
    delete values.has_reminder
    if (!values.link_to_platform) values.platform_name = ''
    delete values.link_to_platform

    await window.api.customer.update(Number(id), values)
    message.success('تم تعديل الزبون بنجاح!')
    setSaving(false)
    navigate('/customers')
  }

  const fieldCard = (icon: React.ReactNode, color: string, title: string, children: React.ReactNode) => (
    <div className="field-card" style={{
      background: '#fff', borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.05)', borderRight: `4px solid ${color}`,
      transition: 'all 0.35s cubic-bezier(.4,0,.2,1)', marginBottom: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 18, boxShadow: `0 4px 12px ${color}40`
        }}>{icon}</div>
        <span style={{ fontWeight: 'bold', fontSize: 15, color: '#333' }}>{title}</span>
      </div>
      {children}
    </div>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  return (
    <div>
      <div className="add-header" style={{
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24, color: '#fff',
        boxShadow: '0 8px 32px rgba(245,87,108,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>
            <EditOutlined style={{ marginLeft: 10 }} />تعديل بيانات الزبون
          </h2>
        </div>
        <Button ghost icon={<ArrowRightOutlined />} onClick={() => navigate('/customers')}
          style={{ borderRadius: 10, color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
          رجوع للزبائن
        </Button>
      </div>

      <Form form={form} layout="vertical" size="large">
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            {fieldCard(<IdcardOutlined />, '#667eea', 'المعلومات الأساسية', (
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

            {fieldCard(<BankOutlined />, '#43e97b', 'التصنيف والجهة', (
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

            {isAdmin && fieldCard(<SwapOutlined />, '#faad14', 'نقل الزبون', (
              <Form.Item name="user_id" label="نقل إلى موظف">
                <Select allowClear placeholder="اختر الموظف">
                  <Select.Option key={user?.id} value={user?.id}>📌 إليّ (الأدمن)</Select.Option>
                  {allUsers.map(u => <Select.Option key={u.id} value={u.id}>{u.display_name}</Select.Option>)}
                </Select>
              </Form.Item>
            ))}
          </Col>

          <Col xs={24} lg={12}>
            {fieldCard(<CalendarOutlined />, '#f5576c', 'المدة والحالة', (
              <>
                <Form.Item name="months_count" label="عدد الأشهر">
                  <InputNumber min={0} placeholder="مثال: 18، 36..." style={{ width: '100%' }} addonAfter="شهر" />
                </Form.Item>
                <Form.Item name="status_note" label="الحالة">
                  <Input placeholder="مثال: تذبذب شمول، قيد المراجعة..." />
                </Form.Item>
              </>
            ))}

            {fieldCard(<BellOutlined />, '#faad14', 'تذكير إضافي', (
              <>
                <Form.Item name="has_reminder" valuePropName="checked">
                  <Checkbox>تفعيل تذكير يدوي</Checkbox>
                </Form.Item>
                {hasReminder && (
                  <>
                    <Form.Item name="reminder_date" label="تاريخ التذكير" rules={[{ required: true, message: 'اختر التاريخ' }]}>
                      <DatePicker style={{ width: '100%' }} placeholder="اختر تاريخ التذكير" />
                    </Form.Item>
                    <Form.Item name="reminder_text" label="نص التذكير" rules={[{ required: true, message: 'اكتب النص' }]}>
                      <Input placeholder="مثال: تم شموله، متابعة..." />
                    </Form.Item>
                  </>
                )}
              </>
            ))}

            {fieldCard(<FileTextOutlined />, '#4facfe', 'ملاحظات', (
              <Form.Item name="notes" label="ملاحظات">
                <Input.TextArea rows={3} placeholder="ملاحظات إضافية..." />
              </Form.Item>
            ))}
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}
            onClick={handleSave} loading={saving}
            style={{
              borderRadius: 12, minWidth: 250, height: 50, fontSize: 18,
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              border: 'none', boxShadow: '0 8px 24px rgba(245,87,108,0.4)'
            }} className="save-btn">
            حفظ التعديلات
          </Button>
        </div>
      </Form>

      <style>{`
        .field-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .save-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 12px 32px rgba(245,87,108,0.5) !important; }
      `}</style>
    </div>
  )
}
