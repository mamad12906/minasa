import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, InputNumber, DatePicker, Checkbox, Button, Divider, message, Row, Col } from 'antd'
import {
  UserAddOutlined, SaveOutlined, ArrowRightOutlined, BellOutlined,
  PhoneOutlined, IdcardOutlined, BankOutlined, TagOutlined,
  FileTextOutlined, CalendarOutlined, LinkOutlined
} from '@ant-design/icons'
import { useAuth } from '../../App'

export default function AddCustomer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form] = Form.useForm()
  const hasReminder = Form.useWatch('has_reminder', form)
  const linkToPlatform = Form.useWatch('link_to_platform', form)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [platforms, setPlatforms] = useState<{ id: number; name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.categories.list().then(setCategories).catch(() => {})
    if (isAdmin) window.api.platforms.list().then(setPlatforms).catch(() => {})
  }, [])

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)

    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''
    if (values.reminder_date) values.reminder_date = values.reminder_date.format('YYYY-MM-DD')
    if (!values.has_reminder) { values.reminder_date = ''; values.reminder_text = '' }
    delete values.has_reminder

    // Platform binding
    if (!values.link_to_platform) {
      values.platform_name = ''
    } else if (!isAdmin && user?.platform_name) {
      values.platform_name = user.platform_name
    }
    delete values.link_to_platform

    // Set user_id
    values.user_id = user?.id || 0

    await window.api.customer.create(values)
    message.success('تم إضافة الزبون بنجاح!')
    setSaving(false)
    navigate('/customers')
  }

  const fieldCard = (icon: React.ReactNode, color: string, title: string, children: React.ReactNode) => (
    <div className="field-card" style={{
      background: '#fff', borderRadius: 14, padding: '20px 24px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      borderRight: `4px solid ${color}`,
      transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
      marginBottom: 16
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

  return (
    <div>
      <div className="add-header" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16, padding: '24px 32px', marginBottom: 24, color: '#fff',
        boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 24 }}>
            <UserAddOutlined style={{ marginLeft: 10 }} />إضافة زبون جديد
          </h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 13 }}>أدخل بيانات الزبون الجديد</p>
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
                <Form.Item name="full_name" label="اسم الزبون الرباعي"
                  rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}>
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
                {/* Platform binding checkbox */}
                <Form.Item name="link_to_platform" valuePropName="checked" style={{ marginBottom: 8 }}>
                  <Checkbox><LinkOutlined /> ربط الزبون بمنصة</Checkbox>
                </Form.Item>
                {linkToPlatform && (
                  isAdmin ? (
                    <Form.Item name="platform_name" label="اسم المنصة"
                      rules={[{ required: true, message: 'اختر المنصة' }]}>
                      <Select allowClear placeholder="اختر المنصة">
                        {platforms.map(p => <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  ) : (
                    <Form.Item label="اسم المنصة">
                      <Input value={user?.platform_name} disabled style={{ background: '#f5f5f5' }} />
                    </Form.Item>
                  )
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
          </Col>

          <Col xs={24} lg={12}>
            {fieldCard(<CalendarOutlined />, '#f5576c', 'المدة والحالة', (
              <>
                <Form.Item name="months_count" label="عدد الأشهر">
                  <InputNumber min={0} placeholder="مثال: 18، 36، 10..." style={{ width: '100%' }}
                    addonAfter="شهر" />
                </Form.Item>
                <div style={{ fontSize: 12, color: '#999', background: '#fff1f0', padding: '8px 12px', borderRadius: 8, border: '1px solid #ffa39e', marginBottom: 12 }}>
                  💡 سيتم إنشاء تذكير تلقائي قبل شهرين من انتهاء المدة (محسوبة من تاريخ الإضافة)
                </div>
                <Form.Item name="status_note" label="الحالة">
                  <Input placeholder="مثال: تذبذب شمول، قيد المراجعة..." />
                </Form.Item>
              </>
            ))}

            {fieldCard(<BellOutlined />, '#faad14', 'تذكير إضافي', (
              <>
                <Form.Item name="has_reminder" valuePropName="checked">
                  <Checkbox>تفعيل تذكير يدوي بتاريخ محدد</Checkbox>
                </Form.Item>
                {hasReminder && (
                  <>
                    <Form.Item name="reminder_date" label="تاريخ التذكير"
                      rules={[{ required: true, message: 'اختر التاريخ' }]}>
                      <DatePicker style={{ width: '100%' }} placeholder="اختر تاريخ التذكير" />
                    </Form.Item>
                    <Form.Item name="reminder_text" label="نص التذكير"
                      rules={[{ required: true, message: 'اكتب نص التذكير' }]}>
                      <Input placeholder="مثال: تم شموله، متابعة الطلب..." />
                    </Form.Item>
                  </>
                )}
              </>
            ))}

            {fieldCard(<FileTextOutlined />, '#4facfe', 'ملاحظات', (
              <Form.Item name="notes" label="ملاحظات">
                <Input.TextArea rows={3} placeholder="ملاحظات إضافية عن الزبون..." />
              </Form.Item>
            ))}
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="primary" size="large" icon={<SaveOutlined />}
            onClick={handleSave} loading={saving}
            style={{
              borderRadius: 12, minWidth: 250, height: 50, fontSize: 18,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', boxShadow: '0 8px 24px rgba(102,126,234,0.4)'
            }} className="save-btn">
            حفظ الزبون
          </Button>
        </div>
      </Form>

      <style>{`
        .field-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .save-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 12px 32px rgba(102,126,234,0.5) !important; }
        .add-header:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(102,126,234,0.4) !important; }
      `}</style>
    </div>
  )
}
