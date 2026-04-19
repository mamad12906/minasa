import React, { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Form, Input, Select, Switch, Popconfirm, message, Empty, Divider } from 'antd'
import dayjs from 'dayjs'
import Icon, { IconName } from '../layout/Icon'
import { useAuth } from '../../App'
import LiveActivity from './LiveActivity'
import { eventsStream } from '../../lib/events-stream'

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

const EMPLOYEE_COLORS = ['#D4A574', '#60A5FA', '#A78BFA', '#4ADE80', '#FBBF24', '#F87171', '#2D6B55', '#7C3AED']

// A user is "online now" if we saw them within the last 90 s.
const ONLINE_WINDOW_MS = 90_000

function renderPresenceDot(lastSeen: number | undefined): React.ReactNode {
  if (!lastSeen) return null
  const online = Date.now() - lastSeen < ONLINE_WINDOW_MS
  if (!online) return null
  return (
    <span title="متصل الآن" style={{
      position: 'absolute', bottom: -1, insetInlineEnd: -1,
      width: 10, height: 10, borderRadius: 5,
      background: 'var(--success)',
      border: '2px solid var(--bg)',
      boxShadow: '0 0 0 3px color-mix(in srgb, var(--success) 25%, transparent)',
    }} />
  )
}

function presenceLabel(lastSeen: number | undefined): string {
  if (!lastSeen) return ''
  const diffMs = Date.now() - lastSeen
  if (diffMs < ONLINE_WINDOW_MS) return 'متصل الآن'
  const min = Math.floor(diffMs / 60_000)
  if (min < 60) return `منذ ${min}د`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `منذ ${hr}س`
  const day = Math.floor(hr / 24)
  return `منذ ${day}ي`
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || '?'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

function colorFor(idx: number): string {
  return EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length]
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return '—'
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const diffMin = dayjs().diff(d, 'minute')
  if (diffMin < 1) return 'الآن'
  if (diffMin < 60) return `قبل ${diffMin}د`
  const diffHr = dayjs().diff(d, 'hour')
  if (diffHr < 24) return `قبل ${diffHr}س`
  const diffDay = dayjs().diff(d, 'day')
  if (diffDay === 1) return 'أمس'
  if (diffDay < 7) return d.format('dddd')
  return d.format('YYYY-MM-DD')
}

export default function AdminPanel() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [adminCategories, setAdminCategories] = useState<any[]>([])
  const [ministries, setMinistries] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [onlineMap, setOnlineMap] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form] = Form.useForm()
  const [newPlatform, setNewPlatform] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newMinistry, setNewMinistry] = useState('')

  useEffect(() => {
    loadUsers()
    loadPlatforms()
    loadCategories()
    loadMinistries()
    loadAuditLog()
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
  const loadAuditLog = async () => {
    try {
      const log = await (window as any).__ipc2?.auditLogGet?.(20)
      setAuditLog(log || [])
    } catch { setAuditLog([]) }
  }

  const handleAddPlatform = async () => {
    if (!newPlatform.trim()) return
    const res = await window.api.platforms.add(newPlatform.trim())
    if ((res as any).error) message.error('المنصة موجودة مسبقاً')
    else { message.success('تم إضافة المنصة'); setNewPlatform(''); loadPlatforms() }
  }
  const handleDeletePlatform = async (id: number) => {
    await window.api.platforms.delete(id)
    message.success('تم حذف المنصة')
    loadPlatforms()
  }
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    const res = await window.api.categories.add(newCategory.trim())
    if ((res as any).error) message.error('الصنف موجود مسبقاً')
    else { message.success('تم إضافة الصنف'); setNewCategory(''); loadCategories() }
  }
  const handleDeleteCategory = async (id: number) => {
    await window.api.categories.delete(id)
    message.success('تم حذف الصنف')
    loadCategories()
  }
  const handleAddMinistry = async () => {
    if (!newMinistry.trim()) return
    const res = await window.api.ministries.add(newMinistry.trim())
    if ((res as any).error) message.error('الوزارة موجودة مسبقاً')
    else { message.success('تم إضافة الوزارة'); setNewMinistry(''); loadMinistries() }
  }
  const handleDeleteMinistry = async (id: number) => {
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
      {/* ===== KPI row ===== */}
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

      {/* ===== Platforms + Categories + Ministries (above users) ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* Platforms */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--brand-tint)', color: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="layers" size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>إدارة المنصات</h3>
            <span className="chip chip--neutral" style={{ marginInlineStart: 'auto' }}>
              <span className="num">{platforms.length}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="اسم المنصة الجديدة..."
              value={newPlatform}
              onChange={e => setNewPlatform(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPlatform()}
              style={{ flex: 1 }}
            />
            <button className="btn btn--primary btn--sm" onClick={handleAddPlatform}>
              <Icon name="plus" size={12} stroke={2.3} /> إضافة
            </button>
          </div>

          {platforms.length === 0 ? (
            <div className="muted" style={{ fontSize: 12, padding: 10 }}>لا توجد منصات بعد.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {platforms.map(p => (
                <span key={p.id} className="chip chip--brand" style={{ cursor: 'default' }}>
                  {p.name}
                  <button
                    onClick={() => handleDeletePlatform(p.id)}
                    style={{
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'inherit',
                      padding: 0, display: 'flex', alignItems: 'center',
                      opacity: 0.7,
                    }}
                    title="حذف"
                  >
                    <Icon name="x" size={10} stroke={2.3} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--violet-bg)', color: 'var(--violet)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="tag" size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>إدارة أصناف الزبائن</h3>
            <span className="chip chip--neutral" style={{ marginInlineStart: 'auto' }}>
              <span className="num">{adminCategories.length}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="اسم الصنف الجديد..."
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              style={{ flex: 1 }}
            />
            <button className="btn btn--primary btn--sm" onClick={handleAddCategory}>
              <Icon name="plus" size={12} stroke={2.3} /> إضافة
            </button>
          </div>

          {adminCategories.length === 0 ? (
            <div className="muted" style={{ fontSize: 12, padding: 10 }}>لا توجد أصناف بعد.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {adminCategories.map(c => (
                <span key={c.id} className="chip chip--violet" style={{ cursor: 'default' }}>
                  {c.name}
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    style={{
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'inherit',
                      padding: 0, display: 'flex', alignItems: 'center',
                      opacity: 0.7,
                    }}
                    title="حذف"
                  >
                    <Icon name="x" size={10} stroke={2.3} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ministries */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="building" size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>إدارة الوزارات</h3>
            <span className="chip chip--neutral" style={{ marginInlineStart: 'auto' }}>
              <span className="num">{ministries.length}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              className="input"
              placeholder="اسم الوزارة الجديدة..."
              value={newMinistry}
              onChange={e => setNewMinistry(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMinistry()}
              style={{ flex: 1 }}
            />
            <button className="btn btn--primary btn--sm" onClick={handleAddMinistry}>
              <Icon name="plus" size={12} stroke={2.3} /> إضافة
            </button>
          </div>

          {ministries.length === 0 ? (
            <div className="muted" style={{ fontSize: 12, padding: 10 }}>لا توجد وزارات بعد.</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ministries.map(m => (
                <span key={m.id} className="chip chip--accent" style={{ cursor: 'default' }}>
                  {m.name}
                  <button
                    onClick={() => handleDeleteMinistry(m.id)}
                    style={{
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', color: 'inherit',
                      padding: 0, display: 'flex', alignItems: 'center',
                      opacity: 0.7,
                    }}
                    title="حذف"
                  >
                    <Icon name="x" size={10} stroke={2.3} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Live activity + users ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        {/* Users table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
          }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>الموظفون والصلاحيات</h3>
            <div style={{ flex: 1 }} />
            <button className="btn btn--primary btn--sm" onClick={handleAdd}>
              <Icon name="plus" size={12} stroke={2.3} /> موظف جديد
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40 }}>
              <Empty description="لا يوجد موظفون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>الموظف</th>
                    <th>الدور</th>
                    <th>الصلاحيات</th>
                    <th>الزبائن</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => {
                    let perms: any = {}
                    try { perms = JSON.parse(u.permissions || '{}') } catch {}
                    const activePerms = SECTIONS.filter(s => perms[s.key] === true)
                    const color = colorFor(i)

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ position: 'relative' }}>
                              <div className="avatar" style={{
                                width: 30, height: 30, fontSize: 11,
                                background: `${color}22`, color,
                              }}>{initials(u.display_name)}</div>
                              {renderPresenceDot(onlineMap[u.id])}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 500 }}>{u.display_name}</div>
                              <div className="muted" style={{ fontSize: 11 }}>
                                @{u.username}
                                {presenceLabel(onlineMap[u.id]) && (
                                  <> · {presenceLabel(onlineMap[u.id])}</>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {u.role === 'admin' ? (
                            <span className="chip chip--accent" style={{ fontSize: 11 }}>
                              <Icon name="crown" size={11} stroke={2.3} /> أدمن
                            </span>
                          ) : (
                            <span className="chip chip--neutral" style={{ fontSize: 11 }}>موظف</span>
                          )}
                        </td>
                        <td>
                          {u.role === 'admin' ? (
                            <span className="chip chip--success" style={{ fontSize: 11 }}>الكل</span>
                          ) : activePerms.length === 0 ? (
                            <span className="muted" style={{ fontSize: 12 }}>لا شيء</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 220 }}>
                              {activePerms.slice(0, 3).map(p => (
                                <span key={p.key} className="chip chip--brand" style={{ fontSize: 10.5 }}>
                                  {p.label}
                                </span>
                              ))}
                              {activePerms.length > 3 && (
                                <span className="chip chip--neutral" style={{ fontSize: 10.5 }}>
                                  +{activePerms.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="num" style={{ fontWeight: 600 }}>
                            {(u.customer_count || 0).toLocaleString('en-US')}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button
                              className="icon-btn"
                              style={{ width: 28, height: 28 }}
                              title="تعديل"
                              onClick={() => handleEdit(u)}
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            {u.id !== currentUser?.id && (
                              <Popconfirm
                                title="تعيين كلمة مرور جديدة؟"
                                description="سيتم عرض كلمة المرور مرة واحدة."
                                onConfirm={() => handleResetPassword(u)}
                                okText="تعيين" cancelText="إلغاء"
                              >
                                <button
                                  className="icon-btn"
                                  style={{ width: 28, height: 28, color: 'var(--warning)' }}
                                  title="تعيين كلمة مرور جديدة"
                                >
                                  <Icon name="lock" size={13} />
                                </button>
                              </Popconfirm>
                            )}
                            {u.role !== 'admin' && u.id !== currentUser?.id && (
                              <Popconfirm
                                title="حذف الموظف؟"
                                onConfirm={() => handleDelete(u.id)}
                                okText="نعم" cancelText="لا"
                              >
                                <button
                                  className="icon-btn"
                                  style={{ width: 28, height: 28, color: 'var(--danger)' }}
                                  title="حذف"
                                >
                                  <Icon name="trash" size={13} />
                                </button>
                              </Popconfirm>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live activity (server-pushed via SSE) */}
        <LiveActivity max={25} />
      </div>

      {/* ===== Edit/Add user modal ===== */}
      <Modal
        title={editUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} requiredMark={false}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item
              name="username"
              label="اسم المستخدم"
              rules={[{ required: true, message: 'أدخل اسم المستخدم' }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="admin, user1..." disabled={!!editUser} style={{ borderRadius: 10, height: 40 }} />
            </Form.Item>
            <Form.Item
              name="display_name"
              label="الاسم الظاهر"
              rules={[{ required: true, message: 'أدخل الاسم' }]}
              style={{ marginBottom: 12 }}
            >
              <Input placeholder="مثال: أحمد محمد" style={{ borderRadius: 10, height: 40 }} />
            </Form.Item>
          </div>

          <Form.Item
            name="password"
            label={editUser ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء)' : 'كلمة المرور'}
            rules={editUser ? [] : [{ required: true, message: 'أدخل كلمة المرور' }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password placeholder="كلمة المرور" style={{ borderRadius: 10, height: 40 }} />
          </Form.Item>

          <Form.Item name="role" label="الدور" style={{ marginBottom: 12 }}>
            <Select
              style={{ height: 40 }}
              options={[
                { value: 'admin', label: 'أدمن (كل الصلاحيات)' },
                { value: 'user', label: 'موظف (صلاحيات محددة)' },
              ]}
            />
          </Form.Item>

          <Form.Item name="platform_name" label="المنصة الافتراضية (اختياري)" style={{ marginBottom: 12 }}>
            <Select
              allowClear
              placeholder="اختر المنصة"
              style={{ height: 40 }}
              options={platforms.map(p => ({ value: p.name, label: p.name }))}
            />
          </Form.Item>

          <Divider style={{ margin: '4px 0 12px' }}>الصلاحيات (للموظف فقط)</Divider>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {SECTIONS.map(s => (
              <Form.Item
                key={s.key}
                name={`perm_${s.key}`}
                valuePropName="checked"
                style={{ marginBottom: 4 }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <Switch size="small" />
                  {s.label}
                </label>
              </Form.Item>
            ))}
          </div>
        </Form>
      </Modal>
    </div>
  )
}
