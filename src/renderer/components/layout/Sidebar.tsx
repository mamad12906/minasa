import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Badge, Popover, Button, Empty, Tag, Progress, Modal, message } from 'antd'
import {
  DashboardOutlined, UserOutlined, UploadOutlined,
  CrownOutlined, BellOutlined, LogoutOutlined, SaveOutlined,
  CloudDownloadOutlined, MoonOutlined, SunOutlined,
  WifiOutlined, DisconnectOutlined, SyncOutlined, HistoryOutlined,
  DollarOutlined, BarChartOutlined
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { isOnline, getSyncQueueCount, processSyncQueue, pullFromServer, getLastSyncTime, isSyncing } from '../../api/http'

const { Sider } = Layout
const updater = (window as any).__updater

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, can } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [allReminders, setAllReminders] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  const [appVer, setAppVer] = useState('')
  const [online, setOnline] = useState(isOnline())
  const [syncCount, setSyncCount] = useState(getSyncQueueCount())
  const [syncing, setSyncing] = useState(false)
  const isAdmin = user?.role === 'admin'
  const userId = (!isAdmin && user?.id) ? user.id : undefined

  // Load version
  useEffect(() => {
    (window as any).__appVersion?.().then((v: string) => { setAppVer(v || ''); (window as any).__appVersionCache = v })
  }, [])

  // Listen for connection and sync changes
  useEffect(() => {
    const interval = setInterval(() => {
      setOnline(isOnline())
      setSyncCount(getSyncQueueCount())
    }, 3000)
    const onSync = (e: any) => { setSyncCount(getSyncQueueCount()) }
    window.addEventListener('sync-queue-changed', onSync)
    window.addEventListener('sync-completed', onSync)
    return () => { clearInterval(interval); window.removeEventListener('sync-queue-changed', onSync); window.removeEventListener('sync-completed', onSync) }
  }, [])

  const handleManualSync = async () => {
    setSyncing(true)
    // First push pending changes
    const pushResult = await processSyncQueue()
    if (pushResult.synced > 0) message.success(`تم رفع ${pushResult.synced} عملية`)
    // Then pull fresh data from server
    const pullResult = await pullFromServer()
    setSyncing(false)
    setSyncCount(getSyncQueueCount())
    if (pullResult.success) message.success(pullResult.details)
    else if (pullResult.details) message.warning(pullResult.details)
  }

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
  const pendingCount = allReminders.filter(r => r.is_done === 0 && r.reminder_date <= today).length

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'لوحة التحكم' },
    ...(can('customers') ? [{ key: '/customers', icon: <UserOutlined />, label: 'الزبائن' }] : []),
    ...(can('customers') ? [{ key: '/invoices', icon: <DollarOutlined />, label: 'الفواتير' }] : []),
    { key: '/reports', icon: <BarChartOutlined />, label: 'التقارير' },
    ...(can('import') ? [{ key: '/import', icon: <UploadOutlined />, label: 'استيراد Excel' }] : []),
    { key: '/backup', icon: <SaveOutlined />, label: 'نسخ احتياطي' },
    ...(user?.role === 'admin' ? [
      { key: '/admin', icon: <CrownOutlined />, label: 'لوحة الأدمن' },
      { key: '/audit', icon: <HistoryOutlined />, label: 'سجل التغييرات' }
    ] : [])
  ]

  const bellContent = (
    <div style={{ width: 440, maxHeight: 520, overflow: 'auto' }}>
      {allReminders.length === 0 ? (
        <Empty description="لا توجد تذكيرات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', marginBottom: 10,
            padding: '8px 12px', background: 'var(--bg-card-hover)', borderRadius: 8
          }}>
            اضغط على اسم الزبون للذهاب إليه. للتعامل مع التذكير افتح تفاصيل الزبون.
          </div>
          {allReminders.map((r: any) => {
            const isDone = r.is_done === 1
            const isDue = !isDone && r.reminder_date <= today
            return (
              <div key={r.id} style={{
                padding: '12px 14px', marginBottom: 8, borderRadius: 10,
                background: isDone ? 'var(--success-bg)' : isDue ? 'var(--error-bg)' : 'var(--warning-bg)',
                border: `1px solid ${isDone ? 'var(--success-border)' : isDue ? 'var(--error-border)' : 'var(--warning-border)'}`,
                borderRight: `4px solid ${isDone ? 'var(--success)' : isDue ? 'var(--error)' : 'var(--warning)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6 }}>
                      <Tag color={isDone ? 'green' : isDue ? 'red' : 'orange'} style={{ fontSize: 13 }}>
                        {r.reminder_text}
                      </Tag>
                      {isDone && <Tag color="success" style={{ fontSize: 12 }}>تم التعامل</Tag>}
                      {isDue && !isDone && <Tag color="error" style={{ fontSize: 12 }}>يحتاج تعامل</Tag>}
                    </div>
                    <a onClick={() => goToCustomer(r.full_name)}
                      style={{ fontWeight: 600, fontSize: 15, cursor: 'pointer', color: 'var(--primary)' }}>
                      {r.full_name}
                    </a>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>
                      {r.phone_number && <span>{r.phone_number}</span>}
                      {r.ministry_name && <span> | {r.ministry_name}</span>}
                    </div>
                    {isDone && r.handled_by && (
                      <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 3 }}>
                        الموظف: <strong>{r.handled_by}</strong>
                        {r.handle_method && <span> | {r.handle_method}</span>}
                      </div>
                    )}
                    {r.is_postponed === 1 && r.postpone_reason && (
                      <div style={{ fontSize: 12, color: 'var(--warning)', marginTop: 3 }}>
                        سبب الإعادة: {r.postpone_reason}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: isDone ? 'var(--success)' : isDue ? 'var(--error)' : 'var(--warning)'
                    }}>{r.reminder_date}</div>
                    {r.original_date && r.original_date !== r.reminder_date && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{r.original_date}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )

  return (
    <Sider width={220} style={{
      background: 'var(--sidebar-bg)',
      overflow: 'auto', height: '100vh', position: 'fixed',
      right: 0, top: 0, bottom: 0, zIndex: 10
    }}>
      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: '#1B6B93',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 10
        }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>م</span>
        </div>
        <h1 style={{ color: '#E6EDF3', margin: 0, fontSize: 20, fontWeight: 600 }}>منصة</h1>
      </div>

      {/* Bell + Theme Toggle */}
      <div style={{ textAlign: 'center', padding: '8px 0', display: 'flex', justifyContent: 'center', gap: 4 }}>
        <Popover content={bellContent} title="التذكيرات" trigger="click"
          open={bellOpen} onOpenChange={setBellOpen} placement="leftTop">
          <Badge count={pendingCount} offset={[-5, 5]} size="small">
            <Button type="text" icon={<BellOutlined />} style={{
              color: pendingCount > 0 ? '#CF222E' : 'rgba(255,255,255,0.5)',
              fontSize: 18,
            }} />
          </Badge>
        </Popover>
        <Button type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}
        />
      </div>

      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
        items={menuItems} onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 'none', background: 'transparent' }} />

      {/* Bottom section */}
      <div style={{
        position: 'absolute', bottom: 0, width: '100%', padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)'
      }}>
        {updateInfo && !updateReady && downloadProgress === null && (
          <div style={{
            marginBottom: 10, padding: '8px 10px', borderRadius: 8,
            background: 'rgba(210,153,34,0.15)', border: '1px solid rgba(210,153,34,0.3)', textAlign: 'center'
          }}>
            <div style={{ color: '#D29922', fontSize: 12, marginBottom: 6 }}>
              <CloudDownloadOutlined /> نسخة جديدة {updateInfo.version}
            </div>
            <Button size="small" block onClick={() => { setDownloadProgress(0); updater?.download() }}
              style={{ borderRadius: 6, background: '#D29922', borderColor: '#D29922', color: '#fff', fontSize: 12 }}>
              تحميل التحديث
            </Button>
          </div>
        )}
        {downloadProgress !== null && (
          <div style={{ marginBottom: 10, textAlign: 'center' }}>
            <div style={{ color: '#2DA44E', fontSize: 11, marginBottom: 4 }}>جاري التحميل...</div>
            <Progress percent={downloadProgress} size="small" strokeColor="#2DA44E" />
          </div>
        )}
        {updateReady && (
          <div style={{
            marginBottom: 10, padding: '8px 10px', borderRadius: 8,
            background: 'rgba(45,164,78,0.15)', border: '1px solid rgba(45,164,78,0.3)', textAlign: 'center'
          }}>
            <div style={{ color: '#2DA44E', fontSize: 12, marginBottom: 6 }}>التحديث جاهز للتثبيت</div>
            <Button size="small" block
              onClick={() => Modal.confirm({
                title: 'تثبيت التحديث',
                content: 'سيتم إغلاق البرنامج وتثبيت النسخة الجديدة. هل تريد المتابعة؟',
                okText: 'ثبّت الآن', cancelText: 'لاحقاً',
                onOk: () => updater?.install()
              })}
              style={{ borderRadius: 6, background: '#2DA44E', borderColor: '#2DA44E', color: '#fff', fontSize: 12 }}>
              ثبّت الآن وأعد التشغيل
            </Button>
          </div>
        )}

        {/* Connection Status */}
        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 11, color: online ? 'rgba(45,164,78,0.9)' : 'rgba(207,34,46,0.9)',
            marginBottom: 4
          }}>
            {online ? <WifiOutlined /> : <DisconnectOutlined />}
            <span>{online ? 'متصل' : 'غير متصل'}</span>
            {syncCount > 0 && <Tag color="warning" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{syncCount} معلّق</Tag>}
          </div>
          <Button type="text" size="small" icon={<SyncOutlined spin={syncing} />}
            onClick={handleManualSync} disabled={syncing}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, padding: '0 6px', height: 'auto' }}>
            {syncing ? 'جاري المزامنة...' : 'مزامنة'}
          </Button>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
          {user?.role === 'admin' ? <CrownOutlined style={{ marginLeft: 4, color: '#D29922' }} /> : <UserOutlined style={{ marginLeft: 4 }} />}
          {user?.display_name}
        </div>
        <Button type="text" danger block icon={<LogoutOutlined />} onClick={logout}
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>تسجيل خروج</Button>
        <div style={{ textAlign: 'center', marginTop: 6, color: 'rgba(255,255,255,0.2)', fontSize: 10 }}
          >v{appVer || '...'}</div>
      </div>
    </Sider>
  )
}
