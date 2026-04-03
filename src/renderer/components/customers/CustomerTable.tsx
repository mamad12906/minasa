import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Table, Button, Input, Space, Card, Popconfirm, message, Select, Row, Col, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { Customer, CustomColumn } from '../../types'
import CustomerForm from './CustomerForm'
import CustomerDetail from './CustomerDetail'
import { useAuth } from '../../App'

export default function CustomerTable() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [platform, setPlatform] = useState<string | undefined>()
  const [category, setCategory] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [filterUserId, setFilterUserId] = useState<number | undefined>()

  const isAdmin = user?.role === 'admin'
  // Non-admin: always filter by own user_id. Admin: optionally filter by selected employee
  const effectiveUserId = isAdmin ? filterUserId : user?.id

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    const result = await window.api.customer.list({ page, pageSize, search, platform, category, userId: effectiveUserId })
    setCustomers(result.data)
    setTotal(result.total)
    setLoading(false)
  }, [page, pageSize, search, platform, category, effectiveUserId])

  const loadFilters = async () => {
    const [p, c] = await Promise.all([
      window.api.customer.platforms(),
      window.api.customer.categories()
    ])
    setPlatforms(p)
    setCategories(c)
  }

  const loadCustomColumns = async () => {
    const cols = await window.api.columns.list('customers')
    setCustomColumns(cols)
  }

  const loadUsers = async () => {
    if (isAdmin) {
      const users = await window.api.users.list()
      setAllUsers(users.filter((u: any) => u.role !== 'admin'))
    }
  }

  // Build user_id -> display_name map
  const userMap: Record<number, string> = {}
  allUsers.forEach((u: any) => { userMap[u.id] = u.display_name })

  useEffect(() => { loadCustomers() }, [loadCustomers])
  useEffect(() => { loadFilters(); loadCustomColumns(); loadUsers() }, [])

  const handleSave = async (input: any) => {
    if (editCustomer) {
      await window.api.customer.update(editCustomer.id, input)
      message.success('تم تعديل الزبون بنجاح')
    } else {
      await window.api.customer.create(input)
      message.success('تم إضافة الزبون بنجاح')
    }
    setFormOpen(false)
    setEditCustomer(null)
    loadCustomers()
    loadFilters()
  }

  const handleDelete = async (id: number) => {
    await window.api.customer.delete(id)
    message.success('تم حذف الزبون')
    loadCustomers()
  }

  const baseColumns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1
    },
    { title: 'اسم الزبون', dataIndex: 'full_name', key: 'full_name', ellipsis: true },
    { title: 'المنصة', dataIndex: 'platform_name', key: 'platform_name',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-'
    },
    { title: 'رقم الهاتف', dataIndex: 'phone_number', key: 'phone_number' },
    { title: 'رقم البطاقة', dataIndex: 'card_number', key: 'card_number' },
    { title: 'الوزارة', dataIndex: 'ministry_name', key: 'ministry_name', ellipsis: true },
    { title: 'الصنف', dataIndex: 'category', key: 'category',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-'
    },
    { title: 'تاريخ الإنشاء', dataIndex: 'created_at', key: 'created_at', width: 160 },
    ...(isAdmin ? [{
      title: 'الموظف', dataIndex: 'user_id', key: 'user_id',
      render: (v: number) => userMap[v] ? <Tag color="cyan">{userMap[v]}</Tag> : (v === user?.id ? <Tag color="gold">أدمن</Tag> : '-')
    }] : []),
  ]

  // Add custom columns dynamically
  const dynamicColumns = customColumns.map(col => ({
    title: col.display_name,
    dataIndex: col.column_name,
    key: col.column_name,
    ellipsis: true
  }))

  const actionColumn = {
    title: 'الإجراءات',
    key: 'actions',
    width: 150,
    render: (_: any, record: Customer) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}
          onClick={() => setDetailCustomer(record)} />
        <Button type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditCustomer(record); setFormOpen(true) }} />
        <Popconfirm title="هل أنت متأكد من الحذف؟" onConfirm={() => handleDelete(record.id)}
          okText="نعم" cancelText="لا">
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )
  }

  const columns = [...baseColumns, ...dynamicColumns, actionColumn]

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <h2 style={{ margin: 0 }}>إدارة الزبائن</h2>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/add-customer')}
              style={{ borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}>
              إضافة زبون جديد
            </Button>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10}>
            <Input
              placeholder="بحث بالاسم أو الهاتف أو البطاقة..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              placeholder="المنصة"
              value={platform}
              onChange={v => { setPlatform(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={platforms.map(p => ({ value: p, label: p }))}
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              placeholder="الصنف"
              value={category}
              onChange={v => { setCategory(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={categories.map(c => ({ value: c, label: c }))}
            />
          </Col>
          {isAdmin && (
            <Col xs={12} sm={7}>
              <Select
                placeholder="الموظف"
                value={filterUserId}
                onChange={v => { setFilterUserId(v); setPage(1) }}
                allowClear
                style={{ width: '100%' }}
                options={allUsers.map(u => ({ value: u.id, label: u.display_name }))}
              />
            </Col>
          )}
        </Row>

        <Table
          dataSource={customers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100'],
            showTotal: (total) => `إجمالي: ${total} زبون`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
          size="middle"
          scroll={{ x: 800 + customColumns.length * 150 }}
        />
      </Card>

      <CustomerForm
        open={formOpen}
        customer={editCustomer}
        onClose={() => { setFormOpen(false); setEditCustomer(null) }}
        onSave={handleSave}
        platforms={platforms}
        categories={categories}
        customColumns={customColumns}
      />

      <CustomerDetail
        customer={detailCustomer}
        onClose={() => setDetailCustomer(null)}
        customColumns={customColumns}
        onRefresh={() => { loadCustomers(); setDetailCustomer(null) }}
      />
    </div>
  )
}
