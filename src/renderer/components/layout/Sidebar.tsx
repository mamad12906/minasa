import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Badge, Popover, Button, Empty, Tag, Progress, Modal } from 'antd'
import {
  DashboardOutlined, UserOutlined, UploadOutlined,
  CrownOutlined, BellOutlined, LogoutOutlined, SaveOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons'
import { useAuth } from '../../App'

const { Sider } = Layout
const updater = (window as any).__updater

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, can } = useAuth()
  const [allReminders, setAllReminders] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  const isAdmin = user?.role === 'admin'
  const userId = (!isAdmin && user?.id) ? user.id : undefined

  // Auto-updater listeners
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

  // Listen for custom event to refresh reminders
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
    ...(can('import') ? [{ key: '/import', icon: <UploadOutlined />, label: 'استيراد Excel' }] : []),
    { key: '/backup', icon: <SaveOutlined />, label: 'نسخ احتياطي' },
    ...(user?.role === 'admin' ? [{ key: '/admin', icon: <CrownOutlined />, label: 'لوحة الأدمن' }] : [])
  ]

  const bellContent = (
    <div style={{ width: 440, maxHeight: 520, overflow: 'auto' }}>
      {allReminders.length === 0 ? (
        <Empty description="لا توجد تذكيرات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 10, padding: '6px 10px', background: '#f5f5f5', borderRadius: 8 }}>
            📌 اضغط على اسم الزبون للذهاب إليه. للتعامل مع التذكير افتح تفاصيل الزبون (👁 العين).
          </div>
          {allReminders.map((r: any) => {
            const isDone = r.is_done === 1
            const isDue = !isDone && r.reminder_date <= today

            return (
              <div key={r.id} style={{
                padding: '14px 16px', marginBottom: 8, borderRadius: 12,
                background: isDone ? '#f0fff0' : isDue ? '#fff0f0' : '#fffdf0',
                border: `2px solid ${isDone ? '#52c41a' : isDue ? '#ff4d4f' : '#faad14'}`,
                borderRight: `6px solid ${isDone ? '#52c41a' : isDue ? '#ff4d4f' : '#faad14'}`,
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 6 }}>
                      <Tag color={isDone ? 'green' : isDue ? 'red' : 'orange'}
                        style={{ fontSize: 14, padding: '2px 10px' }}>
                        {r.reminder_text}
                      </Tag>
                      {isDone && <Tag color="success" style={{ fontSize: 13 }}>✓ تم التعامل</Tag>}
                      {isDue && !isDone && <Tag color="error" style={{ fontSize: 13 }}>⚠ يحتاج تعامل</Tag>}
                    </div>
                    <a onClick={() => goToCustomer(r.full_name)}
                      style={{
                        fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
                        color: '#1677ff', textDecoration: 'underline'
                      }}>
                      {r.full_name}
                    </a>
                    <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
                      {r.phone_number && <span>{r.phone_number}</span>}
                      {r.ministry_name && <span> | {r.ministry_name}</span>}
                    </div>
                    {isDone && r.handled_by && (
                      <div style={{ fontSize: 13, color: '#52c41a', marginTop: 4 }}>
                        👤 الموظف: <strong>{r.handled_by}</strong>
                        {r.handle_method && <span> | {r.handle_method}</span>}
                      </div>
                    )}
                    {r.is_postponed === 1 && r.postpone_reason && (
                      <div style={{ fontSize: 13, color: '#faad14', marginTop: 4 }}>
                        🔄 سبب الإعادة: {r.postpone_reason}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0, marginTop: 2 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 'bold',
                      color: isDone ? '#52c41a' : isDue ? '#ff4d4f' : '#faad14'
                    }}>{r.reminder_date}</div>
                    {r.original_date && r.original_date !== r.reminder_date && (
                      <div style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>{r.original_date}</div>
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
      background: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      overflow: 'auto', height: '100vh', position: 'fixed',
      right: 0, top: 0, bottom: 0, zIndex: 10
    }}>
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: 10, boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
        }}>
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>م</span>
        </div>
        <h1 style={{ color: '#fff', margin: 0, fontSize: 22, fontWeight: 'bold' }}>منصة</h1>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <Popover content={bellContent} title="التذكيرات" trigger="click"
          open={bellOpen} onOpenChange={setBellOpen} placement="leftTop">
          <Badge count={pendingCount} offset={[-5, 5]} size="small">
            <Button type="text" icon={<BellOutlined />} style={{
              color: pendingCount > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.6)',
              fontSize: 22,
              animation: pendingCount > 0 ? 'shake 1.5s infinite' : 'none'
            }} />
          </Badge>
        </Popover>
      </div>

      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}
        items={menuItems} onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 'none', background: 'transparent' }} />

      <div style={{
        position: 'absolute', bottom: 0, width: '100%', padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)'
      }}>
        {/* Update notification */}
        {updateInfo && !updateReady && downloadProgress === null && (
          <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(250,173,20,0.15)', border: '1px solid rgba(250,173,20,0.3)', textAlign: 'center' }}>
            <div style={{ color: '#faad14', fontSize: 12, marginBottom: 6 }}>
              <CloudDownloadOutlined /> نسخة جديدة {updateInfo.version}
            </div>
            <Button size="small" type="primary" block onClick={() => { setDownloadProgress(0); updater?.download() }}
              style={{ borderRadius: 6, background: '#faad14', borderColor: '#faad14', color: '#333', fontSize: 12 }}>
              تحميل التحديث
            </Button>
          </div>
        )}
        {downloadProgress !== null && (
          <div style={{ marginBottom: 10, textAlign: 'center' }}>
            <div style={{ color: '#52c41a', fontSize: 11, marginBottom: 4 }}>جاري التحميل...</div>
            <Progress percent={downloadProgress} size="small" strokeColor="#52c41a" />
          </div>
        )}
        {updateReady && (
          <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(82,196,26,0.15)', border: '1px solid rgba(82,196,26,0.3)', textAlign: 'center' }}>
            <div style={{ color: '#52c41a', fontSize: 12, marginBottom: 6 }}>
              ✓ التحديث جاهز للتثبيت
            </div>
            <Button size="small" type="primary" block
              onClick={() => Modal.confirm({ title: 'تثبيت التحديث', content: 'سيتم إغلاق البرنامج وتثبيت النسخة الجديدة. هل تريد المتابعة؟', okText: 'ثبّت الآن', cancelText: 'لاحقاً', onOk: () => updater?.install() })}
              style={{ borderRadius: 6, background: '#52c41a', borderColor: '#52c41a', fontSize: 12 }}>
              ثبّت الآن وأعد التشغيل
            </Button>
          </div>
        )}

        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
          {user?.role === 'admin' ? <CrownOutlined style={{ marginLeft: 4, color: '#faad14' }} /> : <UserOutlined style={{ marginLeft: 4 }} />}
          {user?.display_name}
        </div>
        <Button type="text" danger block icon={<LogoutOutlined />} onClick={logout}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>تسجيل خروج</Button>
        <div style={{ textAlign: 'center', marginTop: 8, color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>v1.0.5</div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
          75% { transform: rotate(10deg); }
        }
      `}</style>
    </Sider>
  )
}
