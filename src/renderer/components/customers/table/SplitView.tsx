import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Empty } from 'antd'
import Icon from '../../layout/Icon'
import { statusTone, initials, formatDate } from './shared'

interface Props {
  customers: any[]
  total: number
  selectedId: number | null
  onSelect: (id: number) => void
  reminders: any[]
  history: any[]
  userMap: Record<number, string>
  currentUser: any | null | undefined
}

export default function SplitView({
  customers, total, selectedId, onSelect, reminders, history, userMap, currentUser,
}: Props) {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  const selected = customers.find((x: any) => x.id === selectedId) || customers[0]

  let endDate = '-'
  if (selected?.months_count && selected?.created_at) {
    try {
      const d = new Date(selected.created_at)
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + Number(selected.months_count))
        endDate = d.toISOString().split('T')[0]
      }
    } catch { /* keep '-' */ }
  }

  return (
    <div className="card" style={{
      padding: 0,
      overflow: 'hidden',
      height: 'calc(100vh - 300px)',
      minHeight: 520,
      display: 'grid',
      gridTemplateColumns: '380px 1fr',
    }}>
      <div style={{
        borderInlineEnd: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span className="muted" style={{ fontSize: 12 }}>
              <span className="num">{total.toLocaleString('en-US')}</span> زبون
            </span>
            <button
              className="btn btn--primary btn--sm"
              onClick={() => navigate('/add-customer')}
              style={{ height: 28 }}
            >
              <Icon name="plus" size={12} stroke={2.3} /> إضافة
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {customers.map((c: any) => {
            const active = selectedId === c.id
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '12px 16px',
                  background: active ? 'var(--brand-tint)' : 'transparent',
                  border: 'none',
                  borderInlineEnd: active ? '3px solid var(--brand)' : '3px solid transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'right',
                  fontFamily: 'inherit',
                }}
              >
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                  {initials(c.full_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{c.full_name}</div>
                  {c.phone_number && (
                    <div className="num muted" style={{ fontSize: 11, marginTop: 2 }}>{c.phone_number}</div>
                  )}
                </div>
                <span className="dot" style={{
                  background: `var(--${statusTone(c.status_note)})`,
                  width: 7, height: 7,
                }} />
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: 28, overflowY: 'auto', minHeight: 0 }}>
        {!selected ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <Empty description="اختر زبونًا من القائمة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => window.open(`tel:${selected.phone_number}`)}
                  disabled={!selected.phone_number}
                >
                  <Icon name="phone" size={12} /> اتصال
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => navigate(`/edit-customer/${selected.id}`)}
                >
                  <Icon name="edit" size={12} /> تعديل
                </button>
                <button
                  className="btn btn--primary btn--sm"
                  onClick={() => navigate(`/customer/${selected.id}`)}
                >
                  <Icon name="external" size={12} /> طباعة
                </button>
              </div>
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <h2 style={{ fontSize: 22, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {selected.full_name}
                </h2>
                {(selected.phone_number || selected.card_number) && (
                  <div className="num muted" style={{ marginTop: 4, fontSize: 13 }}>
                    {selected.phone_number}
                    {selected.phone_number && selected.card_number && <> · </>}
                    {selected.card_number}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {selected.platform_name && <span className="chip chip--neutral">{selected.platform_name}</span>}
                  {selected.category && <span className="chip chip--brand">{selected.category}</span>}
                  {selected.status_note && (
                    <span className={`chip chip--${statusTone(selected.status_note)}`}>
                      <span className="dot" style={{ background: 'currentColor' }} />
                      {selected.status_note}
                    </span>
                  )}
                </div>
              </div>
              <div className="avatar avatar-ring" style={{ width: 64, height: 64, fontSize: 24, flexShrink: 0 }}>
                {initials(selected.full_name)}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 14,
            }}>
              {[
                { l: 'المدة', v: selected.months_count ? `${selected.months_count} شهر` : '-', num: true, icon: 'calendar' },
                { l: 'تاريخ الانتهاء', v: endDate, num: true, icon: 'clock' },
                { l: 'الوزارة', v: selected.ministry_name || '-', truncate: true, icon: 'building' },
                { l: 'الموظف', v: userMap[selected.user_id] || (selected.user_id === currentUser?.id ? 'أدمن' : '-'), icon: 'users' },
              ].map((f: any, i) => (
                <div key={i} className="card-flat" style={{ padding: 14 }}>
                  <div className="label-sm" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name={f.icon} size={10} />
                    {f.l}
                  </div>
                  <div
                    className={(f.num ? 'num' : '') + (f.truncate ? ' truncate' : '')}
                    style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}
                  >{f.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card-flat">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="bell" size={14} />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>التذكيرات</h4>
                </div>
                {reminders.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12, padding: '4px 0' }}>لا توجد تذكيرات</div>
                ) : (
                  reminders.slice(0, 4).map((r: any, i: number) => {
                    const isDone = r.is_done === 1
                    const isDue = !isDone && r.reminder_date <= today
                    const tone = isDone ? 'success' : isDue ? 'danger' : 'info'
                    const label = isDone ? 'تم' : isDue ? 'اليوم' : formatDate(r.reminder_date)
                    return (
                      <div key={r.id} style={{
                        padding: '8px 0',
                        borderBottom: i < Math.min(reminders.length, 4) - 1 ? '1px solid var(--border-subtle)' : 'none',
                        fontSize: 12.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span className={`chip chip--${tone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{label}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.reminder_text}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="card-flat">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Icon name="history" size={14} />
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>سجل التعديلات</h4>
                </div>
                {history.length === 0 ? (
                  <div className="muted" style={{ fontSize: 12, padding: '4px 0' }}>لا توجد تعديلات</div>
                ) : (
                  history.slice(0, 4).map((h: any, i: number) => {
                    const aTone = h.action === 'إضافة' ? 'success'
                      : h.action === 'حذف' ? 'danger'
                      : h.action === 'تعديل' ? 'info'
                      : 'neutral'
                    return (
                      <div key={h.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 0',
                        borderBottom: i < Math.min(history.length, 4) - 1 ? '1px solid var(--border-subtle)' : 'none',
                        fontSize: 12,
                      }}>
                        <span className={`chip chip--${aTone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>
                          {h.action || 'تحديث'}
                        </span>
                        <span className="num muted" style={{ marginInlineStart: 'auto', fontSize: 10.5, flexShrink: 0 }}>
                          {h.created_at ? formatDate(h.created_at) : ''}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
