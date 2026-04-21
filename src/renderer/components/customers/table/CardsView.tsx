import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../layout/Icon'
import { statusTone, initials, formatDate } from './shared'

const OWNER_COLORS = ['#D4A574','#60A5FA','#A78BFA','#4ADE80','#FBBF24','#F87171','#2D6B55','#7C3AED']

interface Props {
  customers: any[]
  allUsers: any[]
  userMap: Record<number, string>
  currentUser: any | null | undefined
}

export default function CardsView({ customers, allUsers, userMap, currentUser }: Props) {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 12,
    }}>
      {customers.map((c: any) => {
        const sTone = statusTone(c.status_note)
        const ownerName = userMap[c.user_id]
          || (c.user_id === currentUser?.id ? (currentUser.display_name || 'أدمن') : '')
        const ownerIdx = allUsers.findIndex(u => u.id === c.user_id)
        const ownerColor = ownerIdx >= 0 ? OWNER_COLORS[ownerIdx % OWNER_COLORS.length] : '#A8B2AD'
        return (
          <div
            key={c.id}
            className="card card-hover"
            style={{ padding: 18, cursor: 'pointer' }}
            onClick={() => navigate(`/customer/${c.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div className="avatar avatar-ring" style={{ width: 44, height: 44, fontSize: 16 }}>
                {initials(c.full_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }} className="truncate">
                  {c.full_name}
                </div>
                {c.phone_number && (
                  <div className="num muted" style={{ fontSize: 12 }}>{c.phone_number}</div>
                )}
              </div>
              {c.status_note && (
                <span className={`chip chip--${sTone}`} style={{ fontSize: 10.5 }}>
                  <span className="dot" style={{ background: 'currentColor' }} />
                  {c.status_note}
                </span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              padding: '12px 0',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div className="label-sm" style={{ marginBottom: 3 }}>الوزارة</div>
                <div className="truncate" style={{ fontSize: 12.5 }}>
                  {c.ministry_name || <span className="muted">-</span>}
                </div>
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 3 }}>المدة</div>
                <div className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {c.months_count ? `${c.months_count} شهر` : '-'}
                </div>
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 3 }}>المنصة</div>
                <div className="truncate" style={{ fontSize: 12.5 }}>
                  {c.platform_name || <span className="muted">-</span>}
                </div>
              </div>
              <div>
                <div className="label-sm" style={{ marginBottom: 3 }}>أُضيف</div>
                <div className="num muted" style={{ fontSize: 11.5 }}>
                  {formatDate(c.created_at)}
                </div>
              </div>
            </div>

            {ownerName && (
              <div style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <div className="avatar" style={{
                  width: 22, height: 22, fontSize: 9,
                  background: `${ownerColor}22`,
                  color: ownerColor,
                }}>{initials(ownerName)}</div>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  أضافه <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{ownerName}</strong>
                </span>
              </div>
            )}

            <div style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {c.category
                ? <span className="chip chip--brand" style={{ fontSize: 10.5 }}>{c.category}</span>
                : <span />}
              <div style={{ display: 'flex', gap: 4 }}>
                {c.phone_number && (
                  <button
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={(e) => { e.stopPropagation(); window.open(`tel:${c.phone_number}`) }}
                    title="اتصال"
                  >
                    <Icon name="phone" size={12} />
                  </button>
                )}
                <button
                  className="icon-btn"
                  style={{ width: 28, height: 28 }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/customer/${c.id}`) }}
                  title="عرض"
                >
                  <Icon name="eye" size={12} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
