import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Input, Button, message, Tag, Tooltip, Select, Progress, Modal } from 'antd'
import {
  UserOutlined, LockOutlined, GlobalOutlined,
  MoonOutlined, SunOutlined, WifiOutlined, DisconnectOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
  CloudDownloadOutlined, SkinOutlined
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey, loadPersistentConfig } from '../../api/http'

const SECRET_WORD = '##settings'
const SECRET_CLICKS = 5

// ===== Character SVG Component =====
function Character({ eyesClosed, style }: { eyesClosed: boolean; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 120" style={{ width: 90, height: 90, ...style }}>
      {/* Head */}
      <circle cx="60" cy="50" r="35" fill="#1B6B93" />
      {/* Body */}
      <ellipse cx="60" cy="100" rx="30" ry="18" fill="#1B6B93" />
      {/* Face background */}
      <circle cx="60" cy="52" r="28" fill="#e8f4f8" />
      {/* Eyes */}
      {eyesClosed ? (
        <>
          <line x1="42" y1="46" x2="52" y2="46" stroke="#1B6B93" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="68" y1="46" x2="78" y2="46" stroke="#1B6B93" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="47" cy="45" r="5" fill="#1A2332" />
          <circle cx="73" cy="45" r="5" fill="#1A2332" />
          <circle cx="48.5" cy="43.5" r="1.5" fill="#fff" />
          <circle cx="74.5" cy="43.5" r="1.5" fill="#fff" />
        </>
      )}
      {/* Smile */}
      <path d="M 48 58 Q 60 68 72 58" stroke="#1B6B93" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Cheeks */}
      <circle cx="40" cy="55" r="4" fill="rgba(207,34,46,0.15)" />
      <circle cx="80" cy="55" r="4" fill="rgba(207,34,46,0.15)" />
      {/* Hands covering eyes when password */}
      {eyesClosed && (
        <>
          <ellipse cx="47" cy="46" rx="12" ry="8" fill="#2D99C8" opacity="0.9" />
          <ellipse cx="73" cy="46" rx="12" ry="8" fill="#2D99C8" opacity="0.9" />
        </>
      )}
      {/* Hat/Badge */}
      <rect x="45" y="18" width="30" height="8" rx="4" fill="#D29922" />
      <text x="60" y="25" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="bold">م</text>
    </svg>
  )
}

// ===== Animated Background Particles =====
function ParticlesBG({ theme }: { theme: string }) {
  const colors = theme === 'ocean' ? ['#1B6B93', '#3282B8', '#0f4c75']
    : theme === 'aurora' ? ['#6366f1', '#8b5cf6', '#a78bfa']
    : theme === 'sunset' ? ['#f59e0b', '#ef4444', '#f97316']
    : ['#1B6B93', '#3282B8', '#0f4c75']

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 6 + Math.random() * 12,
          height: 6 + Math.random() * 12,
          borderRadius: '50%',
          background: colors[i % colors.length],
          opacity: 0.08 + Math.random() * 0.12,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `floatParticle ${8 + Math.random() * 12}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
        }} />
      ))}
    </div>
  )
}

// ===== Theme configs =====
const THEMES = {
  ocean: {
    name: 'المحيط',
    bg: 'linear-gradient(135deg, #0f4c75 0%, #1B6B93 40%, #3282B8 100%)',
    bgDark: 'linear-gradient(135deg, #0a2e4a 0%, #0D1117 50%, #1a3a5c 100%)',
    accent: '#1B6B93',
    cardBorder: '#3282B8',
  },
  aurora: {
    name: 'الشفق',
    bg: 'linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 100%)',
    bgDark: 'linear-gradient(135deg, #1e1b4b 0%, #0D1117 50%, #2e1065 100%)',
    accent: '#6366f1',
    cardBorder: '#8b5cf6',
  },
  sunset: {
    name: 'الغروب',
    bg: 'linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)',
    bgDark: 'linear-gradient(135deg, #451a03 0%, #0D1117 50%, #78350f 100%)',
    accent: '#d97706',
    cardBorder: '#f59e0b',
  },
  forest: {
    name: 'الغابة',
    bg: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #059669 100%)',
    bgDark: 'linear-gradient(135deg, #022c22 0%, #0D1117 50%, #064e3b 100%)',
    accent: '#059669',
    cardBorder: '#34d399',
  },
}

type ThemeKey = keyof typeof THEMES

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl())
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())
  const [appVersion, setAppVersion] = useState('')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [serverStatus, setServerStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')
  const [checkingServer, setCheckingServer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [loginTheme, setLoginTheme] = useState<ThemeKey>(() => (localStorage.getItem('minasa_login_theme') as ThemeKey) || 'ocean')
  // Updater
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<any>(null)
  const updater = (window as any).__updater

  const theme = THEMES[loginTheme]

  useEffect(() => {
    const init = async () => {
      await loadPersistentConfig()
      setServerUrlInput(getServerUrl())
      setApiKeyInput(getApiKey())
      setConfigLoaded(true)
      try { setAppVersion(await (window as any).__appVersion?.() || '') } catch {}
    }
    init()
    // Updater listeners
    if (updater) {
      updater.onUpdateAvailable((info: any) => setUpdateInfo(info))
      updater.onProgress((info: any) => setDownloadProgress(info.percent))
      updater.onUpdateDownloaded(() => { setDownloadProgress(null); setUpdateReady(true) })
    }
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); setShowSettings(p => !p) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogoClick = () => {
    logoClickCount.current++
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
    if (logoClickCount.current >= SECRET_CLICKS) { setShowSettings(p => !p); logoClickCount.current = 0; return }
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 1500)
  }

  const checkServer = async () => {
    if (!serverUrlInput) { setServerStatus('disconnected'); return }
    setCheckingServer(true)
    try {
      const c = new AbortController(); setTimeout(() => c.abort(), 4000)
      await fetch(`${serverUrlInput.replace(/\/+$/, '')}/api/platforms`, { signal: c.signal, headers: apiKeyInput ? { 'x-api-key': apiKeyInput } : {} })
      setServerStatus('connected')
    } catch { setServerStatus('disconnected') }
    setCheckingServer(false)
  }

  useEffect(() => { if (configLoaded && serverUrlInput) checkServer() }, [configLoaded])

  const handleLogin = async (values: any) => {
    if (values.username === SECRET_WORD) { setShowSettings(p => !p); return }
    setServerUrl(serverUrlInput); setApiKey(apiKeyInput); setLoading(true)
    try {
      const user = await window.api.users.login(values.username, values.password)
      setLoading(false)
      if (user) {
        let perms: any = {}; try { perms = JSON.parse(user.permissions || '{}') } catch {}
        login({ ...user, permissions: perms })
      } else { message.error('اسم المستخدم أو كلمة المرور غير صحيحة') }
    } catch { setLoading(false); message.error('تعذر الاتصال بالسيرفر') }
  }

  const saveAndHide = () => { setServerUrl(serverUrlInput); setApiKey(apiKeyInput); setShowSettings(false); checkServer(); message.success('تم حفظ الإعدادات') }

  const changeLoginTheme = (t: ThemeKey) => { setLoginTheme(t); localStorage.setItem('minasa_login_theme', t) }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark ? theme.bgDark : theme.bg,
      transition: 'background 0.8s ease', position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated particles */}
      <ParticlesBG theme={loginTheme} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', zIndex: 10 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
          <Select value={loginTheme} onChange={changeLoginTheme} size="small"
            style={{ width: 90 }} popupMatchSelectWidth={false}
            options={Object.entries(THEMES).map(([k, v]) => ({ value: k, label: v.name }))}
            suffixIcon={<SkinOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {appVersion && <Tag color="rgba(255,255,255,0.15)" style={{ color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 11 }}>v{appVersion}</Tag>}
          {serverStatus === 'connected' && <Tooltip title="متصل بالسيرفر"><Tag color="success" style={{ fontSize: 11 }}><WifiOutlined /> متصل</Tag></Tooltip>}
          {serverStatus === 'disconnected' && serverUrlInput && <Tooltip title="غير متصل"><Tag color="error" style={{ fontSize: 11 }}><DisconnectOutlined /> غير متصل</Tag></Tooltip>}
        </div>
      </div>

      {/* Update banner */}
      {(updateInfo || updateReady) && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 12, zIndex: 10,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: 13,
          animation: 'slideUp 0.5s ease'
        }}>
          {updateReady ? (
            <>
              <CheckCircleOutlined style={{ color: '#2DA44E', fontSize: 18 }} />
              <span>التحديث جاهز للتثبيت</span>
              <Button size="small" type="primary" onClick={() => Modal.confirm({
                title: 'تثبيت التحديث', content: 'سيتم إغلاق البرنامج وتثبيت النسخة الجديدة.',
                okText: 'ثبّت الآن', cancelText: 'لاحقاً', onOk: () => updater?.install()
              })} style={{ borderRadius: 8, background: '#2DA44E', borderColor: '#2DA44E' }}>ثبّت الآن</Button>
            </>
          ) : downloadProgress !== null ? (
            <>
              <span>جاري التحميل...</span>
              <Progress percent={downloadProgress} size="small" style={{ width: 120 }} strokeColor="#2DA44E" />
            </>
          ) : (
            <>
              <CloudDownloadOutlined style={{ color: '#D29922', fontSize: 18 }} />
              <span>نسخة جديدة {updateInfo?.version}</span>
              <Button size="small" onClick={() => { setDownloadProgress(0); updater?.download() }}
                style={{ borderRadius: 8, background: '#D29922', borderColor: '#D29922', color: '#fff' }}>تحميل</Button>
            </>
          )}
        </div>
      )}

      {/* Login Card */}
      <Card style={{
        width: 420, borderRadius: 24, border: 'none', background: 'var(--bg-card)',
        boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'visible', position: 'relative', zIndex: 5,
        animation: 'cardEntry 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
      }}>
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: '24px 24px 0 0',
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.cardBorder}, ${theme.accent})` }} />

        {/* Character - positioned above card */}
        <div style={{ position: 'absolute', top: -55, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <div style={{ animation: 'characterBounce 3s ease-in-out infinite' }}>
            <Character eyesClosed={passwordFocused} />
          </div>
        </div>

        <div style={{ paddingTop: 50, textAlign: 'center', marginBottom: 20 }}>
          {/* Logo - clickable for settings */}
          <div onClick={handleLogoClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
            <h2 style={{ margin: 0, fontSize: 26, color: 'var(--text-primary)', fontWeight: 700 }}>منصة</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 13 }}>نظام إدارة الزبائن والفواتير</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: !showSettings, message: 'أدخل اسم المستخدم' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="اسم المستخدم" style={{ borderRadius: 12, height: 48 }} autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: !showSettings, message: 'أدخل كلمة المرور' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="كلمة المرور" style={{ borderRadius: 12, height: 48 }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)} />
          </Form.Item>

          {/* Hidden Server Settings */}
          {showSettings && (
            <div style={{
              padding: 16, borderRadius: 14, marginBottom: 16,
              background: isDark ? 'rgba(255,255,255,0.05)' : `rgba(${loginTheme === 'ocean' ? '27,107,147' : loginTheme === 'aurora' ? '99,102,241' : loginTheme === 'sunset' ? '217,119,6' : '5,150,105'},0.06)`,
              border: '1px dashed var(--border-color)', animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, textAlign: 'center' }}>إعدادات السيرفر</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
                  value={serverUrlInput} onChange={e => setServerUrlInput(e.target.value)}
                  placeholder="https://example.com" style={{ borderRadius: 10, flex: 1 }}
                  status={serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') ? 'warning' : undefined} />
                <Button onClick={checkServer} loading={checkingServer} style={{ borderRadius: 10 }}>فحص</Button>
              </div>
              {serverStatus === 'connected' && <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 6 }}><CheckCircleOutlined /> السيرفر متاح</div>}
              {serverStatus === 'disconnected' && serverUrlInput && <div style={{ fontSize: 11, color: 'var(--error)', marginBottom: 6 }}><CloseCircleOutlined /> تعذر الاتصال</div>}
              <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                placeholder="مفتاح API" style={{ borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" block onClick={saveAndHide} style={{ borderRadius: 10 }}>حفظ وإخفاء</Button>
                <Button block onClick={() => setShowSettings(false)} style={{ borderRadius: 10 }}>إخفاء</Button>
              </div>
            </div>
          )}

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{
              height: 50, borderRadius: 14, fontSize: 17, fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.cardBorder})`,
              border: 'none', boxShadow: `0 6px 20px ${theme.accent}40`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
            دخول
          </Button>

          {!serverUrlInput && !showSettings && (
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <InfoCircleOutlined /> وضع محلي
            </div>
          )}
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: 11 }}>
          منصة {appVersion && `| ${appVersion}`}
        </div>
      </Card>

      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-30px) translateX(15px) scale(1.1); }
          50% { transform: translateY(-15px) translateX(-10px) scale(0.9); }
          75% { transform: translateY(-40px) translateX(20px) scale(1.05); }
        }
        @keyframes cardEntry {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes characterBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .ant-select-selector { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.2) !important; color: rgba(255,255,255,0.7) !important; border-radius: 8px !important; }
        .ant-select-arrow { color: rgba(255,255,255,0.5) !important; }
      `}</style>
    </div>
  )
}
