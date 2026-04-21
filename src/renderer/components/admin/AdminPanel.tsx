import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Form, message } from 'antd'
import Icon, { IconName } from '../layout/Icon'
import { useAuth } from '../../App'
import LiveActivity from './LiveActivity'
import { eventsStream } from '../../lib/events-stream'
import LookupCard from './panel/LookupCard'
import UsersTable from './panel/UsersTable'
import UserFormModal from './panel/UserFormModal'

const SECTIONS = [
  { key: 'customers',       label: 'زبائن' },
  { key: 'invoices',        label: 'فواتير' },
  { key: 'reports',         label: 'تقارير' },
  { key: 'import',          label: 'استيراد' },
  { key: 'export',          label: 'تصدير' },
  { key: 'backup',          label: 'نسخ احتياطي' },
  { key: 'edit_customer',   label: 'تعديل زبون' },
  { key: 'delete_customer', label: 'حذف زبون' },
]

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [ministries, setMinistries] = useState<any[]>([])
  const [onlineMap, setOnlineMap] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadUsers()
    loadPlatforms()
    loadCategories()
    loadMinistries()
    loadOnline()
    // Refresh presence every 15 s so the "online now" dot stays current.
    const id = setInterval(loadOnline, 15_000)
    return () => clearInterval(id)
  }, [])

  const loadOnline = async () => {
    try {
      const res = await window.api.users.online()
      setOnlineMap(res || {})
    } catch { /* offline or non-admin — ignore */ }
  }

  // Live refresh: when the server broadcasts a mutation that affects what's
  // on screen, re-pull so the admin sees it without reaching for the refresh
  // button. Debounced implicitly because each loader is cheap and events
  // arrive in small bursts.
  useEffect(() => {
    return eventsStream.on((e) => {
      if (e.kind.startsWith('user.')) loadUsers()
      else if (e.kind.startsWith('ministry.')) loadMinistries()
      else if (e.kind.startsWith('platform.')) loadPlatforms()
      else if (e.kind.startsWith('category.')) loadCategories()
    })
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try { setUsers(await window.api.users.list()) }
    catch { message.error('فشل تحميل المستخدمين') }
    finally { setLoading(false) }
  }
  const loadPlatforms = async () => {
    try { setPlatforms(await window.api.platforms.list()) }
    catch (err) { console.error('[AdminPanel] Failed to load platforms:', err) }
  }
  const loadCategories = async () => {
    try { setAdminCategories(await window.api.categories.list()) }
    catch (err) { console.error('[AdminPanel] Failed to load categories:', err) }
  }
  const loadMinistries = async () => {
    try { setMinistries(await window.api.ministries.list()) }
    catch (err) { console.error('[AdminPanel] Failed to load ministries:', err) }
  }

  const addPlatform = async (name: string) => {
    const res = await window.api.platforms.add(name)
    if ((res as any).error) message.error('المنصة موجودة مسبقاً')
    else { message.success('تم إضافة المنصة'); loadPlatforms() }
  }
  const deletePlatform = async (id: number) => {
    await window.api.platforms.delete(id)
    message.success('تم حذف المنصة')
    loadPlatforms()
  }
  const addCategory = async (name: string) => {
    const res = await window.api.categories.add(name)
    if ((res as any).error) message.error('الصنف موجود مسبقاً')
    else { message.success('تم إضافة الصنف'); loadCategories() }
  }
  const deleteCategory = async (id: number) => {
    await window.api.categories.delete(id)
    message.success('تم حذف الصنف')
    loadCategories()
  }
  const addMinistry = async (name: string) => {
    const res = await window.api.ministries.add(name)
    if ((res as any).error) message.error('الوزارة موجودة مسبقاً')
    else { message.success('تم إضافة الوزارة'); loadMinistries() }
  }
  const deleteMinistry = async (id: number) => {
    await window.api.ministries.delete(id)
    message.success('تم حذف الوزارة')
    loadMinistries()
  }

  const handleResetPassword = async (user: any) => {
    try {
      const res = await window.api.audit.resetUserPassword(user.id)
      if ((res as any).error) {
        message.error((res as any).error)
        return
      }
      Modal.success({
        title: `تم تعيين كلمة مرور جديدة للمستخدم "${user.display_name || user.username}"`,
        content: (
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
              انسخ كلمة المرور الآن — لن تُعرض مرة ثانية:
            </div>
            <div style={{
              padding: 12,
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 700,
              textAlign: 'center',
              userSelect: 'all',
            }}>
              {res.password}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              شارك كلمة المرور مع المستخدم عبر قناة آمنة. اطلب منه تغييرها بعد الدخول.
            </div>
          </div>
        ),
        okText: 'تم',
        width: 440,
      })
    } catch (e: any) {
      message.error(e?.message || 'فشل تعيين كلمة المرور')
    }
  }

  const handleAdd = () => {
    setEditUser(null)
    form.resetFields()
    form.setFieldsValue({ role: 'user' })
    SECTIONS.forEach(s => form.setFieldValue(`perm_${s.key}`, true))
    setModalOpen(true)
  }

  const handleEdit = (user: any) => {
    setEditUser(user)
    let perms: any = {}
    try { perms = JSON.parse(user.permissions || '{}') }
    catch (err) { console.error('[AdminPanel] Failed to parse permissions:', err) }
    form.setFieldsValue({
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      platform_name: user.platform_name || undefined,
      password: '',
    })
    SECTIONS.forEach(s => form.setFieldValue(`perm_${s.key}`, perms[s.key] === true))
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const perms: Record<string, boolean> = {}
    SECTIONS.forEach(s => { perms[s.key] = values[`perm_${s.key}`] !== false })
    const permStr = JSON.stringify(perms)
    const platName = values.platform_name || ''
    if (editUser) {
      const res = await window.api.users.update(editUser.id, values.display_name, values.password || null, permStr, platName)
      if ((res as any).error) { message.error((res as any).error); return }
      message.success('تم تعديل المستخدم')
    } else {
      if (!values.password) { message.error('يرجى إدخال كلمة المرور'); return }
      const res = await window.api.users.create(values.username, values.password, values.display_name, values.role, permStr, platName)
      if ((res as any).error) {
        message.error((res as any).error.includes('UNIQUE') ? 'اسم المستخدم موجود مسبقاً' : (res as any).error)
        return
      }
      message.success('تم إنشاء المستخدم')
    }
    setModalOpen(false)
    loadUsers()
  }

  const handleDelete = async (id: number) => {
    await window.api.users.delete(id)
    message.success('تم حذف المستخدم')
    loadUsers()
  }

  // ===== KPIs =====
  const kpis = useMemo(() => {
    const admins = users.filter(u => u.role === 'admin').length
    const activeTotal = users.length
    return [
      { label: 'المستخدمون النشطون', value: activeTotal.toString(), tone: 'success' as const, icon: 'users' as IconName },
      { label: 'الأدمن',              value: admins.toString(),     tone: 'accent' as const,  icon: 'crown' as IconName },
      { label: 'المنصات',             value: platforms.length.toString(), tone: 'brand' as const, icon: 'layers' as IconName },
      { label: 'الأصناف',             value: adminCategories.length.toString(), tone: 'info' as const, icon: 'tag' as IconName },
      { label: 'الوزارات',            value: ministries.length.toString(), tone: 'violet' as const, icon: 'building' as IconName },
    ]
  }, [users, platforms, adminCategories, ministries])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {kpis.map((k, i) => {
          const toneBg = (k.tone === 'brand' || k.tone === 'accent') ? `var(--${k.tone}-tint)` : `var(--${k.tone}-bg)`
          return (
            <div key={i} className="kpi">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="kpi__label">{k.label}</div>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: toneBg, color: `var(--${k.tone})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={k.icon} size={13} />
                </div>
              </div>
              <div className="num" style={{ fontSize: 30, fontWeight: 600, marginTop: 10 }}>{k.value}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <LookupCard
          title="إدارة المنصات"
          icon="layers"
          items={platforms}
          iconBg="var(--brand-tint)"
          iconFg="var(--brand)"
          chipTone="brand"
          placeholder="اسم المنصة الجديدة..."
          emptyLabel="لا توجد منصات بعد."
          onAdd={addPlatform}
          onDelete={deletePlatform}
        />
        <LookupCard
          title="إدارة أصناف الزبائن"
          icon="tag"
          items={adminCategories}
          iconBg="var(--violet-bg)"
          iconFg="var(--violet)"
          chipTone="violet"
          placeholder="اسم الصنف الجديد..."
          emptyLabel="لا توجد أصناف بعد."
          onAdd={addCategory}
          onDelete={deleteCategory}
        />
        <LookupCard
          title="إدارة الوزارات"
          icon="building"
          items={ministries}
          iconBg="var(--accent-bg)"
          iconFg="var(--accent)"
          chipTone="accent"
          placeholder="اسم الوزارة الجديدة..."
          emptyLabel="لا توجد وزارات بعد."
          onAdd={addMinistry}
          onDelete={deleteMinistry}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        <UsersTable
          users={users}
          currentUserId={currentUser?.id}
          loading={loading}
          onlineMap={onlineMap}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onDelete={handleDelete}
        />
        <LiveActivity max={25} />
      </div>

      <UserFormModal
        open={modalOpen}
        editUser={editUser}
        form={form}
        platforms={platforms}
        onSave={handleSave}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}
