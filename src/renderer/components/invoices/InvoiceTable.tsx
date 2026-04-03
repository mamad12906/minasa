import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Input, Space, Card, Popconfirm, message, Select, Row, Col, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { Invoice } from '../../types'
import InvoiceForm from './InvoiceForm'
import InvoiceDetail from './InvoiceDetail'

const STATUS_OPTIONS = [
  { value: 'نشطة', label: 'نشطة' },
  { value: 'مكتملة', label: 'مكتملة' },
  { value: 'متأخرة', label: 'متأخرة' },
  { value: 'ملغاة', label: 'ملغاة' }
]

const statusColors: Record<string, string> = {
  'نشطة': 'blue',
  'مكتملة': 'green',
  'متأخرة': 'red',
  'ملغاة': 'default'
}

export default function InvoiceTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    const result = await window.api.invoice.list({ page, pageSize, search, status })
    setInvoices(result.data)
    setTotal(result.total)
    setLoading(false)
  }, [page, pageSize, search, status])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  const handleSave = async (input: any) => {
    if (editInvoice) {
      await window.api.invoice.update(editInvoice.id, input)
      message.success('تم تعديل الفاتورة بنجاح')
    } else {
      await window.api.invoice.create(input)
      message.success('تم إضافة الفاتورة بنجاح')
    }
    setFormOpen(false)
    setEditInvoice(null)
    loadInvoices()
  }

  const handleDelete = async (id: number) => {
    await window.api.invoice.delete(id)
    message.success('تم حذف الفاتورة')
    loadInvoices()
  }

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1
    },
    { title: 'رقم الفاتورة', dataIndex: 'invoice_number', key: 'invoice_number' },
    { title: 'اسم الزبون', dataIndex: 'customer_name', key: 'customer_name', ellipsis: true },
    { title: 'المنصة', dataIndex: 'platform_name', key: 'platform_name',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-'
    },
    { title: 'المبلغ الكلي', dataIndex: 'total_amount', key: 'total_amount',
      render: (v: number) => v?.toLocaleString()
    },
    { title: 'القسط الشهري', dataIndex: 'monthly_deduction', key: 'monthly_deduction',
      render: (v: number) => v?.toLocaleString()
    },
    { title: 'عدد الأشهر', dataIndex: 'total_months', key: 'total_months' },
    { title: 'التاريخ', dataIndex: 'creation_date', key: 'creation_date' },
    {
      title: 'الحالة', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 150,
      render: (_: any, record: Invoice) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}
            onClick={() => setDetailInvoice(record)} />
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditInvoice(record); setFormOpen(true) }} />
          <Popconfirm title="هل أنت متأكد من الحذف؟" onConfirm={() => handleDelete(record.id)}
            okText="نعم" cancelText="لا">
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h2 style={{ margin: 0 }}>إدارة الفواتير</h2>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditInvoice(null); setFormOpen(true) }}>
              إضافة فاتورة
            </Button>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={14}>
            <Input
              placeholder="بحث برقم الفاتورة أو اسم الزبون أو الهاتف..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={10}>
            <Select
              placeholder="حالة الفاتورة"
              value={status}
              onChange={v => { setStatus(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
          </Col>
        </Row>

        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100'],
            showTotal: (total) => `إجمالي: ${total} فاتورة`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
          size="middle"
          scroll={{ x: 1000 }}
        />
      </Card>

      <InvoiceForm
        open={formOpen}
        invoice={editInvoice}
        onClose={() => { setFormOpen(false); setEditInvoice(null) }}
        onSave={handleSave}
      />

      <InvoiceDetail
        invoice={detailInvoice}
        onClose={() => setDetailInvoice(null)}
      />
    </div>
  )
}
