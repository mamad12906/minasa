import React, { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import Icon from '../layout/Icon'
import { eventsStream, AppEvent } from '../../lib/events-stream'

/**
 * Live admin activity feed backed by the /api/events SSE stream.
 *
 * Shows the last [max] events with a "connected / disconnected" status
 * indicator. Keeps its own in-memory ring buffer — no persistence. A fresh
 * mount starts with an empty feed and fills as events arrive.
 */
export default function LiveActivity({ max = 25 }: { max?: number }) {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [connected, setConnected] = useState(eventsStream.connected)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const offEvent = eventsStream.on((e) => {
      setEvents((prev) => [e, ...prev].slice(0, max))
    })
    const offConn = eventsStream.onConnection(setConnected)
    return () => { offEvent(); offConn() }
  }, [max])

  const meta = eventMeta
  const dot = connected ? 'var(--success)' : 'var(--warning)'

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--success-bg)', color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="bell" size={15} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>النشاط المباشر</h3>
        <div style={{ flex: 1 }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11.5, color: 'var(--text-muted)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: dot,
            boxShadow: connected ? `0 0 0 3px color-mix(in srgb, ${dot} 30%, transparent)` : 'none',
          }} />
          {connected ? 'متصل' : 'انقطع الاتصال'}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="muted" style={{
          fontSize: 12.5, padding: 14, textAlign: 'center',
        }}>
          {connected
            ? 'لا توجد أحداث بعد — سيظهر أي تغيير هنا فوراً.'
            : 'في انتظار الاتصال بالسيرفر...'}
        </div>
      ) : (
        <div ref={scrollRef} style={{
          maxHeight: 360, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {events.map((e, i) => {
            const m = meta(e.kind)
            return (
              <div key={`${e.at}-${i}`} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--bg-elevated)',
                borderInlineStart: `3px solid ${m.color}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: `color-mix(in srgb, ${m.color} 14%, transparent)`,
                  color: m.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={m.icon as any} size={12} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                    <strong>{e.actor?.username || 'النظام'}</strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{m.verb}</span>{' '}
                    {e.entity_name && (
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {e.entity_name}
                      </strong>
                    )}
                  </div>
                  <div className="num" style={{
                    fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2,
                  }}>
                    {dayjs(e.at).format('HH:mm:ss')}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function eventMeta(kind: string): { verb: string; color: string; icon: string } {
  switch (kind) {
    case 'customer.created':  return { verb: 'أضاف زبوناً', color: 'var(--success)', icon: 'plus' }
    case 'customer.updated':  return { verb: 'عدّل زبوناً',  color: 'var(--info)',    icon: 'edit' }
    case 'customer.deleted':  return { verb: 'حذف زبوناً',   color: 'var(--danger)',  icon: 'trash' }
    case 'reminder.created':  return { verb: 'أضاف تذكيراً', color: 'var(--success)', icon: 'bell' }
    case 'reminder.updated':  return { verb: 'عدّل تذكيراً',  color: 'var(--info)',    icon: 'bell' }
    case 'reminder.deleted':  return { verb: 'حذف تذكيراً',   color: 'var(--danger)',  icon: 'bell' }
    case 'reminder.done':     return { verb: 'أنجز تذكيراً',  color: 'var(--success)', icon: 'check' }
    case 'invoice.created':   return { verb: 'أضاف فاتورة',  color: 'var(--success)', icon: 'invoice' }
    case 'invoice.updated':   return { verb: 'عدّل فاتورة',   color: 'var(--info)',    icon: 'invoice' }
    case 'invoice.deleted':   return { verb: 'حذف فاتورة',    color: 'var(--danger)',  icon: 'invoice' }
    case 'ministry.created':  return { verb: 'أضاف وزارة',   color: 'var(--success)', icon: 'building' }
    case 'ministry.deleted':  return { verb: 'حذف وزارة',    color: 'var(--danger)',  icon: 'building' }
    case 'user.created':      return { verb: 'أنشأ مستخدماً', color: 'var(--success)', icon: 'user' }
    case 'user.updated':      return { verb: 'عدّل مستخدماً', color: 'var(--info)',    icon: 'user' }
    case 'user.deleted':      return { verb: 'حذف مستخدماً',  color: 'var(--danger)',  icon: 'user' }
    case 'user.password_reset': return { verb: 'عيّن كلمة مرور', color: 'var(--warning)', icon: 'lock' }
    case 'auth.login':        return { verb: 'سجّل الدخول',  color: 'var(--success)', icon: 'logout' }
    case 'auth.login_failed': return { verb: 'فشل تسجيل دخول', color: 'var(--danger)', icon: 'lock' }
    default: return { verb: kind, color: 'var(--text-muted)', icon: 'dot3' }
  }
}
