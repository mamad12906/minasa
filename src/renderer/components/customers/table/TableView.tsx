import React from 'react'
import { useNavigate } from 'react-router-dom'
import type { CustomColumn } from '../../../types'
import { statusTone, initials, formatDate } from './shared'

interface Props {
  customers: any[]
  customColumns: CustomColumn[]
  visibleCols: string[]
  userMap: Record<number, string>
  currentUser: any | null | undefined
  isAdmin: boolean
}

export default function TableView({ customers, customColumns, visibleCols, userMap, currentUser, isAdmin }: Props) {
  const navigate = useNavigate()
  const showCol = (k: string) => visibleCols.includes(k)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="dtable" style={{ minWidth: 1000 }}>
          <thead>
            <tr>
              {showCol('full_name') && <th>الزبون</th>}
              {showCol('phone_number') && <th>الهاتف</th>}
              {showCol('platform_name') && <th>المنصة</th>}
              {showCol('ministry_name') && <th>الوزارة</th>}
              {showCol('category') && <th>الصنف</th>}
              {showCol('months_count') && <th>المدة</th>}
              {showCol('status_note') && <th>الحالة</th>}
              {showCol('user_id') && isAdmin && <th>الموظف</th>}
              {showCol('created_at') && <th>أُضيف</th>}
              {customColumns.map(col =>
                showCol(col.column_name) ? <th key={col.column_name}>{col.display_name}</th> : null
              )}
            </tr>
          </thead>
          <tbody>
            {customers.map((c: any) => (
              <tr
                key={c.id}
                onClick={() => navigate(`/customer/${c.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {showCol('full_name') && (
                  <td style={{ minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12.5, flexShrink: 0 }}>
                        {initials(c.full_name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{c.full_name}</div>
                        {c.mother_name && (
                          <div className="muted" style={{ fontSize: 11 }}>والدة: {c.mother_name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                )}
                {showCol('phone_number') && (
                  <td>
                    {c.phone_number
                      ? <span className="num" style={{ fontSize: 12.5 }}>{c.phone_number}</span>
                      : <span className="muted">-</span>}
                  </td>
                )}
                {showCol('platform_name') && (
                  <td style={{ fontSize: 12.5 }}>{c.platform_name || <span className="muted">-</span>}</td>
                )}
                {showCol('ministry_name') && (
                  <td className="truncate" style={{ maxWidth: 140, fontSize: 12.5 }}>
                    {c.ministry_name || <span className="muted">-</span>}
                  </td>
                )}
                {showCol('category') && (
                  <td>
                    {c.category
                      ? <span className="chip chip--brand" style={{ fontSize: 11 }}>{c.category}</span>
                      : <span className="muted">-</span>}
                  </td>
                )}
                {showCol('months_count') && (
                  <td>
                    {c.months_count
                      ? <span className="num">{c.months_count} شهر</span>
                      : <span className="muted">-</span>}
                  </td>
                )}
                {showCol('status_note') && (
                  <td>
                    {c.status_note
                      ? (
                        <span className={`chip chip--${statusTone(c.status_note)}`} style={{ fontSize: 11 }}>
                          <span className="dot" style={{ background: 'currentColor' }} />
                          {c.status_note}
                        </span>
                      )
                      : <span className="muted">-</span>}
                  </td>
                )}
                {showCol('user_id') && isAdmin && (
                  <td>
                    {userMap[c.user_id]
                      ? (
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 10.5 }}>
                          {initials(userMap[c.user_id])}
                        </div>
                      )
                      : c.user_id === currentUser?.id
                        ? <span className="chip chip--accent" style={{ fontSize: 10.5 }}>أدمن</span>
                        : <span className="muted">-</span>}
                  </td>
                )}
                {showCol('created_at') && (
                  <td className="num muted" style={{ fontSize: 11.5 }}>{formatDate(c.created_at)}</td>
                )}
                {customColumns.map(col =>
                  showCol(col.column_name)
                    ? <td key={col.column_name} style={{ fontSize: 12.5 }}>{c[col.column_name] || <span className="muted">-</span>}</td>
                    : null
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
