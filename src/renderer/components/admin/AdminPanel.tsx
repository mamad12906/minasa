import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, Popconfirm, message, Space, Tag, Row, Col, Divider } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CrownOutlined, AppstoreOutlined, TagsOutlined } from '@ant-design/icons'

const SECTIONS = [
  { key: 'customers', label: 'الزبائن' },
  { key: 'import', label: 'استيراد Excel' },
  { key: 'export', label: 'تصدير Excel' },
]

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form] = Form.useForm()
  const [newPlatform, setNewPlatform] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const loadUsers = async () => { setLoading(true); setUsers(await window.api.users.list()); setLoading(false) }
  const loadPlatforms = async () => { setPlatforms(await window.api.platforms.list()) }
  const loadCategories = async () => { setAdminCategories(await window.api.categories.list()) }
  useEffect(() => { loadUsers(); loadPlatforms(); loadCategories() }, [])

  const handleAddPlatform = async () => {
    if (!newPlatform.trim()) return
    const res = await window.api.platforms.add(newPlatform.trim())
    if ((res as any).error) message.error('المنصة موجودة مسبقاً')
    else { message.success('تم إضافة المنصة'); setNewPlatform(''); loadPlatforms() }
  }
  const handleDeletePlatform = async (id: number) => { await window.api.platforms.delete(id); message.success('تم حذف المنصة'); loadPlatforms() }
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    const res = await window.api.categories.add(newCategory.trim())
    if ((res as any).error) message.error('الصنف موجود مسبقاً')
    else { message.success('تم إضافة الصنف'); setNewCategory(''); loadCategories() }
  }
  const handleDeleteCategory = async (id: number) => { await window.api.categories.delete(id); message.success('تم حذف الصنف'); loadCategories() }

  const handleAdd = () => {
    setEditUser(null); form.resetFields(); form.setFieldsValue({ role: 'user' })
    SECTIONS.forEach(s => form.setFieldValue(`perm_${s.key}`, true)); setModalOpen(true)
  }

  const handleEdit = (user: any) => {
    setEditUser(user); let perms: any = {}
    try { perms = JSON.parse(user.permissions || '{}') } catch {}
    form.setFieldsValue({ username: user.username, display_name: user.display_name, role: user.role, platform_name: user.platform_name || undefined, password: '' })
    SECTIONS.forEach(s => form.setFieldValue(`perm_${s.key}`, perms[s.key] !== false)); setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const perms: Record<string, boolean> = {}
    SECTIONS.forEach(s => { perms[s.key] = values[`perm_${s.key}`] !== false })
    const permStr = JSON.stringify(perms); const platName = values.platform_name || ''
    if (editUser) {
      const res = await window.api.users.update(editUser.id, values.display_name, values.password || null, permStr, platName)
      if ((res as any).error) { message.error((res as any).error); return }
      message.success('تم تعديل المستخدم')
    } else {
      if (!values.password) { message.error('يرجى إدخال كلمة المرور'); return }
      const res = await window.api.users.create(values.username, values.password, values.display_name, values.role, permStr, platName)
      if ((res as any).error) { message.error((res as any).error.includes('UNIQUE') ? 'اسم المستخدم موجود مسبقاً' : (res as any).error); return }
      message.success('تم إنشاء المستخدم')
    }
    setModalOpen(false); loadUsers()
  }

  const handleDelete = async (id: number) => { await window.api.users.delete(id); message.success('تم حذف المستخدم'); loadUsers() }

  return (
    <div>
      <div className="hover-card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
          <AppstoreOutlined style={{ marginLeft: 8, color: '#1B6B93' }} />إدارة المنصات
        </h2>
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input placeholder="أدخل اسم المنصة الجديدة..." value={newPlatform}
              onChange={e => setNewPlatform(e.target.value)} onPressEnter={handleAddPlatform} style={{ borderRadius: 8 }} />
          </Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={handleAddPlatform} style={{ borderRadius: 8 }}>إضافة</Button></Col>
        </Row>
        <Space size={8} wrap>
          {platforms.map(p => (
            <Tag key={p.id} closable onClose={() => handleDeletePlatform(p.id)} color="blue" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 6 }}>{p.name}</Tag>
          ))}
          {platforms.length === 0 && <span style={{ color: 'var(--text-muted)' }}>لا توجد منصات بعد.</span>}
        </Space>
      </div>

      <div className="hover-card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
          <TagsOutlined style={{ marginLeft: 8, color: '#8B5CF6' }} />إدارة أصناف الزبائن
        </h2>
        <Row gutter={12} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input placeholder="أدخل اسم الصنف الجديد..." value={newCategory}
              onChange={e => setNewCategory(e.target.value)} onPressEnter={handleAddCategory} style={{ borderRadius: 8 }} />
          </Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}
            style={{ borderRadius: 8, background: '#8B5CF6', borderColor: '#8B5CF6' }}>إضافة</Button></Col>
        </Row>
        <Space size={8} wrap>
          {adminCategories.map(c => (
            <Tag key={c.id} closable onClose={() => handleDeleteCategory(c.id)} color="purple" style={{ fontSize: 13, padding: '3px 10px', borderRadius: 6 }}>{c.name}</Tag>
          ))}
          {adminCategories.length === 0 && <span style={{ color: 'var(--text-muted)' }}>لا توجد أصناف بعد.</span>}
        </Space>
      </div>

      <div className="hover-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col><h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}><CrownOutlined style={{ marginLeft: 8, color: '#D29922' }} />إدارة المستخدمين</h2></Col>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ borderRadius: 8 }}>إضافة مستخدم</Button></Col>
        </Row>
        <Table dataSource={users} rowKey="id" loading={loading} pagination={false} size="middle"
          columns={[
            { title: 'اسم المستخدم', dataIndex: 'username', render: (v: string) => <strong>{v}</strong> },
            { title: 'الاسم', dataIndex: 'display_name' },
            { title: 'عدد الزبائن', dataIndex: 'customer_count', render: (v: number) => <Tag color={v > 0 ? 'blue' : 'default'}>{v || 0}</Tag> },
            { title: 'الدور', dataIndex: 'role', render: (v: string) => v === 'admin' ? <Tag color="gold" icon={<CrownOutlined />}>أدمن</Tag> : <Tag color="blue" icon={<UserOutlined />}>مستخدم</Tag> },
            { title: 'الصلاحيات', key: 'perms', render: (_: any, record: any) => {
              if (record.role === 'admin') return <Tag color="green">كل الصلاحيات</Tag>
              let perms: any = {}; try { perms = JSON.parse(record.permissions || '{}') } catch {}
              return <Space size={4} wrap>{SECTIONS.map(s => <Tag key={s.key} color={perms[s.key] !== false ? 'green' : 'red'} style={{ fontSize: 11 }}>{s.label}: {perms[s.key] !== false ? '✓' : '✗'}</Tag>)}</Space>
            }},
            { title: 'إجراءات', key: 'actions', width: 100, render: (_: any, record: any) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                {record.role !== 'admin' && <Popconfirm title="حذف المستخدم؟" onConfirm={() => handleDelete(record.id)} okText="نعم" cancelText="لا"><Button type="link" size="small" danger icon={<DeleteOutlined />} /></Popconfirm>}
              </Space>
            )}
          ]}
        />
      </div>

      <Modal title={editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'} open={modalOpen} onOk={handleSave}
        onCancel={() => setModalOpen(false)} okText="حفظ" cancelText="إلغاء" width={520} destroyOnClose>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="اسم المستخدم" rules={[{ required: true }]}><Input placeholder="admin, user1..." disabled={!!editUser} /></Form.Item>
          <Form.Item name="display_name" label="الاسم الظاهر" rules={[{ required: true }]}><Input placeholder="مثال: أحمد محمد" /></Form.Item>
          <Form.Item name="password" label={editUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'} rules={editUser ? [] : [{ required: true }]}><Input.Password placeholder="كلمة المرور" /></Form.Item>
          <Form.Item name="role" label="الدور"><Select options={[{ value: 'admin', label: 'أدمن (كل الصلاحيات)' }, { value: 'user', label: 'مستخدم (منصة محددة)' }]} /></Form.Item>
          <Divider>الصلاحيات (للمستخدم العادي)</Divider>
          {SECTIONS.map(s => <Form.Item key={s.key} name={`perm_${s.key}`} label={s.label} valuePropName="checked" style={{ marginBottom: 8 }}><Switch checkedChildren="مفعّل" unCheckedChildren="مخفي" /></Form.Item>)}
        </Form>
      </Modal>
    </div>
  )
}
