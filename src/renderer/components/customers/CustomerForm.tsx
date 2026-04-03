import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, InputNumber, DatePicker, Checkbox, Divider } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Customer, CustomerInput, CustomColumn } from '../../types'
import { useAuth } from '../../App'

interface Props {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onSave: (input: CustomerInput) => Promise<void>
  platforms: string[]
  categories: string[]
  customColumns: CustomColumn[]
}

export default function CustomerForm({ open, customer, onClose, onSave, platforms, categories, customColumns }: Props) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [form] = Form.useForm()
  const hasReminder = Form.useWatch('has_reminder', form)
  const [adminCategories, setAdminCategories] = useState<{ id: number; name: string }[]>([])
  const [adminPlatforms, setAdminPlatforms] = useState<{ id: number; name: string }[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    window.api.categories.list().then(setAdminCategories).catch(() => {})
    if (isAdmin) {
      window.api.platforms.list().then(setAdminPlatforms).catch(() => {})
      window.api.users.list().then((users: any[]) => setAllUsers(users.filter(u => u.role !== 'admin'))).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (customer) {
        const values: any = { ...customer }
        for (const col of customColumns) {
          if (col.column_type === 'date' && values[col.column_name]) {
            values[col.column_name] = dayjs(values[col.column_name])
          }
        }
        if (values.reminder_date) {
          values.has_reminder = true
          values.reminder_date = dayjs(values.reminder_date)
        }
        form.setFieldsValue(values)
      } else {
        form.resetFields()
        // Non-admin: auto-fill platform from user account
        if (!isAdmin && user?.platform_name) {
          form.setFieldsValue({ platform_name: user.platform_name })
        }
      }
    }
  }, [open, customer])

  const handleOk = async () => {
    const values = await form.validateFields()
    // Convert tags arrays to strings
    if (Array.isArray(values.platform_name)) values.platform_name = values.platform_name[0] || ''
    if (Array.isArray(values.category)) values.category = values.category[0] || ''
    // Date fields
    for (const col of customColumns) {
      if (col.column_type === 'date' && values[col.column_name]) {
        values[col.column_name] = values[col.column_name].format('YYYY-MM-DD')
      }
    }
    if (values.reminder_date) {
      values.reminder_date = values.reminder_date.format('YYYY-MM-DD')
    }
    if (!values.has_reminder) {
      values.reminder_date = ''
      values.reminder_text = ''
    }
    delete values.has_reminder
    // Non-admin: force platform from user
    if (!isAdmin && user?.platform_name) {
      values.platform_name = user.platform_name
    }
    await onSave(values)
    form.resetFields()
  }

  const renderCustomField = (col: CustomColumn) => {
    switch (col.column_type) {
      case 'number':
        return <InputNumber placeholder={`أدخل ${col.display_name}`} style={{ width: '100%' }} />
      case 'date':
        return <DatePicker placeholder={`اختر ${col.display_name}`} style={{ width: '100%' }} />
      default:
        return <Input placeholder={`أدخل ${col.display_name}`} />
    }
  }

  // Category options from admin-managed list
  const catOptions = adminCategories.map(c => ({ value: c.name, label: c.name }))

  return (
    <Modal
      title={customer ? 'تعديل زبون' : 'إضافة زبون جديد'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="حفظ"
      cancelText="إلغاء"
      width={620}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16, maxHeight: '65vh', overflow: 'auto', paddingLeft: 8 }}>
        <Form.Item name="full_name" label="اسم الزبون الرباعي" rules={[{ required: true, message: 'يرجى إدخال الاسم' }]}>
          <Input placeholder="أدخل اسم الزبون الرباعي" />
        </Form.Item>

        <Form.Item name="mother_name" label="اسم الأم">
          <Input placeholder="أدخل اسم الأم" />
        </Form.Item>

        <Form.Item name="phone_number" label="رقم الهاتف">
          <Input placeholder="أدخل رقم الهاتف" />
        </Form.Item>

        <Form.Item name="card_number" label="رقم بطاقة الزبون">
          <Input placeholder="أدخل رقم البطاقة" />
        </Form.Item>

        {/* Platform: admin chooses, user sees auto-filled read-only */}
        {isAdmin ? (
          <Form.Item name="platform_name" label="اسم المنصة">
            <Select allowClear placeholder="اختر المنصة">
              {adminPlatforms.map(p => (
                <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <Form.Item name="platform_name" label="اسم المنصة">
            <Input disabled />
          </Form.Item>
        )}

        <Form.Item name="ministry_name" label="اسم الوزارة">
          <Input placeholder="أدخل اسم الوزارة" />
        </Form.Item>

        {/* Category: choose from admin-managed list */}
        <Form.Item name="category" label="صنف الزبون">
          <Select allowClear placeholder="اختر صنف الزبون" options={catOptions} />
        </Form.Item>

        {isAdmin && customer && (
          <Form.Item name="user_id" label="نقل الزبون إلى موظف">
            <Select allowClear placeholder="اختر الموظف">
              <Select.Option key={user?.id} value={user?.id}>📌 إليّ (الأدمن)</Select.Option>
              {allUsers.map(u => <Select.Option key={u.id} value={u.id}>{u.display_name}</Select.Option>)}
            </Select>
          </Form.Item>
        )}

        <Form.Item name="status_note" label="الحالة">
          <Input.TextArea placeholder="مثال: تذبذب شمول، قيد المراجعة..." rows={2} />
        </Form.Item>

        <Divider style={{ margin: '12px 0' }}><BellOutlined /> تذكير</Divider>

        <Form.Item name="has_reminder" valuePropName="checked">
          <Checkbox>تفعيل تذكير بتاريخ محدد</Checkbox>
        </Form.Item>

        {hasReminder && (
          <>
            <Form.Item name="reminder_date" label="تاريخ التذكير"
              rules={[{ required: true, message: 'يرجى اختيار تاريخ التذكير' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="اختر تاريخ التذكير" />
            </Form.Item>
            <Form.Item name="reminder_text" label="نص التذكير"
              rules={[{ required: true, message: 'يرجى كتابة نص التذكير' }]}>
              <Input.TextArea placeholder="مثال: تم شموله، مراجعة الملف..." rows={2} />
            </Form.Item>
          </>
        )}

        {customColumns.map(col => (
          <Form.Item key={col.id} name={col.column_name} label={col.display_name}>
            {renderCustomField(col)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  )
}
