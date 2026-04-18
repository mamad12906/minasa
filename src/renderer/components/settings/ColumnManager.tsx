import React, { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Popconfirm, message, Space, Tag, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import type { CustomColumn } from '../../types'

const COLUMN_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'number', label: 'رقم' },
  { value: 'date', label: 'تاريخ' }
]

const TABLE_NAMES = [
  { value: 'customers', label: 'جدول الزبائن' },
  { value: 'invoices', label: 'جدول الفواتير' }
]

const typeColors: Record<string, string> = {
  text: 'blue',
  number: 'green',
  date: 'orange'
}

const typeLabels: Record<string, string> = {
  text: 'نص',
  number: 'رقم',
  date: 'تاريخ'
}

const tableLabels: Record<string, string> = {
  customers: 'الزبائن',
  invoices: 'الفواتير'
}

export default function ColumnManager() {
  const [columns, setColumns] = useState<CustomColumn[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editColumn, setEditColumn] = useState<CustomColumn | null>(null)
  const [form] = Form.useForm()

  const loadColumns = async () => {
    setLoading(true)
    try { const cols = await window.api.columns.list()
    setColumns(cols)
    setLoading(false)
  }

  useEffect(() => { loadColumns() }, [])

  const handleAdd = () => {
    setEditColumn(null)
    form.resetFields()
    form.setFieldsValue({ column_type: 'text', table_name: 'customers' })
    setModalOpen(true)
  }

  const handleEdit = (col: CustomColumn) => {
    setEditColumn(col)
    form.setFieldsValue({ display_name: col.display_name })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    if (editColumn) {
      await window.api.columns.update(editColumn.id, values.display_name)
      message.success('تم تعديل العمود بنجاح')
    } else {
      await window.api.columns.add({
        display_name: values.display_name,
        column_type: values.column_type,
        table_name: values.table_name
      })
      message.success('تم إضافة العمود بنجاح')
    }
    setModalOpen(false)
    loadColumns()
  }

  const handleDelete = async (id: number) => {
    await window.api.columns.delete(id)
    message.success('تم حذف العمود')
    loadColumns()
  }

  const tableColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    { title: 'اسم العمود', dataIndex: 'display_name', key: 'display_name' },
    {
      title: 'النوع', dataIndex: 'column_type', key: 'column_type',
      render: (v: string) => <Tag color={typeColors[v] || 'default'}>{typeLabels[v] || v}</Tag>
    },
    {
      title: 'الجدول', dataIndex: 'table_name', key: 'table_name',
      render: (v: string) => <Tag>{tableLabels[v] || v}</Tag>
    },
    {
      title: 'المعرف الداخلي', dataIndex: 'column_name', key: 'column_name',
      render: (v: string) => <code style={{ fontSize: 12, color: '#999' }}>{v}</code>
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      width: 120,
      render: (_: any, record: CustomColumn) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => handleEdit(record)} />
          <Popconfirm
            title="هل أنت متأكد من حذف هذا العمود؟"
            description="سيتم حذف جميع البيانات المخزنة في هذا العمود"
            onConfirm={() => handleDelete(record.id)}
            okText="نعم، احذف"
            cancelText="إلغاء"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ margin: 0 }}>
            <SettingOutlined style={{ marginLeft: 8 }} />
            إدارة الأعمدة المخصصة
          </h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            إضافة عمود جديد
          </Button>
        </Col>
      </Row>

      <p style={{ color: '#666', marginBottom: 16 }}>
        يمكنك إضافة أعمدة مخصصة لجدول الزبائن أو الفواتير. الأعمدة المخصصة تظهر في نماذج الإضافة والتعديل وفي جداول العرض وفي استيراد Excel.
      </p>

      <Table
        dataSource={columns}
        columns={tableColumns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: 'لا توجد أعمدة مخصصة بعد. اضغط "إضافة عمود جديد" لإنشاء أول عمود.' }}
      />

      <Modal
        title={editColumn ? 'تعديل العمود' : 'إضافة عمود جديد'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="display_name" label="اسم العمود (بالعربي)"
            rules={[{ required: true, message: 'يرجى إدخال اسم العمود' }]}>
            <Input placeholder="مثال: العنوان، رقم الجواز، الملاحظات..." />
          </Form.Item>

          {!editColumn && (
            <>
              <Form.Item name="column_type" label="نوع البيانات"
                rules={[{ required: true }]}>
                <Select options={COLUMN_TYPES} />
              </Form.Item>

              <Form.Item name="table_name" label="الجدول"
                rules={[{ required: true }]}>
                <Select options={TABLE_NAMES} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
