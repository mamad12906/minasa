import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button, Input, message, Select, Checkbox, Popover, InputNumber, Spin, Empty } from 'antd'
import type { Customer, CustomColumn } from '../../types'
import { useAuth } from '../../App'
import Icon from '../layout/Icon'
import { useTopbarState } from '../layout/TopbarContext'

type ViewMode = 'table' | 'cards' | 'split'

const ALL_COLUMN_KEYS = ['full_name', 'platform_name', 'phone_number', 'ministry_name', 'category', 'months_count', 'status_note', 'created_at', 'user_id']
const COLUMN_LABELS: Record<string, string> = {
  full_name: 'اسم الزبون',
  platform_name: 'المنصة',
  phone_number: 'رقم الهاتف',
  ministry_name: 'الوزارة',
  category: 'الصنف',
  months_count: 'عدد الأشهر',
  status_note: 'الحالة',
  created_at: 'تاريخ الإنشاء',
  user_id: 'الموظف',
}

function statusTone(s?: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!s) return 'neutral'
  if (s.includes('نشط') || s.includes('مكتمل') || s.includes('تم')) return 'success'
  if (s.includes('انتظار') || s.includes('قيد') || s.includes('معلّق') || s.includes('معلق')) return 'warning'
  if (s.includes('منتهي') || s.includes('متأخر') || s.includes('ملغي') || s.includes('رفض')) return 'danger'
  return 'neutral'
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0] || '?'
  return (parts[0][0] || '') + '.' + (parts[parts.length - 1][0] || '')
}

function formatDate(d?: string): string {
  if (!d) return '-'
  const onlyDate = d.split('T')[0].split(' ')[0]
  return onlyDate
}

function CustomerTable() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [platform, setPlatform] = useState<string | undefined>()
  const [category, setCategory] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [platforms, setPlatforms] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [filterUserId, setFilterUserId] = useState<number | undefined>()
  const [filterMonths, setFilterMonths] = useState<number | undefined>()
  const [filterMinistry, setFilterMinistry] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>()
  const [filterDateFrom, setFilterDateFrom] = useState<string | undefined>()
  const [filterDateTo, setFilterDateTo] = useState<string | undefined>()
  const [savedFilters, setSavedFilters] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('minasa_saved_filters') || '[]') } catch { return [] }
  })
  const [visibleCols, setVisibleCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('minasa_visible_cols')
      if (saved) return JSON.parse(saved)
    } catch {}
    return ['full_name', 'phone_number', 'platform_name', 'ministry_name', 'category', 'months_count', 'status_note', 'created_at', 'user_id']
  })

  // Ministries + statuses derived from currently-loaded customers
  const [ministries, setMinistries] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('minasa_customers_view') as ViewMode | null
    if (saved === 'table' || saved === 'cards' || saved === 'split') return saved
    return 'cards'
  })
  const [splitSelectedId, setSplitSelectedId] = useState<number | null>(null)
  const [splitReminders, setSplitReminders] = useState<any[]>([])
  const [splitHistory, setSplitHistory] = useState<any[]>([])

  // Auto-select first customer when entering split view
  useEffect(() => {
    if (viewMode === 'split' && splitSelectedId === null && customers.length > 0) {
      setSplitSelectedId(customers[0].id)
    }
  }, [viewMode, customers, splitSelectedId])

  // Load reminders + history for split selection
  useEffect(() => {
    if (!splitSelectedId) { setSplitReminders([]); setSplitHistory([]); return }

    Promise.resolve(window.api.customer.reminders(splitSelectedId))
      .then((r: any) => setSplitReminders(Array.isArray(r) ? r : []))
      .catch(() => setSplitReminders([]))

    const historyFn = (window as any).__localApi?.customer?.history
    if (typeof historyFn === 'function') {
      Promise.resolve(historyFn(splitSelectedId))
        .then((h: any) => setSplitHistory(Array.isArray(h) ? h : []))
        .catch(() => setSplitHistory([]))
    } else {
      setSplitHistory([])
    }
  }, [splitSelectedId])

  const changeView = (v: ViewMode) => {
    setViewMode(v)
    localStorage.setItem('minasa_customers_view', v)
  }

  const isAdmin = user?.role === 'admin'
  const effectiveUserId = isAdmin ? filterUserId : user?.id

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.customer.list({ page, pageSize, search, platform, category, userId: effectiveUserId })
      setCustomers(result?.data || []); setTotal(result?.total || 0)
    } catch (err) { console.error('[CustomerTable] Failed to load customers:', err) } finally { setLoading(false) }
  }, [page, pageSize, search, platform, category, effectiveUserId])

  const loadFilters = async () => {
    const [p, c] = await Promise.all([window.api.customer.platforms(), window.api.customer.categories()])
    setPlatforms(p || []); setCategories(c || [])
  }

  const loadCustomColumns = async () => { setCustomColumns(await window.api.columns.list('customers')) }
  const loadUsers = async () => { if (isAdmin) setAllUsers(await window.api.users.list()) }

  const userMap: Record<number, string> = {}
  allUsers.forEach((u: any) => { userMap[u.id] = u.display_name })

  useEffect(() => { loadCustomers() }, [loadCustomers])
  useEffect(() => { loadFilters(); loadCustomColumns(); loadUsers(); loadDistinctFilters() }, [])

  const loadDistinctFilters = async () => {
    try {
      const stats = await window.api.dashboard.stats(undefined)
      const mins = (stats?.ministryBreakdown || []).map((m: any) => m.ministry_name).filter(Boolean)
      setMinistries(mins)
      // Distinct statuses from recent customers
      const seen = new Set<string>()
      ;(stats?.recentCustomers || []).forEach((c: any) => {
        if (c.status_note) seen.add(c.status_note)
      })
      setStatuses(Array.from(seen))
    } catch {}
  }

  const toggleCol = (key: string) => {
    const updated = visibleCols.includes(key) ? visibleCols.filter(k => k !== key) : [...visibleCols, key]
    setVisibleCols(updated)
    localStorage.setItem('minasa_visible_cols', JSON.stringify(updated))
  }


  // Augment ministry/status options with anything seen on the current page
  useEffect(() => {
    const ms = new Set(ministries)
    const ss = new Set(statuses)
    customers.forEach((c: any) => {
      if (c.ministry_name) ms.add(c.ministry_name)
      if (c.status_note) ss.add(c.status_note)
    })
    if (ms.size !== ministries.length) setMinistries(Array.from(ms))
    if (ss.size !== statuses.length) setStatuses(Array.from(ss))
  }, [customers])

  // Apply local filters (months, ministry, status, date range)
  const displayedCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      if (filterMonths && Number(c.months_count) !== filterMonths) return false
      if (filterMinistry && c.ministry_name !== filterMinistry) return false
      if (filterStatus && c.status_note !== filterStatus) return false
      if (filterDateFrom || filterDateTo) {
        const d = (c.created_at || '').split('T')[0].split(' ')[0]
        if (filterDateFrom && d < filterDateFrom) return false
        if (filterDateTo && d > filterDateTo) return false
      }
      return true
    })
  }, [customers, filterMonths, filterMinistry, filterStatus, filterDateFrom, filterDateTo])

  const totalPages = Math.max(1, Math.ceil((filterMonths ? displayedCustomers.length : total) / pageSize))

  const colSettingsContent = (
    <div style={{ maxHeight: 300, overflow: 'auto', minWidth: 180 }}>
      {ALL_COLUMN_KEYS.map(key => (
        <div key={key} style={{ padding: '4px 0' }}>
          <Checkbox checked={visibleCols.includes(key)} onChange={() => toggleCol(key)}>
            {COLUMN_LABELS[key] || key}
          </Checkbox>
        </div>
      ))}
      {customColumns.map(col => (
        <div key={col.column_name} style={{ padding: '4px 0' }}>
          <Checkbox checked={visibleCols.includes(col.column_name)} onChange={() => toggleCol(col.column_name)}>
            {col.display_name}
          </Checkbox>
        </div>
      ))}
    </div>
  )

  const platformFilterContent = (
    <div style={{ minWidth: 180, padding: 4 }}>
      <div style={{ padding: '4px 0', cursor: 'pointer', color: !platform ? 'var(--brand)' : 'var(--text-primary)', fontWeight: !platform ? 600 : 400 }}
        onClick={() => { setPlatform(undefined); setPage(1) }}>الكل</div>
      {platforms.map(p => (
        <div key={p} style={{ padding: '4px 0', cursor: 'pointer', color: platform === p ? 'var(--brand)' : 'var(--text-primary)', fontWeight: platform === p ? 600 : 400 }}
          onClick={() => { setPlatform(p); setPage(1) }}>{p}</div>
      ))}
    </div>
  )

  const categoryFilterContent = (
    <div style={{ minWidth: 180, padding: 4 }}>
      <div style={{ padding: '4px 0', cursor: 'pointer', color: !category ? 'var(--brand)' : 'var(--text-primary)', fontWeight: !category ? 600 : 400 }}
        onClick={() => { setCategory(undefined); setPage(1) }}>الكل</div>
      {categories.map(c => (
        <div key={c} style={{ padding: '4px 0', cursor: 'pointer', color: category === c ? 'var(--brand)' : 'var(--text-primary)', fontWeight: category === c ? 600 : 400 }}
          onClick={() => { setCategory(c); setPage(1) }}>{c}</div>
      ))}
    </div>
  )

  const userFilterContent = (
    <div style={{ minWidth: 180, padding: 4 }}>
      <div style={{ padding: '4px 0', cursor: 'pointer', color: !filterUserId ? 'var(--brand)' : 'var(--text-primary)', fontWeight: !filterUserId ? 600 : 400 }}
        onClick={() => { setFilterUserId(undefined); setPage(1) }}>الكل</div>
      {allUsers.map(u => (
        <div key={u.id} style={{ padding: '4px 0', cursor: 'pointer', color: filterUserId === u.id ? 'var(--brand)' : 'var(--text-primary)', fontWeight: filterUserId === u.id ? 600 : 400 }}
          onClick={() => { setFilterUserId(u.id); setPage(1) }}>{u.display_name}</div>
      ))}
    </div>
  )

  const monthsFilterContent = (
    <div style={{ padding: 8, width: 160 }}>
      <InputNumber
        placeholder="عدد الأشهر"
        value={filterMonths}
        onChange={v => { setFilterMonths(v as number || undefined); setPage(1) }}
        min={1}
        style={{ width: '100%', borderRadius: 8 }}
      />
    </div>
  )

  const ministryFilterContent = (
    <div style={{ minWidth: 240, maxHeight: 320, overflowY: 'auto', padding: 4 }}>
      <div style={{ padding: '4px 0', cursor: 'pointer', color: !filterMinistry ? 'var(--brand)' : 'var(--text-primary)', fontWeight: !filterMinistry ? 600 : 400 }}
        onClick={() => setFilterMinistry(undefined)}>الكل</div>
      {ministries.map(m => (
        <div key={m} style={{ padding: '4px 0', cursor: 'pointer', color: filterMinistry === m ? 'var(--brand)' : 'var(--text-primary)', fontWeight: filterMinistry === m ? 600 : 400 }}
          onClick={() => setFilterMinistry(m)}>{m}</div>
      ))}
      {ministries.length === 0 && <div className="muted" style={{ padding: '4px 0', fontSize: 12 }}>لا توجد وزارات</div>}
    </div>
  )

  const statusFilterContent = (
    <div style={{ minWidth: 180, padding: 4 }}>
      <div style={{ padding: '4px 0', cursor: 'pointer', color: !filterStatus ? 'var(--brand)' : 'var(--text-primary)', fontWeight: !filterStatus ? 600 : 400 }}
        onClick={() => setFilterStatus(undefined)}>الكل</div>
      {statuses.map(s => (
        <div key={s} style={{ padding: '4px 0', cursor: 'pointer', color: filterStatus === s ? 'var(--brand)' : 'var(--text-primary)', fontWeight: filterStatus === s ? 600 : 400 }}
          onClick={() => setFilterStatus(s)}>{s}</div>
      ))}
      {statuses.length === 0 && <div className="muted" style={{ padding: '4px 0', fontSize: 12 }}>لا توجد حالات</div>}
    </div>
  )

  const dateFilterContent = (
    <div style={{ padding: 10, width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div className="label-sm" style={{ marginBottom: 4 }}>من تاريخ</div>
        <input
          type="date"
          className="input"
          value={filterDateFrom || ''}
          onChange={e => setFilterDateFrom(e.target.value || undefined)}
          style={{ height: 34, fontSize: 12.5 }}
        />
      </div>
      <div>
        <div className="label-sm" style={{ marginBottom: 4 }}>إلى تاريخ</div>
        <input
          type="date"
          className="input"
          value={filterDateTo || ''}
          onChange={e => setFilterDateTo(e.target.value || undefined)}
          style={{ height: 34, fontSize: 12.5 }}
        />
      </div>
      {(filterDateFrom || filterDateTo) && (
        <button
          className="btn btn--quiet btn--sm"
          onClick={() => { setFilterDateFrom(undefined); setFilterDateTo(undefined) }}
        >
          مسح التاريخ
        </button>
      )}
    </div>
  )

  const activeFilters: Array<{ label: string; onRemove: () => void; tone: string }> = []
  if (platform) activeFilters.push({ label: platform, onRemove: () => setPlatform(undefined), tone: 'brand' })
  if (category) activeFilters.push({ label: category, onRemove: () => setCategory(undefined), tone: 'accent' })
  if (filterMinistry) activeFilters.push({ label: filterMinistry, onRemove: () => setFilterMinistry(undefined), tone: 'success' })
  if (filterStatus) activeFilters.push({ label: 'حالة: ' + filterStatus, onRemove: () => setFilterStatus(undefined), tone: 'warning' })
  if (filterUserId) {
    const u = allUsers.find(u => u.id === filterUserId)
    if (u) activeFilters.push({ label: 'موظف: ' + u.display_name, onRemove: () => setFilterUserId(undefined), tone: 'info' })
  }
  if (filterMonths) activeFilters.push({ label: filterMonths + ' شهر', onRemove: () => setFilterMonths(undefined), tone: 'violet' })
  if (filterDateFrom || filterDateTo) {
    const rangeLabel = `${filterDateFrom || '…'} ← ${filterDateTo || '…'}`
    activeFilters.push({
      label: rangeLabel,
      onRemove: () => { setFilterDateFrom(undefined); setFilterDateTo(undefined) },
      tone: 'danger',
    })
  }

  const showCol = (k: string) => visibleCols.includes(k)
  const today = new Date().toISOString().split('T')[0]

  // ===== Topbar: subtitle + search + view switcher =====
  const topbarActions = (
    <div style={{
      display: 'flex',
      gap: 3,
      background: 'var(--bg-elevated)',
      padding: 3,
      borderRadius: 9,
      border: '1px solid var(--border)',
    }}>
      {[
        { k: 'split' as ViewMode, label: 'مقسم' },
        { k: 'cards' as ViewMode, label: 'بطاقات' },
        { k: 'table' as ViewMode, label: 'جدول' },
      ].map(v => (
        <button
          key={v.k}
          className={viewMode === v.k ? 'btn btn--sm btn--primary' : 'btn btn--sm btn--quiet'}
          style={{ height: 28, padding: '0 14px', fontSize: 12 }}
          onClick={() => changeView(v.k)}
        >{v.label}</button>
      ))}
    </div>
  )

  useTopbarState({
    breadcrumb: ['الرئيسية', 'الزبائن'],
    subtitle: `${total.toLocaleString('en-US')} زبون — قاعدة البيانات الكاملة`,
    search: {
      value: search,
      placeholder: 'ابحث بالاسم أو الهاتف…',
      onChange: (v) => { setSearch(v); setPage(1) },
    },
    actions: topbarActions,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ===== Filter toolbar ===== */}
      <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => navigate('/add-customer')}
        >
          <Icon name="plus" size={12} stroke={2.3} /> إضافة زبون
        </button>

        <div style={{ flex: 1 }} />

        <Popover content={platformFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${platform ? 'btn--primary' : 'btn--ghost'}`}>
            المنصة <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        <Popover content={categoryFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${category ? 'btn--primary' : 'btn--ghost'}`}>
            الصنف <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        <Popover content={ministryFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${filterMinistry ? 'btn--primary' : 'btn--ghost'}`}>
            الوزارة <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        <Popover content={statusFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${filterStatus ? 'btn--primary' : 'btn--ghost'}`}>
            الحالة <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        {isAdmin && (
          <Popover content={userFilterContent} trigger="click" placement="bottomRight">
            <button className={`btn btn--sm ${filterUserId ? 'btn--primary' : 'btn--ghost'}`}>
              الموظف <Icon name="arrow_down" size={11} stroke={2.3} />
            </button>
          </Popover>
        )}

        <Popover content={monthsFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${filterMonths ? 'btn--primary' : 'btn--ghost'}`}>
            المدة <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        <Popover content={dateFilterContent} trigger="click" placement="bottomRight">
          <button className={`btn btn--sm ${(filterDateFrom || filterDateTo) ? 'btn--primary' : 'btn--ghost'}`}>
            <Icon name="calendar" size={12} /> التاريخ <Icon name="arrow_down" size={11} stroke={2.3} />
          </button>
        </Popover>

        <Popover content={colSettingsContent} trigger="click" placement="bottomRight">
          <button className="btn btn--sm btn--ghost">
            <Icon name="settings" size={12} /> الأعمدة
          </button>
        </Popover>
      </div>

      {/* ===== Active filters ===== */}
      {(activeFilters.length > 0 || savedFilters.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {activeFilters.length > 0 && (
            <>
              <span className="label-sm">فلاتر نشطة:</span>
              {activeFilters.map((f, i) => (
                <span key={i} className={`chip chip--${f.tone}`} style={{ cursor: 'pointer' }} onClick={f.onRemove}>
                  {f.label} <Icon name="x" size={10} stroke={2.3} />
                </span>
              ))}
              <button
                className="btn btn--sm btn--quiet"
                onClick={() => {
                  setPlatform(undefined); setCategory(undefined)
                  setFilterUserId(undefined); setFilterMonths(undefined)
                  setFilterMinistry(undefined); setFilterStatus(undefined)
                  setFilterDateFrom(undefined); setFilterDateTo(undefined)
                  setSearch(''); setPage(1)
                }}
                style={{ height: 24, fontSize: 11 }}
              >
                مسح الكل
              </button>
              {(search || platform || category || filterUserId || filterMonths || filterMinistry || filterStatus || filterDateFrom || filterDateTo) && (
                <button
                  className="btn btn--sm btn--quiet"
                  onClick={() => {
                    const name = prompt('اسم الفلتر:')
                    if (!name) return
                    const f = { name, search, platform: platform || '', category: category || '', userId: filterUserId, months: filterMonths }
                    const updated = [...savedFilters.filter(s => s.name !== name), f]
                    setSavedFilters(updated)
                    localStorage.setItem('minasa_saved_filters', JSON.stringify(updated))
                    message.success(`تم حفظ الفلتر "${name}"`)
                  }}
                  style={{ height: 24, fontSize: 11 }}
                >
                  <Icon name="save" size={11} /> حفظ
                </button>
              )}
            </>
          )}

          {savedFilters.length > 0 && activeFilters.length > 0 && (
            <span style={{ color: 'var(--text-faint)', margin: '0 4px' }}>·</span>
          )}

          {savedFilters.length > 0 && (
            <>
              <span className="label-sm">محفوظة:</span>
              {savedFilters.map(f => (
                <span
                  key={f.name}
                  className="chip chip--neutral"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSearch(f.search || ''); setPlatform(f.platform || undefined)
                    setCategory(f.category || undefined); setFilterUserId(f.userId); setFilterMonths(f.months); setPage(1)
                  }}
                >
                  {f.name}
                  <Icon
                    name="x" size={10} stroke={2.3}
                    style={{ marginInlineStart: 4, cursor: 'pointer', opacity: 0.6 }}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      const updated = savedFilters.filter(s => s.name !== f.name)
                      setSavedFilters(updated)
                      localStorage.setItem('minasa_saved_filters', JSON.stringify(updated))
                    }}
                  />
                </span>
              ))}
            </>
          )}

          <span className="muted" style={{ fontSize: 11.5, marginInlineStart: 'auto' }}>
            إظهار <strong className="num" style={{ color: 'var(--text-primary)' }}>{displayedCustomers.length.toLocaleString('en-US')}</strong>
            {' '}من أصل <span className="num">{total.toLocaleString('en-US')}</span>
          </span>
        </div>
      )}

      {/* ===== Loading / empty states ===== */}
      {loading ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}><Spin size="large" /></div>
      ) : displayedCustomers.length === 0 ? (
        <div className="card" style={{ padding: 60 }}>
          <Empty description="لا يوجد زبائن" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : viewMode === 'cards' ? (
        /* ===== Cards grid view ===== */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
        }}>
          {displayedCustomers.map((c: any) => {
            const sTone = statusTone(c.status_note)
            const ownerName = userMap[c.user_id]
              || (c.user_id === user?.id ? (user.display_name || 'أدمن') : '')
            const ownerIdx = allUsers.findIndex(u => u.id === c.user_id)
            const ownerColor = ownerIdx >= 0 ? ['#D4A574','#60A5FA','#A78BFA','#4ADE80','#FBBF24','#F87171','#2D6B55','#7C3AED'][ownerIdx % 8] : '#A8B2AD'
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

                {/* Employee row */}
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
      ) : viewMode === 'split' ? (
        /* ===== Split view: list (LEFT, 380px) + preview (RIGHT, 1fr) ===== */
        <div className="card" style={{
          padding: 0,
          overflow: 'hidden',
          height: 'calc(100vh - 300px)',
          minHeight: 520,
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
        }}>
          {/* ===== List pane (LEFT) ===== */}
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
              {displayedCustomers.map((c: any) => {
                const active = splitSelectedId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSplitSelectedId(c.id)}
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

          {/* ===== Preview pane (RIGHT) ===== */}
          <div style={{ padding: 28, overflowY: 'auto', minHeight: 0 }}>
            {(() => {
              const c = displayedCustomers.find((x: any) => x.id === splitSelectedId) || displayedCustomers[0]
              if (!c) return (
                <div style={{ textAlign: 'center', paddingTop: 80 }}>
                  <Empty description="اختر زبونًا من القائمة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
              )
              const sTone = statusTone(c.status_note)
              let endDate = '-'
              try {
                if (c.months_count && c.created_at) {
                  const d = new Date(c.created_at)
                  if (!isNaN(d.getTime())) {
                    d.setMonth(d.getMonth() + Number(c.months_count))
                    endDate = d.toISOString().split('T')[0]
                  }
                }
              } catch { /* keep '-' */ }
              const ownerName = userMap[c.user_id] || (c.user_id === user?.id ? 'أدمن' : '-')

              return (
                <div>
                  {/* Header: action buttons + customer info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => window.open(`tel:${c.phone_number}`)}
                        disabled={!c.phone_number}
                      >
                        <Icon name="phone" size={12} /> اتصال
                      </button>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => navigate(`/edit-customer/${c.id}`)}
                      >
                        <Icon name="edit" size={12} /> تعديل
                      </button>
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => navigate(`/customer/${c.id}`)}
                      >
                        <Icon name="external" size={12} /> طباعة
                      </button>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <h2 style={{ fontSize: 22, margin: 0, fontWeight: 700, letterSpacing: '-0.01em' }}>
                        {c.full_name}
                      </h2>
                      {(c.phone_number || c.card_number) && (
                        <div className="num muted" style={{ marginTop: 4, fontSize: 13 }}>
                          {c.phone_number}
                          {c.phone_number && c.card_number && <> · </>}
                          {c.card_number}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {c.platform_name && <span className="chip chip--neutral">{c.platform_name}</span>}
                        {c.category && <span className="chip chip--brand">{c.category}</span>}
                        {c.status_note && (
                          <span className={`chip chip--${sTone}`}>
                            <span className="dot" style={{ background: 'currentColor' }} />
                            {c.status_note}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="avatar avatar-ring" style={{ width: 64, height: 64, fontSize: 24, flexShrink: 0 }}>
                      {initials(c.full_name)}
                    </div>
                  </div>

                  {/* 4-card info grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    marginBottom: 14,
                  }}>
                    {[
                      { l: 'المدة', v: c.months_count ? `${c.months_count} شهر` : '-', num: true, icon: 'calendar' },
                      { l: 'تاريخ الانتهاء', v: endDate, num: true, icon: 'clock' },
                      { l: 'الوزارة', v: c.ministry_name || '-', truncate: true, icon: 'building' },
                      { l: 'الموظف', v: ownerName, icon: 'users' },
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

                  {/* Reminders + History in 2-col */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {/* Reminders */}
                    <div className="card-flat">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Icon name="bell" size={14} />
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>التذكيرات</h4>
                      </div>
                      {splitReminders.length === 0 ? (
                        <div className="muted" style={{ fontSize: 12, padding: '4px 0' }}>لا توجد تذكيرات</div>
                      ) : (
                        splitReminders.slice(0, 4).map((r: any, i: number) => {
                          const isDone = r.is_done === 1
                          const isDue = !isDone && r.reminder_date <= today
                          const tone = isDone ? 'success' : isDue ? 'danger' : 'info'
                          const label = isDone ? 'تم' : isDue ? 'اليوم' : formatDate(r.reminder_date)
                          return (
                            <div key={r.id} style={{
                              padding: '8px 0',
                              borderBottom: i < Math.min(splitReminders.length, 4) - 1 ? '1px solid var(--border-subtle)' : 'none',
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

                    {/* History */}
                    <div className="card-flat">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Icon name="history" size={14} />
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>سجل التعديلات</h4>
                      </div>
                      {splitHistory.length === 0 ? (
                        <div className="muted" style={{ fontSize: 12, padding: '4px 0' }}>لا توجد تعديلات</div>
                      ) : (
                        splitHistory.slice(0, 4).map((h: any, i: number) => {
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
                              borderBottom: i < Math.min(splitHistory.length, 4) - 1 ? '1px solid var(--border-subtle)' : 'none',
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
              )
            })()}
          </div>

        </div>
      ) : (
        /* ===== Table view ===== */
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
                {displayedCustomers.map((c: any) => (
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
                          : c.user_id === user?.id
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
      )}

      {/* ===== Pagination ===== */}
      {!loading && displayedCustomers.length > 0 && (
        <div className="card" style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div className="muted" style={{ fontSize: 12 }}>
            إجمالي:{' '}
            <strong className="num" style={{ color: 'var(--text-primary)' }}>
              {(filterMonths ? displayedCustomers.length : total).toLocaleString('en-US')}
            </strong>{' '}
            زبون · صفحة <span className="num">{page}</span> من <span className="num">{totalPages}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Select
              value={pageSize}
              onChange={v => { setPageSize(v); setPage(1) }}
              size="small"
              style={{ width: 70 }}
              options={[
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              السابق
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  className={`btn btn--sm ${p === page ? 'btn--primary' : 'btn--ghost'}`}
                  style={{ minWidth: 30, padding: 0 }}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default React.memo(CustomerTable)
