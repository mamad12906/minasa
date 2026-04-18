import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Select, InputNumber, DatePicker, Button, message } from 'antd'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'

// ========= Reusable form primitives =========
const Section = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
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

export default function AddCustomer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form] = Form.useForm()
  const hasReminder = Form.useWatch('has_reminder', form)
  const linkToPlatform = Form.useWatch('link_to_platform', form)
  const monthsCount = Form.useWatch('months_count', form)
  const reminderBefore = Form.useWatch('reminder_before', form)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [platforms, setPlatforms] = useState<{ id: number; name: string }[]>([])
  const [ministries, setMinistries] = useState<{ id: number; name: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.api.categories.list().then(setCategories).catch(() => {})
    window.api.platforms.list().then(setPlatforms).catch(() => {})
    window.api.ministries.list().then(setMinistries).catch(() => {})
  }, [])

  const endDate = monthsCount && monthsCount > 0
    ? dayjs().add(monthsCount, 'month')
    : null
  const autoReminderDate = endDate && reminderBefore && reminderBefore > 0
    ? endDate.subtract(reminderBefore, 'month')
    : null

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''

    if (values.months_count && values.months_count > 0 && values.reminder_before && values.reminder_before > 0) {
      const end = dayjs().add(values.months_count, 'month')
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

    if (!values.link_to_platform) { values.platform_name = '' }
    else if (!isAdmin && user?.platform_name) { values.platform_name = user.platform_name }
    delete values.link_to_platform
    values.user_id = user?.id || 0
    await window.api.customer.create(values)
    message.success('تم إضافة الزبون بنجاح!')
    setSaving(false)
    navigate('/customers')
  }

  const monthsPresets = [3, 6, 12, 24, 36]

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Top back-bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/customers')}>
          <Icon name="arrow_right" size={12} /> عودة لقائمة الزبائن
        </button>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'var(--brand-tint)',
          color: 'var(--brand)',
          border: '1px solid var(--brand-tint-hi)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="plus" size={20} stroke={2} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>إضافة زبون جديد</h2>
          <p style={{ fontSize: 12.5, marginTop: 2, color: 'var(--text-muted)' }}>
            املأ الحقول المطلوبة. الحقول المُعلّمة بـ <span style={{ color: 'var(--danger)' }}>*</span> إلزامية.
          </p>
        </div>
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        {/* ============ Personal info ============ */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="المعلومات الشخصية">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Form.Item
                name="full_name"
                label={<FieldLabel>الاسم الرباعي <span style={{ color: 'var(--danger)' }}>*</span></FieldLabel>}
                rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="مثال: سارة عبدالله العتيبي الحربي" style={{ borderRadius: 10, height: 40 }} />
              </Form.Item>
              <Form.Item
                name="mother_name"
                label={<FieldLabel>اسم الأم</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="مثال: أم عبدالله" style={{ borderRadius: 10, height: 40 }} />
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

        {/* ============ Classification ============ */}
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                  <input
                    type="checkbox"
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
                  <Select
                    allowClear
                    placeholder="اختر المنصة"
                    style={{ height: 40 }}
                  >
                    {platforms.map(p => <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              )}
            </div>
          </Section>
        </div>

        {/* ============ Duration & auto reminder ============ */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="المدة والحالة">
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
                <Input placeholder="مثال: نشط، قيد المراجعة، معلّق..." style={{ borderRadius: 10, height: 40 }} />
              </Form.Item>
            </div>

            {/* Auto-computed dates */}
            {monthsCount && monthsCount > 0 && (
              <div style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 10,
                background: 'var(--info-bg)',
                border: '1px solid var(--info-border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
              }}>
                <div>
                  <div className="label-sm" style={{ marginBottom: 4 }}>تاريخ اليوم</div>
                  <div className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {dayjs().format('YYYY-MM-DD')}
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
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--brand-tint)',
                    border: '1px solid var(--brand-tint-hi)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <Icon name="sparkles" size={14} style={{ color: 'var(--brand)' }} />
                    <div style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>
                      سيتم إنشاء تذكير تلقائي بتاريخ{' '}
                      <strong className="num" style={{ color: 'var(--brand)' }}>
                        {autoReminderDate.format('YYYY-MM-DD')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* ============ Manual reminder ============ */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="تذكير يدوي إضافي (اختياري)">
            <Form.Item name="has_reminder" valuePropName="checked" style={{ marginBottom: 0 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
              }}>
                <input
                  type="checkbox"
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
                  <Input placeholder="مثال: متابعة الوثائق، تأكيد الشمول..." style={{ borderRadius: 10, height: 40 }} />
                </Form.Item>
              </div>
            )}
          </Section>
        </div>

        {/* ============ Notes ============ */}
        <div className="card" style={{ padding: 24, marginBottom: 14 }}>
          <Section title="ملاحظات">
            <Form.Item name="notes" style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={4}
                placeholder="أي ملاحظات خاصة بالزبون..."
                style={{ borderRadius: 10, fontSize: 13, lineHeight: 1.7 }}
              />
            </Form.Item>
          </Section>
        </div>

        {/* ============ Info tip ============ */}
        <div style={{
          padding: 14,
          background: 'var(--brand-tint)',
          border: '1px solid var(--brand-tint-hi)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 16,
        }}>
          <Icon name="sparkles" size={14} stroke={2} style={{ color: 'var(--brand)', marginTop: 2 }} />
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-primary)' }}>
            سيتم إنشاء تذكير تلقائي قبل انتهاء المدة إذا حددت "تذكير قبل الانتهاء".
            يمكنك تعديله لاحقًا من صفحة الزبون.
          </div>
        </div>

        {/* ============ Action bar ============ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 16,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          position: 'sticky',
          bottom: 16,
          zIndex: 5,
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
              height: 42,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              background: 'var(--brand)',
              borderColor: 'var(--brand-strong)',
              padding: '0 24px',
            }}
          >
            <Icon name="check" size={13} stroke={2.2} style={{ marginInlineEnd: 6 }} />
            إضافة الزبون
          </Button>
        </div>
      </Form>
    </div>
  )
}
