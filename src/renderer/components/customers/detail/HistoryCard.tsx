import React from 'react'
import dayjs from 'dayjs'
import Icon from '../../layout/Icon'

interface Props {
  history: any[]
}

export default function HistoryCard({ history }: Props) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name="history" size={14} />
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>سجل التعديلات</h4>
      </div>
      {history.length === 0 ? (
        <div style={{
          padding: '20px 10px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12.5,
        }}>
          لا توجد تعديلات مسجّلة
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto' }}>
          {history.map((h: any, i: number) => {
            const aTone = h.action === 'إضافة' ? 'success'
              : h.action === 'حذف' ? 'danger'
              : h.action === 'تعديل' ? 'info'
              : 'neutral'
            return (
              <div key={h.id} style={{
                padding: '10px 0',
                borderBottom: i < history.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`chip chip--${aTone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>
                    {h.action || 'تحديث'}
                  </span>
                  <span className="num muted" style={{ fontSize: 10.5, marginInlineStart: 'auto' }}>
                    {dayjs(h.created_at).isValid()
                      ? dayjs(h.created_at).format('YYYY-MM-DD HH:mm')
                      : h.created_at}
                  </span>
                </div>
                {h.details && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {h.details}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
