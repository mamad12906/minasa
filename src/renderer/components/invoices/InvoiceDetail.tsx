import React, { useEffect, useState } from 'react'
import { Drawer, Descriptions, Table, Tag, Button, Form, InputNumber, DatePicker, Input, Space, Popconfirm, message, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Invoice, Payment } from '../../types'

interface Props {
  invoice: Invoice | null
  onClose: () => void
}

export default function InvoiceDetail({ invoice, onClose }: Props) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (invoice) loadPayments()
  }, [invoice])

  const loadPayments = async () => {
    if (!invoice) return
    setLoading(true)
    const data = await window.api.invoice.payments(invoice.id)
    setPayments(data)
    setLoading(false)
  }

  const addPayment = async () => {
    if (!invoice) return
    const values = await form.validateFields()
    await window.api.payment.create({
      invoice_id: invoice.id,
      payment_date: values.payment_date.format('YYYY-MM-DD'),
      amount: values.amount,
      month_number: values.month_number,
      notes: values.notes || ''
    })
    message.success('تم تسجيل الدفعة')
    form.resetFields()
    setShowPaymentForm(false)
    loadPayments()
  }

  const deletePayment = async (id: number) => {
    await window.api.payment.delete(id)
    message.success('تم حذف الدفعة')
    loadPayments()
  }

  const statusColors: Record<string, string> = {
    'نشطة': 'blue',
    'مكتملة': 'green',
    'متأخرة': 'red',
    'ملغاة': 'default'
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = (invoice?.total_amount || 0) - totalPaid

  return (
    <Drawer
      title="تفاصيل الفاتورة"
      open={!!invoice}
      onClose={onClose}
      width={650}
      placement="left"
    >
      {invoice && (
        <>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="رقم الفاتورة">{invoice.invoice_number}</Descriptions.Item>
            <Descriptions.Item label="اسم الزبون">{invoice.customer_name}</Descriptions.Item>
            <Descriptions.Item label="المبلغ الكلي">{invoice.total_amount?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="عدد الأشهر">{invoice.total_months}</Descriptions.Item>
            <Descriptions.Item label="القسط الشهري">{invoice.monthly_deduction?.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="تاريخ الإنشاء">{invoice.creation_date}</Descriptions.Item>
            <Descriptions.Item label="الحالة">
              <Tag color={statusColors[invoice.status] || 'default'}>{invoice.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="المدفوع">
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{totalPaid.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="المتبقي">
              <span style={{ color: remaining > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
                {remaining.toLocaleString()}
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>سجل الدفعات</h3>
            <Button type="primary" size="small" icon={<PlusOutlined />}
              onClick={() => setShowPaymentForm(true)}>
              تسجيل دفعة
            </Button>
          </div>

          {showPaymentForm && (
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <Form form={form} layout="inline" style={{ gap: 8 }}>
                <Form.Item name="amount" rules={[{ required: true }]}>
                  <InputNumber placeholder="المبلغ" min={0} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="month_number" rules={[{ required: true }]}>
                  <InputNumber placeholder="رقم الشهر" min={1} style={{ width: 100 }} />
                </Form.Item>
                <Form.Item name="payment_date" rules={[{ required: true }]}>
                  <DatePicker placeholder="التاريخ" />
                </Form.Item>
                <Form.Item name="notes">
                  <Input placeholder="ملاحظات" style={{ width: 120 }} />
                </Form.Item>
                <Space>
                  <Button type="primary" onClick={addPayment} size="small">حفظ</Button>
                  <Button onClick={() => setShowPaymentForm(false)} size="small">إلغاء</Button>
                </Space>
              </Form>
            </div>
          )}

          <Table
            dataSource={payments}
            rowKey="id"
            size="small"
            loading={loading}
            pagination={false}
            columns={[
              { title: 'الشهر', dataIndex: 'month_number', width: 60 },
              { title: 'المبلغ', dataIndex: 'amount', render: (v: number) => v?.toLocaleString() },
              { title: 'التاريخ', dataIndex: 'payment_date' },
              { title: 'ملاحظات', dataIndex: 'notes', ellipsis: true },
              {
                title: '',
                key: 'action',
                width: 40,
                render: (_: any, record: Payment) => (
                  <Popconfirm title="حذف الدفعة؟" onConfirm={() => deletePayment(record.id)}
                    okText="نعم" cancelText="لا">
                    <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )
              }
            ]}
          />
        </>
      )}
    </Drawer>
  )
}
