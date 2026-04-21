import React from 'react'
import { Modal, Form, Input, Select, Switch, Divider, FormInstance } from 'antd'

const SECTIONS = [
  { key: 'customers', label: 'زبائن' },
  { key: 'invoices', label: 'فواتير' },
  { key: 'reports', label: 'تقارير' },
  { key: 'import', label: 'استيراد' },
  { key: 'export', label: 'تصدير' },
  { key: 'backup', label: 'نسخ احتياطي' },
  { key: 'edit_customer', label: 'تعديل زبون' },
  { key: 'delete_customer', label: 'حذف زبون' },
]

interface Props {
  open: boolean
  editUser: any | null
  form: FormInstance
  platforms: any[]
  onSave: () => void
  onCancel: () => void
}

export default function UserFormModal({ open, editUser, form, platforms, onSave, onCancel }: Props) {
  return (
    <Modal
      title={editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      okText="حفظ"
      cancelText="إلغاء"
      width={560}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark={false}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            name="username"
            label="اسم المستخدم"
            rules={[{ required: true, message: 'أدخل اسم المستخدم' }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="admin, user1..." disabled={!!editUser} style={{ borderRadius: 10, height: 40 }} />
          </Form.Item>
          <Form.Item
            name="display_name"
            label="الاسم الظاهر"
            rules={[{ required: true, message: 'أدخل الاسم' }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="مثال: أحمد محمد" style={{ borderRadius: 10, height: 40 }} />
          </Form.Item>
        </div>

        <Form.Item
          name="password"
          label={editUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}
          rules={editUser ? [] : [{ required: true, message: 'أدخل كلمة المرور' }]}
          style={{ marginBottom: 12 }}
        >
          <Input.Password placeholder="كلمة المرور" style={{ borderRadius: 10, height: 40 }} />
        </Form.Item>

        <Form.Item name="role" label="الدور" style={{ marginBottom: 12 }}>
          <Select
            style={{ height: 40 }}
            options={[
              { value: 'admin', label: 'أدمن (كل الصلاحيات)' },
              { value: 'user', label: 'موظف (صلاحيات محددة)' },
            ]}
          />
        </Form.Item>

        <Form.Item name="platform_name" label="المنصة الافتراضية (اختياري)" style={{ marginBottom: 12 }}>
          <Select
            allowClear
            placeholder="اختر المنصة"
            style={{ height: 40 }}
            options={platforms.map(p => ({ value: p.name, label: p.name }))}
          />
        </Form.Item>

        <Divider style={{ margin: '4px 0 12px' }}>الصلاحيات (للموظف فقط)</Divider>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SECTIONS.map(s => (
            <Form.Item
              key={s.key}
              name={`perm_${s.key}`}
              valuePropName="checked"
              style={{ marginBottom: 4 }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <Switch size="small" />
                {s.label}
              </label>
            </Form.Item>
          ))}
        </div>
      </Form>
    </Modal>
  )
}
