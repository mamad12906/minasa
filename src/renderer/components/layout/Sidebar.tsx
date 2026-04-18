import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Popover, Button, Empty, Tag, Progress, Modal, Tabs, Badge } from 'antd'
import { useAuth, useTheme } from '../../App'
import { isOnline } from '../../api/http'
import Icon, { IconName } from './Icon'

const updater = (window as any).__updater

interface NavItem {
  key: string
  path: string
  icon: IconName
  label: string
  badge?: string
  dot?: boolean
}
interface NavDivider {
  type: 'divider'
  label?: string
}
type NavEntry = NavItem | NavDivider

interface Props {
  collapsed: boolean
  onToggleCollapse: () => void
}

export default function Sidebar({ collapsed, onToggleCollapse }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, can } = useAuth()
  const { isDark } = useTheme()
  const [allReminders, setAllReminders] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [hover, setHover] = useState(false)
  const [appVer, setAppVer] = useState('')
  const [online, setOnline] = useState(isOnline())

  const isAdmin = user?.role === 'admin'
  const userId = (!isAdmin && user?.id) ? user.id : undefined
  const expanded = !collapsed || hover

  useEffect(() => {
    (window as any).__appVersion?.().then((v: string) => {
      setAppVer(v || '')
      ;(window as any).__appVersionCache = v
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setOnline(isOnline()), 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!updater) return
    updater.onUpdateAvailable((info: any) => setUpdateInfo(info))
    updater.onProgress((info: any) => setDownloadProgress(info.percent))
    updater.onUpdateDownloaded(() => { setDownloadProgress(null); setUpdateReady(true) })
  }, [])

  const loadReminders = async () => {
    const all = await window.api.reminders.all(userId)
    setAllReminders(all)
  }

  useEffect(() => {
    loadReminders()
    const interval = setInterval(loadReminders, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = () => loadReminders()
    window.addEventListener('reminders-updated', handler)
    return () => window.removeEventListener('reminders-updated', handler)
  }, [])

  const goToCustomer = (name: string) => {
    setBellOpen(false)
    navigate('/customers?search=' + encodeURIComponent(name))
  }

  const today = new Date().toISOString().split('T')[0]
  const twoMonthsLater = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 2)
    return d.toISOString().split('T')[0]
  })()
  const pendingCount = allReminders.filter(r => r.is_done === 0 && r.reminder_date <= today).length
  const upcomingReminders = allReminders.filter(r => r.is_done === 0 && r.reminder_date > today && r.reminder_date <= twoMonthsLater)
  const upcomingCount = upcomingReminders.length
  const totalNotif = pendingCount + upcomingCount

  const nav: NavEntry[] = [
    { key: 'dashboard', path: '/', icon: 'dashboard', label: 'لوحة التحكم' },
    ...(can('customers') ? [{ key: 'customers', path: '/customers', icon: 'users' as IconName, label: 'الزبائن' }] : []),
    ...(can('customers') ? [{ key: 'invoices', path: '/invoices', icon: 'invoice' as IconName, label: 'الفواتير' }] : []),
    ...(can('reports') ? [{ key: 'reports', path: '/reports', icon: 'chart' as IconName, label: 'التقارير' }] : []),
    { key: 'whatsapp', path: '/whatsapp', icon: 'whatsapp', label: 'واتساب', dot: online },
    { type: 'divider' } as NavDivider,
    ...(can('import') ? [{ key: 'import', path: '/import', icon: 'upload' as IconName, label: 'استيراد Excel' }] : []),
    { key: 'backup', path: '/backup', icon: 'save', label: 'نسخ احتياطي' },
    ...(isAdmin ? [
      { type: 'divider', label: 'إدارة' } as NavDivider,
      { key: 'admin', path: '/admin', icon: 'shield' as IconName, label: 'لوحة الأدمن' },
      { key: 'audit', path: '/audit', icon: 'history' as IconName, label: 'سجل التغييرات' },
      { key: 'database', path: '/database', icon: 'database' as IconName, label: 'قاعدة البيانات' },
    ] : []),
  ]

  const renderReminderCard = (r: any) => {
    const isDone = r.is_done === 1
    const isDue = !isDone && r.reminder_date <= today
    const daysLeft = Math.ceil((new Date(r.reminder_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return (
      <div key={r.id} style={{
        padding: '10px 12px', marginBottom: 8, borderRadius: 10,
        background: isDone ? 'var(--success-bg)' : isDue ? 'var(--danger-bg)' : 'var(--warning-bg)',
        border: `1px solid ${isDone ? 'var(--success-border)' : isDue ? 'var(--danger-border)' : 'var(--warning-border)'}`,
        borderRight: `4px solid ${isDone ? 'var(--success)' : isDue ? 'var(--danger)' : 'var(--warning)'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 4 }}>
              <Tag color={isDone ? 'green' : isDue ? 'red' : 'orange'} style={{ fontSize: 12 }}>
                {r.reminder_text?.length > 40 ? r.reminder_text.slice(0, 40) + '...' : r.reminder_text}
              </Tag>
              {isDone && <Tag color="success" style={{ fontSize: 11 }}>تم</Tag>}
              {isDue && !isDone && <Tag color="error" style={{ fontSize: 11 }}>مستحق</Tag>}
              {!isDone && !isDue && daysLeft <= 60 && <Tag color="warning" style={{ fontSize: 11 }}>باقي {daysLeft} يوم</Tag>}
            </div>
            <a onClick={() => goToCustomer(r.full_name)}
              style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--brand)' }}>
              {r.full_name}
            </a>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
              {r.phone_number && <span>{r.phone_number}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'left', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDone ? 'var(--success)' : isDue ? 'var(--danger)' : 'var(--warning)' }}>
              {r.reminder_date}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bellContent = (
    <div style={{ width: 460 }}>
      <Tabs defaultActiveKey="upcoming" size="small" items={[
        {
          key: 'upcoming',
          label: <span>قريبة {totalNotif > 0 && <Badge count={totalNotif} size="small" style={{ marginRight: 4 }} />}</span>,
          children: (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {pendingCount > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>مستحقة الآن:</div>
              )}
              {allReminders.filter(r => r.is_done === 0 && r.reminder_date <= today).map(renderReminderCard)}

              {upcomingReminders.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 6, marginTop: 8 }}>خلال شهرين:</div>
              )}
              {upcomingReminders.map(renderReminderCard)}

              {totalNotif === 0 && (
                <Empty description="لا توجد تذكيرات قريبة" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          )
        },
        {
          key: 'all',
          label: <span>الكل {allReminders.length > 0 && <Badge count={allReminders.length} size="small" style={{ marginRight: 4 }} overflowCount={999} />}</span>,
          children: (
            <div style={{ maxHeight: 420, overflow: 'auto' }}>
              {allReminders.length === 0 ? (
                <Empty description="لا توجد تذكيرات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : allReminders.map(renderReminderCard)}
            </div>
          )
        }
      ]} />
    </div>
  )

  const SIDEBAR_BG = '#0C1210'
  const SIDEBAR_BORDER = '#141B17'
  const TEXT_ON_DARK = '#E8EDEA'
  const TEXT_MUTED_DARK = '#A8B2AD'
  const TEXT_FAINT_DARK = '#6B7570'
  const ACCENT_GOLD = '#D4A574'

  return (
    <aside
      onMouseEnter={() => collapsed && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: expanded ? 244 : 68,
        background: SIDEBAR_BG,
        borderLeft: `1px solid ${SIDEBAR_BORDER}`,
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        transition: 'width 0.2s ease',
        color: TEXT_ON_DARK,
        overflow: 'hidden',
      }}>
      {/* ===== Logo ===== */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: 12,
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(140deg, #2D6B55 0%, #0F4C3A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(212,165,116,0.25)',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 20V8l8-5 8 5v12" stroke={ACCENT_GOLD} strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M9 20v-7h6v7" stroke={ACCENT_GOLD} strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>
        {expanded && (
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_ON_DARK, letterSpacing: '-0.01em' }}>
              {user?.platform_name || 'مِناصة'}
            </div>
            <div style={{ fontSize: 10.5, color: TEXT_FAINT_DARK, fontWeight: 500, letterSpacing: '0.04em' }}>
              MINASA · v{appVer || '...'}
            </div>
          </div>
        )}
      </div>

      {/* ===== Top actions: bell + popover (expanded only) ===== */}
      {expanded && (
        <div style={{
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          flexShrink: 0,
        }}>
          <Popover content={bellContent} title="التذكيرات" trigger="click"
            open={bellOpen} onOpenChange={setBellOpen} placement="leftTop">
            <button style={{
              flex: 1, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: pendingCount > 0 ? 'rgba(248,113,113,0.1)' : '#141B17',
              color: pendingCount > 0 ? '#F87171' : TEXT_MUTED_DARK,
              border: `1px solid ${pendingCount > 0 ? 'rgba(248,113,113,0.25)' : SIDEBAR_BORDER}`,
              borderRadius: 9,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              position: 'relative',
              transition: 'all 0.15s',
            }}>
              <Icon name="bell" size={14} />
              <span>التذكيرات</span>
              {totalNotif > 0 && (
                <span className="num" style={{
                  fontSize: 10.5, fontWeight: 600, padding: '1px 6px',
                  borderRadius: 999,
                  background: pendingCount > 0 ? 'rgba(248,113,113,0.2)' : '#1F2924',
                  color: pendingCount > 0 ? '#F87171' : TEXT_ON_DARK,
                }}>{totalNotif}</span>
              )}
            </button>
          </Popover>
        </div>
      )}
      {!expanded && (
        <div style={{ padding: '10px', display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0 }}>
          <Popover content={bellContent} title="التذكيرات" trigger="click"
            open={bellOpen} onOpenChange={setBellOpen} placement="leftTop">
            <button style={{
              width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              color: pendingCount > 0 ? '#F87171' : TEXT_MUTED_DARK,
              border: 'none',
              borderRadius: 9,
              cursor: 'pointer',
              position: 'relative',
            }}>
              <Icon name="bell" size={16} />
              {totalNotif > 0 && (
                <span style={{
                  position: 'absolute', top: 4, left: 4,
                  width: 7, height: 7, borderRadius: '50%',
                  background: pendingCount > 0 ? '#F87171' : '#FBBF24',
                  boxShadow: `0 0 0 2px ${SIDEBAR_BG}`,
                }}/>
              )}
            </button>
          </Popover>
        </div>
      )}

      {/* ===== Nav ===== */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        {nav.map((item, i) => {
          if ('type' in item && item.type === 'divider') {
            return (
              <div key={i} style={{ margin: '14px 0 8px', padding: '0 10px' }}>
                {expanded && item.label ? (
                  <div style={{
                    fontSize: 10.5, color: '#4A524E', letterSpacing: '0.1em',
                    fontWeight: 600, textTransform: 'uppercase'
                  }}>{item.label}</div>
                ) : <div style={{ height: 1, background: '#1F2924' }}/>}
              </div>
            )
          }
          const navItem = item as NavItem
          const isActive = location.pathname === navItem.path ||
            (navItem.path !== '/' && location.pathname.startsWith(navItem.path))

          return (
            <button key={navItem.key}
              onClick={() => navigate(navItem.path)}
              title={!expanded ? navItem.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', height: 38, padding: '0 12px',
                background: isActive ? 'rgba(45,107,85,0.18)' : 'transparent',
                border: 'none',
                color: isActive ? ACCENT_GOLD : TEXT_MUTED_DARK,
                borderRadius: 9, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
                marginBottom: 2, textAlign: 'right',
                transition: 'background 0.12s, color 0.12s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#141B17'
                  e.currentTarget.style.color = TEXT_ON_DARK
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = TEXT_MUTED_DARK
                }
              }}
            >
              <Icon name={navItem.icon} size={17} />
              {expanded && <span style={{ flex: 1 }}>{navItem.label}</span>}
              {expanded && navItem.badge && (
                <span className="num" style={{
                  fontSize: 10.5, fontWeight: 600, padding: '2px 7px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(212,165,116,0.2)' : '#1F2924',
                  color: isActive ? ACCENT_GOLD : TEXT_MUTED_DARK,
                }}>{navItem.badge}</span>
              )}
              {expanded && navItem.dot && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: navItem.dot ? '#4ADE80' : '#F87171'
                }}/>
              )}
              {!expanded && navItem.dot && (
                <span style={{
                  position: 'absolute', top: 9, left: 9,
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#4ADE80'
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* ===== Bottom: updates + user ===== */}
      <div style={{
        padding: '12px 10px',
        borderTop: `1px solid ${SIDEBAR_BORDER}`,
        flexShrink: 0,
      }}>
        {/* Update notifications */}
        {expanded && updateInfo && !updateReady && downloadProgress === null && (
          <div style={{
            marginBottom: 10, padding: '8px 10px', borderRadius: 9,
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#FBBF24', fontSize: 11.5, marginBottom: 6 }}>
              <Icon name="download" size={12} style={{ verticalAlign: '-2px', marginLeft: 4 }} />
              نسخة جديدة {updateInfo.version}
            </div>
            <Button size="small" block
              onClick={() => { setDownloadProgress(0); updater?.download() }}
              style={{ borderRadius: 7, background: '#CA8A04', borderColor: '#CA8A04', color: '#fff', fontSize: 11.5 }}>
              تحميل التحديث
            </Button>
          </div>
        )}
        {expanded && downloadProgress !== null && (
          <div style={{ marginBottom: 10, textAlign: 'center' }}>
            <div style={{ color: '#4ADE80', fontSize: 11, marginBottom: 4 }}>جاري التحميل...</div>
            <Progress percent={downloadProgress} size="small" strokeColor="#4ADE80" />
          </div>
        )}
        {expanded && updateReady && (
          <div style={{
            marginBottom: 10, padding: '8px 10px', borderRadius: 9,
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.25)',
            textAlign: 'center'
          }}>
            <div style={{ color: '#4ADE80', fontSize: 11.5, marginBottom: 6 }}>التحديث جاهز للتثبيت</div>
            <Button size="small" block
              onClick={() => Modal.confirm({
                title: 'تثبيت التحديث',
                content: 'سيتم إغلاق البرنامج وتثبيت النسخة الجديدة. هل تريد المتابعة؟',
                okText: 'ثبّت الآن', cancelText: 'لاحقاً',
                onOk: () => updater?.install()
              })}
              style={{ borderRadius: 7, background: '#16A34A', borderColor: '#16A34A', color: '#fff', fontSize: 11.5 }}>
              ثبّت الآن وأعد التشغيل
            </Button>
          </div>
        )}

        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: expanded ? '8px 10px' : '6px',
          borderRadius: 10,
          background: '#141B17',
          marginBottom: expanded ? 8 : 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(140deg, #D4A574, #A37B4F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#0A0F0D', fontSize: 12, flexShrink: 0,
          }}>
            {user?.display_name?.[0] || 'م'}
          </div>
          {expanded && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 600, color: TEXT_ON_DARK,
                  display: 'flex', alignItems: 'center', gap: 5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.display_name}</span>
                  {isAdmin && <Icon name="crown" size={11} stroke={2} style={{ color: ACCENT_GOLD, flexShrink: 0 }} />}
                </div>
                <div style={{
                  fontSize: 10.5,
                  color: online ? 'rgba(74,222,128,0.85)' : TEXT_FAINT_DARK,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {online ? <Icon name="wifi" size={9} stroke={2} /> : <Icon name="wifi_off" size={9} stroke={2} />}
                  <span>{isAdmin ? 'أدمن' : 'مستخدم'} · {online ? 'متصل' : 'غير متصل'}</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="تسجيل خروج"
                style={{
                  width: 28, height: 28,
                  background: 'transparent',
                  border: 'none',
                  color: TEXT_FAINT_DARK,
                  borderRadius: 7,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(248,113,113,0.1)'
                  e.currentTarget.style.color = '#F87171'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = TEXT_FAINT_DARK
                }}
              >
                <Icon name="logout" size={14} />
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        {expanded && (
          <button onClick={onToggleCollapse}
            style={{
              width: '100%', height: 30,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: TEXT_FAINT_DARK, fontSize: 11, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <Icon name="pin" size={11} />
            {collapsed ? 'تثبيت القائمة' : 'طيّ القائمة'}
          </button>
        )}
      </div>
    </aside>
  )
}
