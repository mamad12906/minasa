import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../layout/Icon'

interface Props {
  invoices: any[]
}

export default function InvoicesCard({ invoices }: Props) {
  const navigate = useNavigate()

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="invoice" size={14} />
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>الفواتير</h4>
        </div>
        <span className="chip chip--neutral" style={{ fontSize: 10.5 }}>
          <span className="num">{invoices.length}</span>
        </span>
      </div>
      {invoices.length === 0 ? (
        <div style={{
          padding: '20px 10px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12.5,
        }}>
          لا توجد فواتير
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {invoices.slice(0, 5).map((f: any, i: number) => {
              const sTone = f.status === 'مدفوعة' ? 'success'
                : f.status === 'معلّقة' || f.status === 'معلقة' ? 'warning'
                : f.status === 'متأخرة' ? 'danger'
                : 'neutral'
              return (
                <div key={f.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < Math.min(invoices.length, 5) - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>
                      #{f.invoice_number}
                    </div>
                    <div className="num muted" style={{ fontSize: 11, marginTop: 2 }}>
                      {Number(f.total_amount || 0).toLocaleString('en-US')} د.ع
                    </div>
                  </div>
                  <span className={`chip chip--${sTone}`} style={{ fontSize: 10.5, flexShrink: 0 }}>
                    {f.status || 'مسودة'}
                  </span>
                </div>
              )
            })}
          </div>
          <button
            className="btn btn--ghost btn--sm"
            style={{ width: '100%', marginTop: 10 }}
            onClick={() => navigate('/invoices')}
          >
            عرض جميع الفواتير
          </button>
        </>
      )}
    </div>
  )
}
