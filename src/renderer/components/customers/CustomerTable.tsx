import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Table, Button, Input, Space, Popconfirm, message, Select, Row, Col, Tag, Checkbox, Popover, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined, TeamOutlined, UserOutlined, FilterOutlined, SaveOutlined, ClearOutlined, SettingOutlined, CalendarOutlined } from '@ant-design/icons'
import type { Customer, CustomColumn } from '../../types'
import CustomerForm from './CustomerForm'
import CustomerDetail from './CustomerDetail'
import { useAuth } from '../../App'
import dayjs from 'dayjs'

// All possible column keys
const ALL_COLUMN_KEYS = ['index', 'full_name', 'platform_name', 'phone_number', 'card_number', 'ministry_name', 'category', 'months_count', 'status_note', 'notes', 'created_at', 'user_id']
const COLUMN_LABELS: Record<string, string> = {
  index: '#', full_name: 'اسم الزبون', platform_name: 'المنصة', phone_number: 'رقم الهاتف',
  card_number: 'رقم البطاقة', ministry_name: 'الوزارة', category: 'الصنف',
  months_count: 'عدد الأشهر', status_note: 'الحالة', notes: 'ملاحظات',
  created_at: 'تاريخ الإنشاء', user_id: 'الموظف'
}

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
  const [filterMonths, setFilterMonths] = useState<number | undefined>()
  const [savedFilters, setSavedFilters] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('minasa_saved_filters') || '[]') } catch { return [] }
  })
  // Visible columns
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('minasa_visible_cols')
      if (saved) return JSON.parse(saved)
    } catch {}
    return ['index', 'full_name', 'platform_name', 'phone_number', 'card_number', 'ministry_name', 'category', 'created_at', 'user_id']
  })

  const isAdmin = user?.role === 'admin'
  const effectiveUserId = isAdmin ? filterUserId : user?.id

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    const result = await window.api.customer.list({ page, pageSize, search, platform, category, userId: effectiveUserId })
    setCustomers(result.data)
    setTotal(result.total)
    setLoading(false)
  }, [page, pageSize, search, platform, category, effectiveUserId])

  const loadFilters = async () => {
    const [p, c] = await Promise.all([window.api.customer.platforms(), window.api.customer.categories()])
    setPlatforms(p); setCategories(c)
  }

  const loadCustomColumns = async () => { setCustomColumns(await window.api.columns.list('customers')) }

  const loadUsers = async () => {
    if (isAdmin) { setAllUsers(await window.api.users.list()) }
  }

  const userMap: Record<number, string> = {}
  allUsers.forEach((u: any) => { userMap[u.id] = u.display_name })

  useEffect(() => { loadCustomers() }, [loadCustomers])
  useEffect(() => { loadFilters(); loadCustomColumns(); loadUsers() }, [])

  const toggleCol = (key: string) => {
    const updated = visibleCols.includes(key) ? visibleCols.filter(k => k !== key) : [...visibleCols, key]
    setVisibleCols(updated)
    localStorage.setItem('minasa_visible_cols', JSON.stringify(updated))
  }

  const handleSave = async (input: any) => {
    if (editCustomer) {
      await window.api.customer.update(editCustomer.id, input); message.success('تم تعديل الزبون بنجاح')
    } else {
      await window.api.customer.create(input); message.success('تم إضافة الزبون بنجاح')
    }
    setFormOpen(false); setEditCustomer(null); loadCustomers(); loadFilters()
  }

  const handleDelete = async (id: number) => {
    await window.api.customer.delete(id); message.success('تم حذف الزبون'); loadCustomers()
  }

  // Build all columns
  const allColumns: any[] = [
    { title: '#', key: 'index', colKey: 'index', width: 55, render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1 },
    { title: 'اسم الزبون', dataIndex: 'full_name', key: 'full_name', colKey: 'full_name', ellipsis: true },
    { title: 'المنصة', dataIndex: 'platform_name', key: 'platform_name', colKey: 'platform_name', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: 'رقم الهاتف', dataIndex: 'phone_number', key: 'phone_number', colKey: 'phone_number' },
    { title: 'رقم البطاقة', dataIndex: 'card_number', key: 'card_number', colKey: 'card_number' },
    { title: 'الوزارة', dataIndex: 'ministry_name', key: 'ministry_name', colKey: 'ministry_name', ellipsis: true },
    { title: 'الصنف', dataIndex: 'category', key: 'category', colKey: 'category', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
    { title: 'عدد الأشهر', dataIndex: 'months_count', key: 'months_count', colKey: 'months_count', width: 100,
      render: (v: number) => v ? <Tag color="orange">{v} شهر</Tag> : '-' },
    { title: 'الحالة', dataIndex: 'status_note', key: 'status_note', colKey: 'status_note', ellipsis: true,
      render: (v: string) => v ? <Tag color="orange">{v}</Tag> : '-' },
    { title: 'ملاحظات', dataIndex: 'notes', key: 'notes', colKey: 'notes', ellipsis: true },
    { title: 'تاريخ الإنشاء', dataIndex: 'created_at', key: 'created_at', colKey: 'created_at', width: 160 },
    ...(isAdmin ? [{
      title: 'الموظف', dataIndex: 'user_id', key: 'user_id', colKey: 'user_id',
      render: (v: number) => userMap[v] ? <Tag color="cyan">{userMap[v]}</Tag> : (v === user?.id ? <Tag color="gold">أدمن</Tag> : '-')
    }] : []),
  ]

  const dynamicColumns = customColumns.map(col => ({
    title: col.display_name, dataIndex: col.column_name, key: col.column_name, colKey: col.column_name, ellipsis: true
  }))

  const actionColumn = {
    title: 'الإجراءات', key: 'actions', width: 140,
    render: (_: any, record: Customer) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailCustomer(record)} />
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/edit-customer/${record.id}`)} />
        <Popconfirm title="هل أنت متأكد من الحذف؟" onConfirm={() => handleDelete(record.id)} okText="نعم" cancelText="لا">
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )
  }

  // Filter visible columns
  const filteredColumns = allColumns.filter(c => visibleCols.includes(c.colKey))
  const columns = [...filteredColumns, ...dynamicColumns, actionColumn]

  // Filter by months locally
  const displayedCustomers = useMemo(() => {
    if (!filterMonths) return customers
    return customers.filter(c => c.months_count && Number(c.months_count) === filterMonths)
  }, [customers, filterMonths])

  // Column visibility popover content
  const colSettingsContent = (
    <div style={{ maxHeight: 300, overflow: 'auto', minWidth: 180 }}>
      {ALL_COLUMN_KEYS.map(key => (
        <div key={key} style={{ padding: '4px 0' }}>
          <Checkbox checked={visibleCols.includes(key)} onChange={() => toggleCol(key)}>
            {COLUMN_LABELS[key] || key}
          </Checkbox>
        </div>
      ))}
      {customColumns.map(col => (
        <div key={col.column_name} style={{ padding: '4px 0' }}>
          <Checkbox checked={visibleCols.includes(col.column_name)}
            onChange={() => toggleCol(col.column_name)}>
            {col.display_name}
          </Checkbox>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {/* Stats summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1B6B93', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
              <TeamOutlined />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>إجمالي الزبائن</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{total.toLocaleString()}</div>
            </div>
          </div>
        </Col>
        {isAdmin && (
          <Col xs={12} sm={8}>
            <div className="stat-card">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2DA44E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff' }}>
                <UserOutlined />
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>الموظفين</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{allUsers.length}</div>
              </div>
            </div>
          </Col>
        )}
      </Row>

      <div className="hover-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col><h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>إدارة الزبائن</h2></Col>
          <Col>
            <Space>
              <Popover content={colSettingsContent} title="إظهار/إخفاء الأعمدة" trigger="click" placement="bottomLeft">
                <Button icon={<SettingOutlined />} style={{ borderRadius: 8 }}>الأعمدة</Button>
              </Popover>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/add-customer')}
                style={{ borderRadius: 8 }}>إضافة زبون جديد</Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} sm={8}>
            <Input placeholder="بحث بالاسم أو الهاتف أو البطاقة..." prefix={<SearchOutlined />}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} allowClear />
          </Col>
          <Col xs={12} sm={4}>
            <Select placeholder="المنصة" value={platform} onChange={v => { setPlatform(v); setPage(1) }}
              allowClear style={{ width: '100%' }} options={platforms.map(p => ({ value: p, label: p }))} />
          </Col>
          <Col xs={12} sm={4}>
            <Select placeholder="الصنف" value={category} onChange={v => { setCategory(v); setPage(1) }}
              allowClear style={{ width: '100%' }} options={categories.map(c => ({ value: c, label: c }))} />
          </Col>
          <Col xs={12} sm={4}>
            <InputNumber placeholder="عدد الأشهر" value={filterMonths}
              onChange={v => { setFilterMonths(v || undefined); setPage(1) }}
              min={1} style={{ width: '100%' }}
              addonBefore={<CalendarOutlined />} />
          </Col>
          {isAdmin && (
            <Col xs={12} sm={4}>
              <Select placeholder="الموظف" value={filterUserId} onChange={v => { setFilterUserId(v); setPage(1) }}
                allowClear style={{ width: '100%' }} options={allUsers.map(u => ({ value: u.id, label: u.display_name }))} />
            </Col>
          )}
        </Row>
        {/* Save/Load Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="small" icon={<SaveOutlined />} onClick={() => {
            const name = prompt('اسم الفلتر:')
            if (!name) return
            const f = { name, search, platform: platform || '', category: category || '', userId: filterUserId, months: filterMonths }
            const updated = [...savedFilters.filter(s => s.name !== name), f]
            setSavedFilters(updated)
            localStorage.setItem('minasa_saved_filters', JSON.stringify(updated))
            message.success(`تم حفظ الفلتر "${name}"`)
          }} disabled={!search && !platform && !category && !filterUserId && !filterMonths}>
            حفظ الفلتر
          </Button>
          <Button size="small" icon={<ClearOutlined />} onClick={() => {
            setSearch(''); setPlatform(undefined); setCategory(undefined); setFilterUserId(undefined); setFilterMonths(undefined); setPage(1)
          }}>مسح الفلاتر</Button>
          {savedFilters.map(f => (
            <Tag key={f.name} closable color="blue" style={{ cursor: 'pointer', fontSize: 12 }}
              onClick={() => {
                setSearch(f.search || ''); setPlatform(f.platform || undefined)
                setCategory(f.category || undefined); setFilterUserId(f.userId); setFilterMonths(f.months); setPage(1)
              }}
              onClose={(e) => {
                e.preventDefault()
                const updated = savedFilters.filter(s => s.name !== f.name)
                setSavedFilters(updated)
                localStorage.setItem('minasa_saved_filters', JSON.stringify(updated))
              }}>
              <FilterOutlined /> {f.name}
            </Tag>
          ))}
        </div>

        <Table dataSource={displayedCustomers} columns={columns}
          rowKey="id" loading={loading} size="middle" scroll={{ x: 800 + customColumns.length * 150 }}
          pagination={{
            current: page, pageSize, total: filterMonths ? displayedCustomers.length : total,
            showSizeChanger: true, pageSizeOptions: ['25', '50', '100'],
            showTotal: (t) => `إجمالي: ${t} زبون`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </div>

      <CustomerForm open={formOpen} customer={editCustomer}
        onClose={() => { setFormOpen(false); setEditCustomer(null) }}
        onSave={handleSave} platforms={platforms} categories={categories} customColumns={customColumns} />

      <CustomerDetail customer={detailCustomer} onClose={() => setDetailCustomer(null)}
        customColumns={customColumns} onRefresh={() => { loadCustomers(); setDetailCustomer(null) }} />
    </div>
  )
}
