import React, { useEffect, useState, useMemo } from 'react'
import { Spin, Empty } from 'antd'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'
import Sparkline from './Sparkline'

const asLatin = (n: string | number) => String(n)
const fmt = (n: number) => n.toLocaleString('en-US')

// Weekday short-labels (Sat→Fri) in Arabic
const DAY_LABELS = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج']
const DAY_NAMES  = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

const EMPLOYEE_COLORS = ['#D4A574', '#60A5FA', '#A78BFA', '#4ADE80', '#FBBF24', '#F87171', '#2D6B55', '#3A8069']
const CATEGORY_COLORS = ['#2D6B55', '#D4A574', '#60A5FA', '#A78BFA', '#FBBF24', '#F87171', '#4ADE80', '#7C3AED']

function initials(name: string): string {
  if (!name) return 'م'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || 'م'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

function timeAgoAr(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffMin < 1) return 'الآن'
  if (diffMin < 60) return `قبل ${asLatin(diffMin)} دقيقة`
  if (diffHr < 24) return `قبل ${asLatin(diffHr)} ساعة`
  if (diffDay === 1) return 'أمس'
  if (diffDay < 7) return `قبل ${asLatin(diffDay)} أيام`
  return iso.split('T')[0] || iso
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [invoiceStats, setInvoiceStats] = useState<{ total: number; revenue: number }>({ total: 0, revenue: 0 })
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timelinePeriod, setTimelinePeriod] = useState<7 | 30 | 90>(7)

  const isAdmin = user?.role === 'admin'
  const userId = (!isAdmin && user?.id) ? user.id : undefined

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const ipc2 = (window as any).__ipc2
      const [s, rems] = await Promise.all([
        window.api.dashboard.stats(userId),
        window.api.reminders.all(userId).catch(() => [] as any[]),
      ])
      setStats(s)
      setReminders(rems || [])

      // Invoices (via local IPC only; may not exist in server-only mode)
      try {
        const full = await ipc2?.invoiceList?.({ page: 1, pageSize: 10000 })
        if (full && full.data) {
          const revenue = (full.data as any[]).reduce(
            (acc, x) => acc + (Number(x.total_amount) || 0),
            0,
          )
          setInvoiceStats({ total: full.total || 0, revenue })
        } else {
          setInvoiceStats({ total: 0, revenue: 0 })
        }
      } catch (err) {
        console.warn('[Dashboard] Invoice fetch failed:', err)
        setInvoiceStats({ total: 0, revenue: 0 })
      }
    } catch (err) {
      console.error('[Dashboard] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  // Timeline: count customers added per day for last N days
  const timeline = useMemo(() => {
    if (!stats?.recentCustomers) return [] as Array<{ d: string; v: number; name: string }>
    const n = timelinePeriod
    const days: Array<{ key: string; d: string; v: number; name: string }> = []
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date()
      dt.setDate(dt.getDate() - i)
      const iso = dt.toISOString().split('T')[0]
      const dayIdx = (dt.getDay() + 1) % 7 // Saturday = 0
      days.push({ key: iso, d: DAY_LABELS[dayIdx], v: 0, name: DAY_NAMES[dayIdx] })
    }
    // Count recentCustomers per day
    ;(stats.recentCustomers as any[]).forEach(c => {
      const iso = (c.created_at || '').split('T')[0].split(' ')[0]
      const entry = days.find(d => d.key === iso)
      if (entry) entry.v++
    })
    return days
  }, [stats, timelinePeriod])

  const timelineStats = useMemo(() => {
    const total = timeline.reduce((a, b) => a + b.v, 0)
    const max = timeline.reduce((a, b) => (b.v > a.v ? b : a), { v: 0, name: '-' } as any)
    const avg = timeline.length ? total / timeline.length : 0
    return { total, maxDay: max, avg }
  }, [timeline])

  const overdueCount = reminders.filter(r => r.is_done === 0 && r.reminder_date <= today).length
  const activeCount = reminders.filter(r => r.is_done === 0).length

  // Mock sparkline data (trending)
  const sparkCustomers = [30, 45, 50, 62, 58, 72, 80, 95, stats?.totalCustomers ? Math.max(30, Math.min(110, stats.totalCustomers / 50)) : 110]
  const sparkInvoices = [60, 65, 70, 68, 78, 85, 92, 88, 104]
  const sparkRevenue = [50, 58, 55, 70, 75, 82, 78, 95, 100]
  const sparkRem = [14, 20, 18, 22, 19, 25, activeCount || 24]

  if (loading || !stats) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  const categoryBreakdown = stats.categoryBreakdown || []
  const ministryBreakdown = stats.ministryBreakdown || []
  const employeeStats = stats.employeeStats || []
  const recentCustomers = (stats.recentCustomers || []).slice(0, 6)

  const maxEmp = Math.max(...(employeeStats.map((e: any) => e.customer_count) as number[]), 1)
  const maxMinistry = Math.max(...(ministryBreakdown.map((m: any) => m.count) as number[]), 1)
  const maxTimeline = Math.max(...timeline.map(t => t.v), 1)

  // Compact revenue formatter (e.g., 247.8 م / 1.2 مليار)
  const fmtRevenue = (v: number): string => {
    if (v >= 1_000_000_000) return asLatin((v / 1_000_000_000).toFixed(1)) + ' مليار'
    if (v >= 1_000_000) return asLatin((v / 1_000_000).toFixed(1)) + ' م'
    if (v >= 1_000) return asLatin((v / 1_000).toFixed(1)) + ' ألف'
    return asLatin(String(v))
  }

  const KPITile = ({ label, value, delta, deltaTone, sparkData, sparkColor, icon, sublabel }: {
    label: string
    value: string
    delta?: string
    deltaTone?: 'success' | 'danger' | 'warning' | 'info'
    sparkData?: number[]
    sparkColor?: string
    icon: any
    sublabel?: string
  }) => (
    <div className="kpi" style={{ minHeight: 138 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="kpi__label">{label}</div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--brand-tint)', color: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} />
        </div>
      </div>
      <div className="kpi__value num">{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, minWidth: 0 }}>
          {delta && (
            <span className={`chip chip--${deltaTone || 'success'}`} style={{ height: 20, padding: '0 7px', fontSize: 11 }}>
              <Icon name={deltaTone === 'danger' ? 'arrow_down' : 'arrow_up'} size={10} stroke={2.3} />
              {delta}
            </span>
          )}
          {sublabel && <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sublabel}</span>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || 'var(--brand)'} w={100} h={32} />}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ===== KPI Row ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KPITile
          label="إجمالي الزبائن"
          value={fmt(stats.totalCustomers || 0)}
          delta="+8.2%"
          deltaTone="success"
          sparkData={sparkCustomers}
          sparkColor="#2D6B55"
          sublabel="هذا الشهر"
          icon="users"
        />
        <KPITile
          label="الفواتير"
          value={fmt(invoiceStats.total || 0)}
          delta="+12%"
          deltaTone="success"
          sparkData={sparkInvoices}
          sparkColor="#D4A574"
          sublabel="هذا الشهر"
          icon="invoice"
        />
        <KPITile
          label="الإيرادات (د.ع)"
          value={fmtRevenue(invoiceStats.revenue)}
          delta="+5.4%"
          deltaTone="success"
          sparkData={sparkRevenue}
          sparkColor="#60A5FA"
          sublabel="هذا الشهر"
          icon="chart"
        />
        <KPITile
          label="تذكيرات نشطة"
          value={fmt(activeCount)}
          delta={overdueCount > 0 ? `${asLatin(overdueCount)} متأخرة` : 'لا متأخرات'}
          deltaTone={overdueCount > 0 ? 'danger' : 'success'}
          sparkData={sparkRem}
          sparkColor="#F87171"
          sublabel="تحتاج متابعة"
          icon="bell"
        />
      </div>

      {/* ===== Timeline + Employees ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        {/* Timeline card */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                {timelinePeriod === 7 ? 'آخر 7 أيام' : timelinePeriod === 30 ? 'آخر 30 يوم' : 'آخر 90 يوم'}
              </div>
              <h3 style={{ fontSize: 17, margin: 0 }}>الزبائن المُضافون</h3>
            </div>
            <div className="seg">
              {[
                { n: 7, label: '7 أيام' },
                { n: 30, label: '30 يوم' },
                { n: 90, label: '90 يوم' },
              ].map(p => (
                <button
                  key={p.n}
                  className={timelinePeriod === p.n ? 'active' : ''}
                  onClick={() => setTimelinePeriod(p.n as 7 | 30 | 90)}
                >{p.label}</button>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          {(() => {
            const CHART_H = 180
            const LABEL_H = timelinePeriod === 7 ? 18 : 0
            const VALUE_H = 16
            const GAP = 8
            const BAR_MAX = CHART_H - LABEL_H - VALUE_H - GAP * 2
            return (
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: timelinePeriod === 7 ? 16 : 4,
                height: CHART_H,
                padding: '0 4px',
              }}>
                {timeline.map((t, i) => {
                  const h = maxTimeline > 0 ? (t.v / maxTimeline) * BAR_MAX : 0
                  const isMax = t.v === maxTimeline && t.v > 0
                  return (
                    <div key={i} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: GAP,
                      minWidth: 0,
                      height: '100%',
                    }}>
                      <div className="num" style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        height: VALUE_H,
                        lineHeight: `${VALUE_H}px`,
                      }}>
                        {asLatin(t.v)}
                      </div>
                      <div style={{
                        width: '100%',
                        height: Math.max(h, t.v > 0 ? 4 : 2),
                        background: isMax
                          ? 'linear-gradient(180deg, var(--brand-hover) 0%, var(--brand) 100%)'
                          : t.v > 0 ? 'var(--brand-tint-hi)' : 'var(--border-subtle)',
                        borderRadius: '8px 8px 2px 2px',
                        border: `1px solid ${isMax ? 'var(--brand)' : 'var(--border)'}`,
                        transition: 'all 0.3s ease',
                      }} />
                      {timelinePeriod === 7 && (
                        <div style={{
                          fontSize: 11,
                          color: isMax ? 'var(--brand)' : 'var(--text-muted)',
                          fontWeight: 600,
                          height: LABEL_H,
                          lineHeight: `${LABEL_H}px`,
                        }}>{t.d}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}

          <div className="hr" style={{ margin: '22px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>متوسط يومي</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{asLatin(timelineStats.avg.toFixed(1))}</div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>أعلى يوم</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>
                {asLatin(timelineStats.maxDay.v || 0)}
                {timelineStats.maxDay.v > 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginRight: 6 }}>
                    · {timelineStats.maxDay.name}
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="label-sm" style={{ marginBottom: 4 }}>الإجمالي</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{asLatin(timelineStats.total)}</div>
            </div>
          </div>
        </div>

        {/* Employees */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>أداء الفريق</div>
              <h3 style={{ fontSize: 17, margin: 0 }}>الموظفون</h3>
            </div>
            <button className="btn btn--sm btn--quiet">عرض الكل</button>
          </div>
          {employeeStats.length === 0 ? (
            <Empty description="لا موظفون" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {employeeStats.slice(0, 6).map((e: any, i: number) => {
                const pct = (e.customer_count / maxEmp) * 100
                const color = EMPLOYEE_COLORS[i % EMPLOYEE_COLORS.length]
                return (
                  <div key={e.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                      <div className="avatar" style={{
                        width: 28, height: 28,
                        background: `${color}22`, color, fontSize: 11,
                      }}>{initials(e.display_name)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="truncate" style={{ fontSize: 13, fontWeight: 500 }}>{e.display_name}</div>
                      </div>
                      <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fmt(e.customer_count)}</div>
                    </div>
                    <div className="progress" style={{ height: 3 }}>
                      <span style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== Categories + Ministries ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Categories */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0 }}>توزيع الأصناف</h3>
            <span className="chip chip--neutral">{asLatin(categoryBreakdown.length)} أصناف</span>
          </div>
          {categoryBreakdown.length === 0 ? (
            <Empty description="لا توجد أصناف" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : categoryBreakdown.map((c: any, i: number) => {
            const pct = stats.totalCustomers > 0 ? (c.count / stats.totalCustomers) * 100 : 0
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 0',
                borderBottom: i < categoryBreakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <span className="dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], width: 8, height: 8 }} />
                <div style={{ flex: 1, fontSize: 13 }}>{c.category}</div>
                <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fmt(c.count)}</div>
                <div className="num" style={{ fontSize: 12, color: 'var(--text-muted)', width: 50, textAlign: 'left' }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Ministries */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0 }}>أعلى الوزارات</h3>
            <span className="chip chip--neutral">{asLatin(ministryBreakdown.length)} وزارة</span>
          </div>
          {ministryBreakdown.length === 0 ? (
            <Empty description="لا توجد وزارات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : ministryBreakdown.slice(0, 7).map((m: any, i: number) => {
            const pct = (m.count / maxMinistry) * 100
            return (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < Math.min(ministryBreakdown.length, 7) - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="num muted" style={{ fontSize: 11, width: 16 }}>{asLatin(i + 1)}.</span>
                  <div style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.ministry_name}
                  </div>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fmt(m.count)}</div>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Recent customers ===== */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--brand-tint)', color: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="user" size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: 15 }}>آخر الزبائن المُضافين</h3>
          </div>
          <span className="chip chip--neutral">{asLatin(recentCustomers.length)}</span>
        </div>
        {recentCustomers.length === 0 ? (
          <div style={{ padding: 20 }}>
            <Empty description="لا زبائن حديثو الإضافة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <table className="dtable">
            <thead>
              <tr>
                <th>الزبون</th>
                <th>الصنف</th>
                <th>الوزارة</th>
                <th>المدة</th>
                <th>أُضيف</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                        {c.full_name?.[0] || 'م'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{c.full_name}</div>
                        {c.phone_number && (
                          <div className="num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {asLatin(c.phone_number)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{c.category ? <span className="chip chip--brand">{c.category}</span> : <span className="muted">-</span>}</td>
                  <td style={{ fontSize: 12.5 }}>{c.ministry_name || <span className="muted">-</span>}</td>
                  <td>{c.months_count ? <span className="num">{asLatin(c.months_count)} شهر</span> : <span className="muted">-</span>}</td>
                  <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{timeAgoAr(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
