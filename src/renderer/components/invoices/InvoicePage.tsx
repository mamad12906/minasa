import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Space, Tag, Row, Col, Modal, Form, InputNumber, DatePicker, Select, Popconfirm, message, Drawer, Empty } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

// Invoice IPC through preload safeInvoke
const inv = {
  list: (p: any) => (window as any).__localApi?.excel ? // check if localApi exists
    (window as any).__ipcDirect?.('invoice:list', p) : Promise.resolve({ data: [], total: 0 }),
  create: (input: any) => (window as any).__ipcDirect?.('invoice:create', input),
  update: (id: number, input: any) => (window as any).__ipcDirect?.('invoice:update', id, input),
  delete: (id: number) => (window as any).__ipcDirect?.('invoice:delete', id),
  payments: (id: number) => (window as any).__ipcDirect?.('invoice:payments', id),
  addPayment: (input: any) => (window as any).__ipcDirect?.('payment:create', input),
  deletePayment: (id: number) => (window as any).__ipcDirect?.('payment:delete', id),
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState<any>(null)
  const [form] = Form.useForm()
  const [customers, setCustomers] = useState<any[]>([])
  const [paymentDrawer, setPaymentDrawer] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [payForm] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const res = await inv.list({ page, pageSize, search, status: statusFilter })
      setInvoices(res?.data || []); setTotal(res?.total || 0)
    } catch { setInvoices([]); setTotal(0) }
    setLoading(false)
  }

  const loadCustomers = async () => {
    const res = await window.api.customer.list({ page: 1, pageSize: 10000 })
    setCustomers(res?.data || [])
  }

  useEffect(() => { load(); loadCustomers() }, [page, pageSize, search, statusFilter])

  const handleSave = async () => {
    const vals = await form.validateFields()
    vals.creation_date = vals.creation_date?.format('YYYY-MM-DD') || ''
    try {
      if (editInvoice) { await inv.update(editInvoice.id, vals); message.success('تم تعديل الفاتورة') }
      else { await inv.create(vals); message.success('تم إنشاء الفاتورة') }
      setModalOpen(false); setEditInvoice(null); form.resetFields(); load()
    } catch (e: any) { message.error(e?.message || 'خطأ') }
  }

  const handleDelete = async (id: number) => {
    try { await inv.delete(id); message.success('تم حذف الفاتورة'); load() } catch {}
  }

  const openPayments = async (invoice: any) => {
    setPaymentDrawer(invoice)
    try { setPayments(await inv.payments(invoice.id) || []) } catch { setPayments([]) }
  }

  const addPayment = async () => {
    const vals = await payForm.validateFields()
    vals.invoice_id = paymentDrawer.id
    vals.payment_date = vals.payment_date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')
    try {
      await inv.addPayment(vals); message.success('تم تسجيل الدفعة')
      payForm.resetFields(); openPayments(paymentDrawer)
    } catch (e: any) { message.error(e?.message || 'خطأ') }
  }

  const openEdit = (r: any) => {
    setEditInvoice(r)
    form.setFieldsValue({ ...r, creation_date: dayjs(r.creation_date) })
    setModalOpen(true)
  }

  const statusColors: Record<string, string> = { 'نشطة': 'blue', 'مكتملة': 'green', 'متأخرة': 'red', 'ملغاة': 'default' }

  return (
    <div>
      <div className="page-header">
        <h2><DollarOutlined style={{ marginLeft: 8 }} />إدارة الفواتير</h2>
        <p>إنشاء ومتابعة الفواتير والدفعات</p>
      </div>

      <div className="hover-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col><h3 style={{ margin: 0, color: 'var(--text-primary)' }}>الفواتير</h3></Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditInvoice(null); form.resetFields(); form.setFieldsValue({ status: 'نشطة' }); setModalOpen(true) }}
              style={{ borderRadius: 8 }}>فاتورة جديدة</Button>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10}>
            <Input placeholder="بحث برقم الفاتورة أو اسم الزبون..." prefix={<SearchOutlined />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} allowClear />
          </Col>
          <Col xs={12} sm={6}>
            <Select placeholder="الحالة" value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }}
              allowClear style={{ width: '100%' }}
              options={[{ value: 'نشطة', label: 'نشطة' }, { value: 'مكتملة', label: 'مكتملة' }, { value: 'متأخرة', label: 'متأخرة' }, { value: 'ملغاة', label: 'ملغاة' }]} />
          </Col>
        </Row>

        <Table dataSource={invoices} rowKey="id" loading={loading} size="middle"
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: t => `${t} فاتورة`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }}
          columns={[
            { title: '#', key: 'i', width: 50, render: (_: any, __: any, i: number) => (page - 1) * pageSize + i + 1 },
            { title: 'رقم الفاتورة', dataIndex: 'invoice_number' },
            { title: 'الزبون', dataIndex: 'customer_name', render: (v: string) => <strong>{v}</strong> },
            { title: 'المبلغ', dataIndex: 'total_amount', render: (v: number) => v?.toLocaleString() },
            { title: 'القسط', dataIndex: 'monthly_deduction', render: (v: number) => v?.toLocaleString() },
            { title: 'الأشهر', dataIndex: 'total_months' },
            { title: 'الحالة', dataIndex: 'status', render: (v: string) => <Tag color={statusColors[v] || 'default'}>{v}</Tag> },
            { title: 'التاريخ', dataIndex: 'creation_date', width: 120 },
            { title: 'إجراءات', key: 'actions', width: 150, render: (_: any, r: any) => (
              <Space size="small">
                <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => openPayments(r)} title="الدفعات" />
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                <Popconfirm title="حذف الفاتورة؟" onConfirm={() => handleDelete(r.id)} okText="نعم" cancelText="لا">
                  <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )}
          ]}
        />
      </div>

      {/* Invoice Form */}
      <Modal title={editInvoice ? 'تعديل فاتورة' : 'فاتورة جديدة'} open={modalOpen}
        onOk={handleSave} onCancel={() => setModalOpen(false)} okText="حفظ" cancelText="إلغاء" width={520} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="customer_id" label="الزبون" rules={[{ required: true, message: 'اختر الزبون' }]}>
            <Select showSearch placeholder="اختر الزبون" optionFilterProp="label"
              options={customers.map(c => ({ value: c.id, label: `${c.full_name} - ${c.phone_number || ''}` }))} />
          </Form.Item>
          <Form.Item name="invoice_number" label="رقم الفاتورة" rules={[{ required: true, message: 'أدخل الرقم' }]}>
            <Input placeholder="رقم الفاتورة" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}><Form.Item name="total_amount" label="المبلغ الكلي" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="monthly_deduction" label="القسط الشهري" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="total_months" label="الأشهر" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="creation_date" label="التاريخ" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="الحالة" rules={[{ required: true }]}>
              <Select options={[{ value: 'نشطة', label: 'نشطة' }, { value: 'مكتملة', label: 'مكتملة' }, { value: 'متأخرة', label: 'متأخرة' }, { value: 'ملغاة', label: 'ملغاة' }]} />
            </Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* Payments Drawer */}
      <Drawer title={`دفعات: ${paymentDrawer?.invoice_number || ''}`} open={!!paymentDrawer}
        onClose={() => setPaymentDrawer(null)} width={500} placement="left">
        {paymentDrawer && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--info-bg)', border: '1px solid var(--info-border)', marginBottom: 16 }}>
              <div>الزبون: <strong>{paymentDrawer.customer_name}</strong></div>
              <div>المبلغ: <strong>{paymentDrawer.total_amount?.toLocaleString()}</strong> | القسط: <strong>{paymentDrawer.monthly_deduction?.toLocaleString()}</strong></div>
              <div>المدفوع: <strong style={{ color: 'var(--success)' }}>{payments.reduce((s: number, p: any) => s + (p.amount || 0), 0).toLocaleString()}</strong></div>
            </div>

            <Form form={payForm} layout="inline" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <Form.Item name="amount" rules={[{ required: true }]}><InputNumber placeholder="المبلغ" min={0} style={{ width: 110 }} /></Form.Item>
              <Form.Item name="month_number" rules={[{ required: true }]}><InputNumber placeholder="شهر #" min={1} style={{ width: 80 }} /></Form.Item>
              <Form.Item name="payment_date" rules={[{ required: true }]}><DatePicker placeholder="التاريخ" /></Form.Item>
              <Form.Item name="notes"><Input placeholder="ملاحظة" style={{ width: 100 }} /></Form.Item>
              <Button type="primary" onClick={addPayment} icon={<PlusOutlined />}>إضافة</Button>
            </Form>

            {payments.length === 0 ? <Empty description="لا توجد دفعات" /> : (
              <Table dataSource={payments} rowKey="id" size="small" pagination={false}
                columns={[
                  { title: 'شهر', dataIndex: 'month_number', width: 55 },
                  { title: 'المبلغ', dataIndex: 'amount', render: (v: number) => v?.toLocaleString() },
                  { title: 'التاريخ', dataIndex: 'payment_date', width: 110 },
                  { title: 'ملاحظة', dataIndex: 'notes', ellipsis: true },
                  { title: '', key: 'a', width: 40, render: (_: any, r: any) => (
                    <Popconfirm title="حذف؟" onConfirm={async () => {
                      try { await inv.deletePayment(r.id); openPayments(paymentDrawer) } catch {}
                    }}><Button type="link" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                  )}
                ]}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}
