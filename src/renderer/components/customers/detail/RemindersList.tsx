import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import Icon from '../../layout/Icon'

interface Props {
  customerId: number
  reminders: any[]
  loading: boolean
  onOpenHandle: (r: any) => void
}

export default function RemindersList({ customerId, reminders, loading, onOpenHandle }: Props) {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>سجل التذكيرات</h3>
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => navigate(`/edit-customer/${customerId}`)}
        >
          <Icon name="plus" size={12} stroke={2.3} /> تذكير جديد
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
      ) : reminders.length === 0 ? (
        <Empty description="لا توجد تذكيرات لهذا الزبون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reminders.map((r: any) => {
            const isDone = r.is_done === 1
            const isDue = !isDone && r.reminder_date <= today
            const tone = isDone ? 'success' : isDue ? 'warning' : 'info'
            const label = isDone ? 'تم' : isDue ? 'مستحق' : 'قادم'
            const iconName = isDone ? 'check' : isDue ? 'bell' : 'clock'

            return (
              <div key={r.id} style={{
                padding: 14,
                borderRadius: 10,
                background: `var(--${tone}-bg)`,
                border: `1px solid var(--${tone}-border)`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 13.5, minWidth: 0 }}>
                    <Icon name={iconName} size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reminder_text}</span>
                  </div>
                  <span className={`chip chip--${tone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{label}</span>
                </div>
                <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.reminder_date}
                  {r.original_date && r.original_date !== r.reminder_date && (
                    <> · <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{r.original_date}</span></>
                  )}
                  {r.is_postponed === 1 && r.postpone_reason && (
                    <> · <span style={{ color: 'var(--warning)' }}>{r.postpone_reason}</span></>
                  )}
                  {isDone && r.handled_by && <> · {r.handle_method} · {r.handled_by}</>}
                </div>
                {!isDone && isDue && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => onOpenHandle(r)}
                    style={{ marginTop: 8 }}
                  >
                    <Icon name="check" size={11} /> تعامل مع التذكير
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
