import React, { useEffect, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, DatePicker } from 'antd'
import dayjs from 'dayjs'
import type { Invoice, InvoiceInput, Customer } from '../../types'

interface Props {
  open: boolean
  invoice: Invoice | null
  onClose: () => void
  onSave: (input: InvoiceInput) => Promise<void>
}

const STATUS_OPTIONS = [
  { value: 'نشطة', label: 'نشطة' },
  { value: 'مكتملة', label: 'مكتملة' },
  { value: 'متأخرة', label: 'متأخرة' },
  { value: 'ملغاة', label: 'ملغاة' }
]

export default function InvoiceForm({ open, invoice, onClose, onSave }: Props) {
  const [form] = Form.useForm()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchText, setSearchText] = useState('')

  // Load customers when modal opens AND when search changes
  useEffect(() => {
    if (open) {
      loadCustomers()
    }
  }, [open, searchText])

  const loadCustomers = async () => {
    const result = await window.api.customer.list({
      page: 1,
      pageSize: 100,
      search: searchText
    })
    setCustomers(result.data)
  }

  useEffect(() => {
    if (open) {
      if (invoice) {
        form.setFieldsValue({
          ...invoice,
          creation_date: invoice.creation_date ? dayjs(invoice.creation_date) : null
        })
      } else {
        form.resetFields()
        form.setFieldsValue({ status: 'نشطة' })
      }
    }
  }, [open, invoice])

  const handleOk = async () => {
    const values = await form.validateFields()
    await onSave({
      ...values,
      creation_date: values.creation_date ? values.creation_date.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0]
    })
    form.resetFields()
  }

  const handleMonthsOrAmountChange = () => {
    const totalAmount = form.getFieldValue('total_amount')
    const totalMonths = form.getFieldValue('total_months')
    if (totalAmount && totalMonths && totalMonths > 0) {
      form.setFieldValue('monthly_deduction', Math.round((totalAmount / totalMonths) * 100) / 100)
    }
  }

  return (
    <Modal
      title={invoice ? 'تعديل فاتورة' : 'إضافة فاتورة جديدة'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="حفظ"
      cancelText="إلغاء"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="customer_id" label="الزبون" rules={[{ required: true, message: 'يرجى اختيار الزبون' }]}>
          <Select
            showSearch
            placeholder="ابحث عن الزبون بالاسم أو الهاتف"
            filterOption={false}
            onSearch={setSearchText}
            notFoundContent={searchText ? 'لا يوجد زبون بهذا الاسم' : 'اكتب للبحث...'}
            options={customers.map(c => ({
              value: c.id,
              label: `${c.full_name} - ${c.phone_number || 'بدون هاتف'}`
            }))}
          />
        </Form.Item>

        <Form.Item name="invoice_number" label="رقم الفاتورة" rules={[{ required: true, message: 'يرجى إدخال رقم الفاتورة' }]}>
          <Input placeholder="أدخل رقم الفاتورة" />
        </Form.Item>

        <Form.Item name="total_amount" label="المبلغ الكلي" rules={[{ required: true, message: 'يرجى إدخال المبلغ' }]}>
          <InputNumber placeholder="0" style={{ width: '100%' }} min={0} onChange={handleMonthsOrAmountChange} />
        </Form.Item>

        <Form.Item name="total_months" label="عدد الأشهر" rules={[{ required: true, message: 'يرجى إدخال عدد الأشهر' }]}>
          <InputNumber placeholder="1" style={{ width: '100%' }} min={1} onChange={handleMonthsOrAmountChange} />
        </Form.Item>

        <Form.Item name="monthly_deduction" label="الاستقطاع الشهري">
          <InputNumber placeholder="0" style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item name="creation_date" label="تاريخ إنشاء الفاتورة" rules={[{ required: true, message: 'يرجى اختيار التاريخ' }]}>
          <DatePicker style={{ width: '100%' }} placeholder="اختر التاريخ" />
        </Form.Item>

        <Form.Item name="status" label="حالة الفاتورة" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
