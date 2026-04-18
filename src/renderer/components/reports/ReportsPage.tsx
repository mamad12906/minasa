import React, { useEffect, useMemo, useState } from 'react'
import { Spin, Empty, Modal, Table, Tag, message } from 'antd'
import dayjs from 'dayjs'
import { useAuth } from '../../App'
import Icon, { IconName } from '../layout/Icon'

interface ReportCardData {
  id: string
  title: string
  subtitle: string
  icon: IconName
  tone: 'brand' | 'accent' | 'danger' | 'info' | 'violet' | 'warning' | 'success'
}

const printCustomerCard = (customer: any) => {
  const endDate = customer.months_count && customer.created_at
    ? dayjs(customer.created_at).add(customer.months_count, 'month').format('YYYY-MM-DD')
    : '-'
  const w = window.open('', '_blank', 'width=600,height=800')
  if (!w) return
  w.document.write(`<html dir="rtl"><head><title>بطاقة زبون</title>
    <style>body{font-family:'Segoe UI',Tahoma,Arial;padding:30px;color:#1A1F1C}
    h1{text-align:center;color:#0F4C3A;border-bottom:3px solid #0F4C3A;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    td,th{padding:10px 14px;border:1px solid #E2DED5;text-align:right}
    th{background:#F7F5F0;font-weight:600;width:35%}
    .f{text-align:center;margin-top:30px;color:#94A3B8;font-size:12px}</style></head><body>
    <h1>بطاقة زبون - منصة</h1><table>
    <tr><th>الاسم</th><td>${customer.full_name}</td></tr>
    <tr><th>الهاتف</th><td>${customer.phone_number || '-'}</td></tr>
    <tr><th>البطاقة</th><td>${customer.card_number || '-'}</td></tr>
    <tr><th>المنصة</th><td>${customer.platform_name || '-'}</td></tr>
    <tr><th>الوزارة</th><td>${customer.ministry_name || '-'}</td></tr>
    <tr><th>الصنف</th><td>${customer.category || '-'}</td></tr>
    <tr><th>الأشهر</th><td>${customer.months_count || '-'}</td></tr>
    <tr><th>الانتهاء</th><td>${endDate}</td></tr>
    </table><div class="f">طُبعت ${dayjs().format('YYYY-MM-DD')} | منصة</div></body></html>`)
  w.document.close()
  setTimeout(() => w.print(), 500)
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export default function ReportsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [stats, setStats] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openReport, setOpenReport] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const userId = isAdmin ? undefined : user?.id
      const [s, r] = await Promise.all([
        window.api.dashboard.stats(userId),
        window.api.reminders.all(userId).catch(() => [] as any[]),
      ])
      setStats(s)
      setReminders(r || [])
      try {
        const ipc2 = (window as any).__ipc2
        const inv = await ipc2?.invoiceList?.({ page: 1, pageSize: 10000 })
        setInvoices(inv?.data || [])
      } catch {
        setInvoices([])
      }
    } catch (err) {
      console.error('[ReportsPage] Failed to load:', err)
    } finally { setLoading(false) }
  }

  const today = new Date().toISOString().split('T')[0]
  const overdueReminders = reminders.filter(r => r.is_done === 0 && r.reminder_date <= today)

  const totalRevenue = useMemo(
    () => invoices.reduce((acc: number, x: any) => acc + (Number(x.total_amount) || 0), 0),
    [invoices]
  )

  const monthlyData = useMemo(() => {
    // Compute last 12 months of customer additions from recentCustomers (best-effort)
    const now = dayjs()
    const months: Array<{ label: string; customers: number; revenue: number }> = []
    for (let i = 11; i >= 0; i--) {
      const m = now.subtract(i, 'month')
      months.push({
        label: MONTHS_AR[m.month()],
        customers: 0,
        revenue: 0,
      })
    }
    if (stats?.recentCustomers) {
      (stats.recentCustomers as any[]).forEach(c => {
        const d = dayjs(c.created_at)
        if (!d.isValid()) return
        const diffMonths = now.diff(d, 'month')
        if (diffMonths >= 0 && diffMonths < 12) {
          months[11 - diffMonths].customers++
        }
      })
    }
    invoices.forEach(inv => {
      const d = dayjs(inv.creation_date || inv.created_at)
      if (!d.isValid()) return
      const diffMonths = now.diff(d, 'month')
      if (diffMonths >= 0 && diffMonths < 12) {
        months[11 - diffMonths].revenue += Number(inv.total_amount) || 0
      }
    })
    return months
  }, [stats, invoices])

  const maxCustomers = Math.max(...monthlyData.map(m => m.customers), 1)
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)

  if (loading || !stats) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  const reports: ReportCardData[] = [
    {
      id: 'customers',
      title: 'تقرير الزبائن الشهري',
      subtitle: `${stats.totalCustomers.toLocaleString('en-US')} زبون · آخر 30 يوم`,
      icon: 'users',
      tone: 'brand',
    },
    {
      id: 'revenue',
      title: 'تقرير الإيرادات',
      subtitle: `${totalRevenue.toLocaleString('en-US')} د.ع`,
      icon: 'chart',
      tone: 'accent',
    },
    {
      id: 'overdue',
      title: 'تقرير التذكيرات المتأخرة',
      subtitle: overdueReminders.length > 0
        ? `${overdueReminders.length} تذكير · عاجل`
        : 'لا توجد تذكيرات متأخرة',
      icon: 'bell',
      tone: 'danger',
    },
    ...(isAdmin && stats.employeeStats?.length > 0 ? [{
      id: 'employees',
      title: 'تقرير أداء الموظفين',
      subtitle: `${stats.employeeStats.length} موظفين`,
      icon: 'crown' as IconName,
      tone: 'info' as const,
    }] : []),
    {
      id: 'ministries',
      title: 'تقرير الوزارات',
      subtitle: `${stats.ministryBreakdown.length} وزارة`,
      icon: 'building',
      tone: 'violet',
    },
    {
      id: 'invoices',
      title: 'تقرير الفواتير',
      subtitle: `${invoices.length.toLocaleString('en-US')} فاتورة`,
      icon: 'invoice',
      tone: 'warning',
    },
  ]

  // ===== Report content mapper =====
  const reportContent = () => {
    switch (openReport) {
      case 'customers':
        return {
          title: 'تقرير الزبائن الشهري',
          node: (
            <Table
              dataSource={stats.recentCustomers || []}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'الاسم', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
                { title: 'الهاتف', dataIndex: 'phone_number' },
                { title: 'الوزارة', dataIndex: 'ministry_name' },
                { title: 'الصنف', dataIndex: 'category', render: (v: string) => v ? <span className="chip chip--brand">{v}</span> : '-' },
                { title: 'التاريخ', dataIndex: 'created_at', width: 140, render: (v: string) => <span className="num">{(v || '').split('T')[0]}</span> },
                { title: '', key: 'print', width: 50, render: (_: any, r: any) => (
                  <button className="icon-btn" onClick={() => printCustomerCard(r)} title="طباعة">
                    <Icon name="printer" size={13} />
                  </button>
                )},
              ]}
            />
          ),
        }
      case 'revenue':
        return {
          title: 'تقرير الإيرادات',
          node: invoices.length === 0 ? (
            <Empty description="لا توجد فواتير" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 16,
              }}>
                <div className="card-flat" style={{ padding: 14 }}>
                  <div className="label-sm">إجمالي الإيرادات</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
                    {totalRevenue.toLocaleString('en-US')}
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>دينار عراقي</div>
                </div>
                <div className="card-flat" style={{ padding: 14 }}>
                  <div className="label-sm">عدد الفواتير</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
                    {invoices.length.toLocaleString('en-US')}
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>فاتورة</div>
                </div>
                <div className="card-flat" style={{ padding: 14 }}>
                  <div className="label-sm">متوسط الفاتورة</div>
                  <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
                    {invoices.length ? Math.round(totalRevenue / invoices.length).toLocaleString('en-US') : 0}
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>د.ع/فاتورة</div>
                </div>
              </div>
              <Table
                dataSource={invoices.slice(0, 20)}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: 'الفاتورة', dataIndex: 'invoice_number', render: (v: string) => <span className="mono">#{v}</span> },
                  { title: 'الزبون', dataIndex: 'customer_name' },
                  { title: 'المبلغ', dataIndex: 'total_amount', render: (v: number) => <span className="num">{Number(v).toLocaleString('en-US')}</span> },
                  { title: 'التاريخ', dataIndex: 'creation_date', render: (v: string) => <span className="num">{v}</span> },
                  { title: 'الحالة', dataIndex: 'status', render: (s: string) => {
                    const tone = s === 'مدفوعة' ? 'success' : s === 'متأخرة' ? 'danger' : s?.includes('معل') ? 'warning' : 'neutral'
                    return <span className={`chip chip--${tone}`}>{s || '-'}</span>
                  }},
                ]}
              />
            </div>
          ),
        }
      case 'overdue':
        return {
          title: 'التذكيرات المتأخرة',
          node: overdueReminders.length === 0 ? (
            <Empty description="لا توجد تذكيرات متأخرة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              dataSource={overdueReminders}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 10 }}
              columns={[
                { title: 'الزبون', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
                { title: 'الهاتف', dataIndex: 'phone_number' },
                { title: 'نص التذكير', dataIndex: 'reminder_text' },
                { title: 'التاريخ', dataIndex: 'reminder_date', render: (v: string) => <span className="num" style={{ color: 'var(--danger)' }}>{v}</span> },
              ]}
            />
          ),
        }
      case 'employees':
        return {
          title: 'أداء الموظفين',
          node: (
            <div>
              {(stats.employeeStats || []).map((emp: any, i: number) => {
                const maxCount = stats.employeeStats[0]?.customer_count || 1
                const pct = Math.round((emp.customer_count / maxCount) * 100)
                const colors = ['#D4A574', '#60A5FA', '#A78BFA', '#4ADE80', '#FBBF24', '#F87171']
                const color = colors[i % colors.length]
                return (
                  <div key={emp.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 500 }}>{emp.display_name}</span>
                      <span className="num" style={{ fontWeight: 600 }}>
                        {emp.customer_count.toLocaleString('en-US')} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>زبون</span>
                      </span>
                    </div>
                    <div className="progress" style={{ height: 6 }}>
                      <span style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ),
        }
      case 'ministries':
        return {
          title: 'تقرير الوزارات',
          node: (
            <Table
              dataSource={stats.ministryBreakdown}
              rowKey={(r) => r.ministry_name}
              size="small"
              pagination={false}
              columns={[
                { title: '#', key: 'idx', width: 40, render: (_, __, i) => <span className="num muted">{i + 1}</span> },
                { title: 'الوزارة', dataIndex: 'ministry_name' },
                { title: 'عدد الزبائن', dataIndex: 'count', render: (v: number) => <span className="num" style={{ fontWeight: 600 }}>{v.toLocaleString('en-US')}</span> },
                { title: 'النسبة', key: 'pct', render: (_: any, r: any) => {
                  const pct = stats.totalCustomers > 0 ? (r.count / stats.totalCustomers) * 100 : 0
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ flex: 1 }}>
                        <span style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                      </div>
                      <span className="num muted" style={{ fontSize: 11.5, minWidth: 40 }}>{pct.toFixed(1)}%</span>
                    </div>
                  )
                }},
              ]}
            />
          ),
        }
      case 'invoices':
        return {
          title: 'تقرير الفواتير',
          node: invoices.length === 0 ? (
            <Empty description="لا توجد فواتير" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              dataSource={invoices}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 15 }}
              columns={[
                { title: 'الفاتورة', dataIndex: 'invoice_number', render: (v: string) => <span className="mono">#{v}</span> },
                { title: 'الزبون', dataIndex: 'customer_name' },
                { title: 'المبلغ', dataIndex: 'total_amount', render: (v: number) => <span className="num">{Number(v).toLocaleString('en-US')}</span> },
                { title: 'الأشهر', dataIndex: 'total_months', render: (v: number) => <span className="num">{v}</span> },
                { title: 'التاريخ', dataIndex: 'creation_date', render: (v: string) => <span className="num">{v}</span> },
                { title: 'الحالة', dataIndex: 'status', render: (s: string) => {
                  const tone = s === 'مدفوعة' ? 'success' : s === 'متأخرة' ? 'danger' : s?.includes('معل') ? 'warning' : 'neutral'
                  return <span className={`chip chip--${tone}`}>{s || '-'}</span>
                }},
              ]}
            />
          ),
        }
      default:
        return { title: '', node: null }
    }
  }

  const current = reportContent()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ===== Report cards grid ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {reports.map((r) => {
          const toneBg = (r.tone === 'brand' || r.tone === 'accent') ? `var(--${r.tone}-tint)` : `var(--${r.tone}-bg)`
          return (
            <div
              key={r.id}
              className="card card-hover"
              style={{ padding: 20, cursor: 'pointer' }}
              onClick={() => setOpenReport(r.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: toneBg, color: `var(--${r.tone})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name={r.icon} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {r.title}
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{r.subtitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ flex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setOpenReport(r.id) }}
                >
                  <Icon name="eye" size={12} /> عرض
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={(e) => { e.stopPropagation(); message.info('التصدير قريبًا') }}
                  title="تصدير"
                >
                  <Icon name="download" size={12} />
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={(e) => { e.stopPropagation(); setOpenReport(r.id); setTimeout(() => window.print(), 500) }}
                  title="طباعة"
                >
                  <Icon name="printer" size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== 12-month chart ===== */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div className="eyebrow">آخر 12 شهر</div>
            <h3 style={{ fontSize: 16, marginTop: 4, fontWeight: 600 }}>تطوّر الزبائن والإيرادات</h3>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot" style={{ background: 'var(--brand)' }} /> الزبائن
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot" style={{ background: 'var(--accent)' }} /> الإيرادات
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200 }}>
          {monthlyData.map((m, i) => {
            const h1 = (m.customers / maxCustomers) * 100
            const h2 = (m.revenue / maxRevenue) * 100
            return (
              <div key={i} style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: '100%',
                  display: 'flex',
                  gap: 3,
                  alignItems: 'flex-end',
                  height: 160,
                }}>
                  <div style={{
                    flex: 1,
                    height: `${Math.max(h1, 2)}%`,
                    background: m.customers > 0 ? 'var(--brand)' : 'var(--border-subtle)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }} title={`زبائن: ${m.customers}`} />
                  <div style={{
                    flex: 1,
                    height: `${Math.max(h2, 2)}%`,
                    background: m.revenue > 0 ? 'var(--accent)' : 'var(--border-subtle)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                  }} title={`إيرادات: ${m.revenue.toLocaleString()}`} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{m.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Report details modal ===== */}
      <Modal
        title={current.title}
        open={!!openReport}
        onCancel={() => setOpenReport(null)}
        footer={null}
        width={880}
        destroyOnClose
      >
        {current.node}
      </Modal>
    </div>
  )
}
