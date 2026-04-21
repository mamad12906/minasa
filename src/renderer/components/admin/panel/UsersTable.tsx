import React from 'react'
import { Empty, Popconfirm } from 'antd'
import Icon from '../../layout/Icon'

const SECTION_LABELS: Record<string, string> = {
  customers: 'زبائن',
  invoices: 'فواتير',
  reports: 'تقارير',
  import: 'استيراد',
  export: 'تصدير',
  backup: 'نسخ احتياطي',
  edit_customer: 'تعديل زبون',
  delete_customer: 'حذف زبون',
}

const EMPLOYEE_COLORS = ['#D4A574', '#60A5FA', '#A78BFA', '#4ADE80', '#FBBF24', '#F87171', '#2D6B55', '#7C3AED']
const ONLINE_WINDOW_MS = 90_000

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || '?'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

function colorFor(idx: number): string {
  return EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length]
}

function renderPresenceDot(lastSeen: number | undefined): React.ReactNode {
  if (!lastSeen) return null
  if (Date.now() - lastSeen >= ONLINE_WINDOW_MS) return null
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

interface Props {
  users: any[]
  currentUserId: number | undefined
  loading: boolean
  onlineMap: Record<number, number>
  onAdd: () => void
  onEdit: (u: any) => void
  onResetPassword: (u: any) => void
  onDelete: (id: number) => void
}

export default function UsersTable({
  users, currentUserId, loading, onlineMap,
  onAdd, onEdit, onResetPassword, onDelete,
}: Props) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>الموظفون والصلاحيات</h3>
        <div style={{ flex: 1 }} />
        <button className="btn btn--primary btn--sm" onClick={onAdd}>
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
                const activePerms = Object.keys(SECTION_LABELS).filter(k => perms[k] === true)
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
                          {activePerms.slice(0, 3).map(k => (
                            <span key={k} className="chip chip--brand" style={{ fontSize: 10.5 }}>
                              {SECTION_LABELS[k]}
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
                          onClick={() => onEdit(u)}
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        {u.id !== currentUserId && (
                          <Popconfirm
                            title="تعيين كلمة مرور جديدة؟"
                            description="سيتم عرض كلمة المرور مرة واحدة."
                            onConfirm={() => onResetPassword(u)}
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
                        {u.role !== 'admin' && u.id !== currentUserId && (
                          <Popconfirm
                            title="حذف الموظف؟"
                            onConfirm={() => onDelete(u.id)}
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
  )
}
