import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Select, InputNumber, DatePicker, Button, Checkbox, message, Spin } from 'antd'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <div className="eyebrow" style={{ marginBottom: 12 }}>{title}</div>
    {children}
  </div>
)

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontSize: 11.5,
    fontWeight: 500,
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
    marginBottom: 6,
  }}>{children}</div>
)

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
  const [ministries, setMinistries] = useState<{ id: number; name: string }[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [enableDuration, setEnableDuration] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [createdAt, setCreatedAt] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')

  useEffect(() => {
    window.api.categories.list().then(setCategories).catch(() => {})
    window.api.platforms.list().then(setPlatforms).catch(() => {})
    window.api.ministries.list().then(setMinistries).catch(() => {})
    if (isAdmin) {
      window.api.users.list().then((users: any[]) => setAllUsers(users.filter(u => u.role !== 'admin'))).catch(() => {})
    }
    loadCustomer()
  }, [])

  const loadCustomer = async () => {
    setLoading(true)
    try {
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
      setCustomerName(values.full_name || '')
      setEnableDuration((values.months_count ?? 0) > 0)
      form.setFieldsValue(values)
    } catch (err) {
      console.error('[EditCustomer] Failed to load customer:', err)
    } finally { setLoading(false) }
  }

  const baseDate = createdAt ? dayjs(createdAt) : dayjs()
  const endDate = monthsCount && monthsCount > 0 ? baseDate.add(monthsCount, 'month') : null
  const autoReminderDate = endDate && reminderBefore && reminderBefore > 0
    ? endDate.subtract(reminderBefore, 'month') : null

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''

    if (!enableDuration) {
      values.months_count = 0
      values.status_note = ''
      values.reminder_before = undefined
    }

    if (values.months_count && values.months_count > 0 && values.reminder_before && values.reminder_before > 0) {
      const end = baseDate.add(values.months_count, 'month')
      const remind = end.subtract(values.reminder_before, 'month')
      values.reminder_date = remind.format('YYYY-MM-DD')
      values.reminder_text = `تذكير تلقائي - انتهاء المدة ${end.format('YYYY-MM-DD')}`
    }
    delete values.reminder_before

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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  const monthsPresets = [10, 18, 24, 36, 60]

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Back bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/customers')}>
          <Icon name="arrow_right" size={12} /> عودة لقائمة الزبائن
        </button>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'var(--info-bg)',
          color: 'var(--info)',
          border: '1px solid var(--info-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="edit" size={20} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>تعديل بيانات الزبون</h2>
          <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
            تحديث بيانات <strong style={{ color: 'var(--text-primary)' }}>{customerName}</strong>
          </p>
        </div>
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        {/* Personal info */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="المعلومات الشخصية">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Form.Item
                name="full_name"
                label={<FieldLabel>الاسم الرباعي <span style={{ color: 'var(--danger)' }}>*</span></FieldLabel>}
                rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="الاسم الرباعي" style={{ borderRadius: 10, height: 40 }} />
              </Form.Item>
              <Form.Item
                name="mother_name"
                label={<FieldLabel>اسم الأم</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="اسم الأم" style={{ borderRadius: 10, height: 40 }} />
              </Form.Item>
              <Form.Item
                name="phone_number"
                label={<FieldLabel>رقم الهاتف</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="0770 123 4567"
                  className="num"
                  style={{ borderRadius: 10, height: 40 }}
                  prefix={<Icon name="phone" size={13} style={{ color: 'var(--text-muted)' }} />}
                />
              </Form.Item>
              <Form.Item
                name="card_number"
                label={<FieldLabel>رقم البطاقة</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="198412345"
                  className="num"
                  style={{ borderRadius: 10, height: 40 }}
                  prefix={<Icon name="id" size={13} style={{ color: 'var(--text-muted)' }} />}
                />
              </Form.Item>
            </div>
          </Section>
        </div>

        {/* Classification */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="التصنيف والمنصة">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Form.Item
                name="ministry_name"
                label={<FieldLabel>اسم الوزارة</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  allowClear
                  placeholder={ministries.length === 0 ? 'لم تُضف وزارات بعد (تواصل مع المدير)' : 'اختر الوزارة'}
                  style={{ height: 40 }}
                  options={ministries.map(m => ({ value: m.name, label: m.name }))}
                  disabled={ministries.length === 0}
                />
              </Form.Item>
              <Form.Item
                name="category"
                label={<FieldLabel>الصنف</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Select
                  allowClear
                  placeholder="اختر صنف الزبون"
                  style={{ height: 40 }}
                  options={categories.map(c => ({ value: c.name, label: c.name }))}
                />
              </Form.Item>

              <Form.Item
                name="link_to_platform"
                valuePropName="checked"
                style={{ marginBottom: 0, gridColumn: '1 / -1' }}
              >
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: 'var(--text-secondary)',
                  cursor: 'pointer', userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={linkToPlatform}
                    onChange={e => form.setFieldValue('link_to_platform', e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: 'var(--brand)' }}
                  />
                  <Icon name="link" size={13} /> ربط الزبون بمنصة محددة
                </label>
              </Form.Item>

              {linkToPlatform && (
                <Form.Item
                  name="platform_name"
                  label={<FieldLabel>اسم المنصة <span style={{ color: 'var(--danger)' }}>*</span></FieldLabel>}
                  rules={[{ required: true, message: 'اختر المنصة' }]}
                  style={{ marginBottom: 0, gridColumn: '1 / -1' }}
                >
                  <Select allowClear placeholder="اختر المنصة" style={{ height: 40 }}>
                    {platforms.map(p => <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              )}

              {isAdmin && (
                <Form.Item
                  name="user_id"
                  label={<FieldLabel>الموظف المسؤول</FieldLabel>}
                  style={{ marginBottom: 0, gridColumn: '1 / -1' }}
                >
                  <Select allowClear placeholder="اختر الموظف" style={{ height: 40 }}>
                    <Select.Option key={user?.id} value={user?.id}>إليّ (الأدمن)</Select.Option>
                    {allUsers.map(u => <Select.Option key={u.id} value={u.id}>{u.display_name}</Select.Option>)}
                  </Select>
                </Form.Item>
              )}
            </div>
          </Section>
        </div>

        {/* Duration */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="المدة والحالة (اختياري)">
            <Checkbox
              checked={enableDuration}
              onChange={e => setEnableDuration(e.target.checked)}
              style={{ marginBottom: enableDuration ? 16 : 0 }}
            >
              تفعيل مدة اشتراك وحالة للزبون
            </Checkbox>
            {enableDuration && (<>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Form.Item
                name="months_count"
                label={<FieldLabel>المدة (بالأشهر)</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {monthsPresets.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => form.setFieldValue('months_count', m)}
                        className={`btn btn--sm ${monthsCount === m ? 'btn--primary' : 'btn--ghost'}`}
                        style={{ flex: 1, height: 32 }}
                      >
                        <span className="num">{m}</span>
                      </button>
                    ))}
                  </div>
                  <InputNumber
                    min={1}
                    placeholder="أو أدخل عددًا مخصصًا"
                    style={{ width: '100%', borderRadius: 10, height: 40 }}
                    value={monthsCount}
                    onChange={v => form.setFieldValue('months_count', v)}
                    addonAfter="شهر"
                  />
                </div>
              </Form.Item>

              <Form.Item
                name="status_note"
                label={<FieldLabel>الحالة</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="مثال: نشط، قيد المراجعة..." style={{ borderRadius: 10, height: 40 }} />
              </Form.Item>
            </div>

            {monthsCount && monthsCount > 0 && (
              <div style={{
                marginTop: 14, padding: 14, borderRadius: 10,
                background: 'var(--info-bg)', border: '1px solid var(--info-border)',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
              }}>
                <div>
                  <div className="label-sm" style={{ marginBottom: 4 }}>تاريخ الإنشاء</div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {baseDate.format('YYYY-MM-DD')}
                  </div>
                </div>
                <div>
                  <div className="label-sm" style={{ marginBottom: 4 }}>تاريخ الانتهاء</div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>
                    {endDate?.format('YYYY-MM-DD')}
                  </div>
                </div>
              </div>
            )}

            {monthsCount && monthsCount > 0 && (
              <div style={{ marginTop: 14 }}>
                <Form.Item
                  name="reminder_before"
                  label={<FieldLabel>تذكير قبل الانتهاء بـ</FieldLabel>}
                  style={{ marginBottom: 0 }}
                >
                  <InputNumber
                    min={1}
                    max={Math.max(1, (monthsCount || 1) - 1)}
                    placeholder="مثال: 2"
                    style={{ width: '100%', borderRadius: 10, height: 40 }}
                    addonAfter="شهر"
                  />
                </Form.Item>

                {autoReminderDate && (
                  <div style={{
                    marginTop: 14, padding: '12px 14px', borderRadius: 10,
                    background: 'var(--brand-tint)', border: '1px solid var(--brand-tint-hi)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <Icon name="sparkles" size={14} style={{ color: 'var(--brand)' }} />
                    <div style={{ fontSize: 12.5 }}>
                      تذكير تلقائي بتاريخ{' '}
                      <strong className="num" style={{ color: 'var(--brand)' }}>
                        {autoReminderDate.format('YYYY-MM-DD')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>)}
          </Section>
        </div>

        {/* Manual reminder */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="تذكير يدوي إضافي (اختياري)">
            <Form.Item name="has_reminder" valuePropName="checked" style={{ marginBottom: 0 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, color: 'var(--text-secondary)',
                cursor: 'pointer', userSelect: 'none',
              }}>
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={e => form.setFieldValue('has_reminder', e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: 'var(--brand)' }}
                />
                <Icon name="bell" size={13} /> تفعيل تذكير يدوي بتاريخ محدد
              </label>
            </Form.Item>

            {hasReminder && (
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
                <Form.Item
                  name="manual_reminder_date"
                  label={<FieldLabel>تاريخ التذكير <span style={{ color: 'var(--danger)' }}>*</span></FieldLabel>}
                  rules={[{ required: true, message: 'اختر التاريخ' }]}
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker style={{ width: '100%', borderRadius: 10, height: 40 }} placeholder="اختر تاريخ التذكير" />
                </Form.Item>
                <Form.Item
                  name="manual_reminder_text"
                  label={<FieldLabel>نص التذكير <span style={{ color: 'var(--danger)' }}>*</span></FieldLabel>}
                  rules={[{ required: true, message: 'اكتب نص التذكير' }]}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="مثال: متابعة الوثائق..." style={{ borderRadius: 10, height: 40 }} />
                </Form.Item>
              </div>
            )}
          </Section>
        </div>

        {/* Notes */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="ملاحظات">
            <Form.Item name="notes" style={{ marginBottom: 0 }}>
              <Input.TextArea rows={4} placeholder="أي ملاحظات خاصة بالزبون..." style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.7 }} />
            </Form.Item>
          </Section>
        </div>

        {/* Action bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: 16, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 14,
          position: 'sticky', bottom: 16, zIndex: 5,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <button className="btn btn--ghost" onClick={() => navigate('/customers')} type="button">
            إلغاء
          </button>
          <div style={{ flex: 1 }} />
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            style={{
              height: 42, borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              background: 'var(--brand)',
              borderColor: 'var(--brand-strong)',
              padding: '0 24px',
            }}
          >
            <Icon name="check" size={13} stroke={2.2} style={{ marginInlineEnd: 6 }} />
            حفظ التعديلات
          </Button>
        </div>
      </Form>
    </div>
  )
}
