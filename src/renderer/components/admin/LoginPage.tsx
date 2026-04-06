import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, message, Tag, Tooltip, Select, Progress, Modal } from 'antd'
import {
  UserOutlined, LockOutlined, GlobalOutlined,
  MoonOutlined, SunOutlined, WifiOutlined, DisconnectOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined,
  CloudDownloadOutlined, SkinOutlined, LoginOutlined
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey, loadPersistentConfig } from '../../api/http'

const SECRET_WORD = '##settings'
const SECRET_CLICKS = 5

// ===== 3D Character with expressions =====
function Avatar({ peeking, style }: { peeking: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', width: 120, height: 120, ...style }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}>
        {/* Body */}
        <ellipse cx="100" cy="175" rx="45" ry="22" fill="#1B6B93" />
        {/* Neck */}
        <rect x="85" y="130" width="30" height="20" rx="5" fill="#FFD9B3" />
        {/* Head shape */}
        <ellipse cx="100" cy="80" rx="52" ry="58" fill="#FFD9B3" />
        {/* Hair */}
        <ellipse cx="100" cy="40" rx="55" ry="35" fill="#2C3E50" />
        <ellipse cx="55" cy="60" rx="12" ry="25" fill="#2C3E50" />
        <ellipse cx="145" cy="60" rx="12" ry="25" fill="#2C3E50" />
        {/* Ears */}
        <ellipse cx="48" cy="85" rx="8" ry="12" fill="#F5C7A0" />
        <ellipse cx="152" cy="85" rx="8" ry="12" fill="#F5C7A0" />
        {/* Eyes area */}
        {peeking ? (
          <>
            {/* Hands covering eyes */}
            <ellipse cx="78" cy="82" rx="22" ry="16" fill="#FFD9B3" stroke="#F5C7A0" strokeWidth="1" />
            <ellipse cx="122" cy="82" rx="22" ry="16" fill="#FFD9B3" stroke="#F5C7A0" strokeWidth="1" />
            {/* Fingers */}
            <rect x="60" y="74" width="8" height="18" rx="4" fill="#FFD9B3" />
            <rect x="70" y="72" width="8" height="20" rx="4" fill="#FFD9B3" />
            <rect x="122" y="72" width="8" height="20" rx="4" fill="#FFD9B3" />
            <rect x="132" y="74" width="8" height="18" rx="4" fill="#FFD9B3" />
            {/* Peeking eye between fingers */}
            <circle cx="100" cy="82" r="3" fill="#2C3E50" />
          </>
        ) : (
          <>
            {/* Eyebrows */}
            <path d="M 68 68 Q 78 62 88 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 112 68 Q 122 62 132 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Eye whites */}
            <ellipse cx="78" cy="82" rx="14" ry="11" fill="#fff" />
            <ellipse cx="122" cy="82" rx="14" ry="11" fill="#fff" />
            {/* Iris */}
            <circle cx="78" cy="83" r="7" fill="#4A6741" />
            <circle cx="122" cy="83" r="7" fill="#4A6741" />
            {/* Pupils */}
            <circle cx="78" cy="83" r="4" fill="#1A2332" />
            <circle cx="122" cy="83" r="4" fill="#1A2332" />
            {/* Eye shine */}
            <circle cx="81" cy="80" r="2.5" fill="#fff" />
            <circle cx="125" cy="80" r="2.5" fill="#fff" />
          </>
        )}
        {/* Nose */}
        <ellipse cx="100" cy="98" rx="4" ry="3" fill="#F0B78D" />
        {/* Mouth */}
        {peeking ? (
          <ellipse cx="100" cy="112" rx="6" ry="4" fill="#E8846B" />
        ) : (
          <path d="M 88 110 Q 100 122 112 110" stroke="#E8846B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {/* Cheeks */}
        <ellipse cx="62" cy="98" rx="8" ry="5" fill="rgba(255,150,150,0.3)" />
        <ellipse cx="138" cy="98" rx="8" ry="5" fill="rgba(255,150,150,0.3)" />
        {/* Shirt collar */}
        <path d="M 75 145 L 85 135 L 100 145 L 115 135 L 125 145" stroke="#fff" strokeWidth="2" fill="none" />
        {/* Badge */}
        <circle cx="100" cy="160" r="10" fill="#D29922" />
        <text x="100" y="164" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">م</text>
      </svg>
    </div>
  )
}

// ===== Animated wave background =====
function WaveBackground({ color1, color2, color3 }: { color1: string; color2: string; color3: string }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
        <path d="M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z" fill={color1} opacity="0.3">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
            values="M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z;
                    M0,220 C360,120 720,280 1080,180 C1260,210 1380,240 1440,220 L1440,400 L0,400 Z;
                    M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z" />
        </path>
        <path d="M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z" fill={color2} opacity="0.25">
          <animate attributeName="d" dur="6s" repeatCount="indefinite"
            values="M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z;
                    M0,240 C480,320 960,200 1440,280 L1440,400 L0,400 Z;
                    M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z" />
        </path>
        <path d="M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z" fill={color3} opacity="0.2">
          <animate attributeName="d" dur="10s" repeatCount="indefinite"
            values="M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z;
                    M0,300 C360,340 720,290 1080,330 C1260,310 1380,340 1440,300 L1440,400 L0,400 Z;
                    M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z" />
        </path>
      </svg>
    </div>
  )
}

// ===== Floating shapes =====
function FloatingShapes({ accent }: { accent: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[
        { w: 200, h: 200, top: '5%', left: '-5%', dur: 20, delay: 0, opacity: 0.04 },
        { w: 150, h: 150, top: '60%', right: '-3%', dur: 25, delay: 2, opacity: 0.05 },
        { w: 100, h: 100, top: '20%', right: '10%', dur: 18, delay: 4, opacity: 0.03 },
        { w: 120, h: 120, top: '70%', left: '5%', dur: 22, delay: 1, opacity: 0.04 },
        { w: 80, h: 80, top: '40%', left: '15%', dur: 15, delay: 3, opacity: 0.06 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: s.w, height: s.h, top: s.top, left: (s as any).left, right: (s as any).right,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: accent, opacity: s.opacity,
          animation: `morphFloat ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  )
}

const THEMES: Record<string, { name: string; bg: string; bgDark: string; accent: string; wave1: string; wave2: string; wave3: string; btnGrad: string }> = {
  ocean: { name: 'المحيط', bg: '#0B3D5B', bgDark: '#060E18', accent: '#1B6B93', wave1: '#1B6B93', wave2: '#3282B8', wave3: '#0f4c75', btnGrad: 'linear-gradient(135deg, #1B6B93, #3282B8)' },
  aurora: { name: 'الشفق', bg: '#1E1453', bgDark: '#0A0720', accent: '#7C3AED', wave1: '#6366f1', wave2: '#8b5cf6', wave3: '#4f46e5', btnGrad: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  sunset: { name: 'الغروب', bg: '#5C2E0E', bgDark: '#1A0E04', accent: '#D97706', wave1: '#d97706', wave2: '#f59e0b', wave3: '#b45309', btnGrad: 'linear-gradient(135deg, #d97706, #f59e0b)' },
  forest: { name: 'الغابة', bg: '#053225', bgDark: '#020E0A', accent: '#059669', wave1: '#059669', wave2: '#34d399', wave3: '#047857', btnGrad: 'linear-gradient(135deg, #047857, #34d399)' },
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
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<any>(null)
  const updater = (window as any).__updater
  const t = THEMES[loginTheme]

  useEffect(() => {
    (async () => {
      await loadPersistentConfig(); setServerUrlInput(getServerUrl()); setApiKeyInput(getApiKey()); setConfigLoaded(true)
      try { setAppVersion(await (window as any).__appVersion?.() || '') } catch {}
    })()
    if (updater) {
      updater.onUpdateAvailable((info: any) => setUpdateInfo(info))
      updater.onProgress((info: any) => setDownloadProgress(info.percent))
      updater.onUpdateDownloaded(() => { setDownloadProgress(null); setUpdateReady(true) })
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') { e.preventDefault(); setShowSettings(p => !p) } }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
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
      if (user) { let perms: any = {}; try { perms = JSON.parse(user.permissions || '{}') } catch {}; login({ ...user, permissions: perms }) }
      else { message.error('اسم المستخدم أو كلمة المرور غير صحيحة') }
    } catch { setLoading(false); message.error('تعذر الاتصال بالسيرفر') }
  }

  const saveAndHide = () => { setServerUrl(serverUrlInput); setApiKey(apiKeyInput); setShowSettings(false); checkServer(); message.success('تم حفظ الإعدادات') }
  const changeLoginTheme = (val: ThemeKey) => { setLoginTheme(val); localStorage.setItem('minasa_login_theme', val) }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: isDark ? t.bgDark : t.bg, transition: 'background 1s ease', position: 'relative', overflow: 'hidden'
    }}>
      {/* Animated waves */}
      <WaveBackground color1={t.wave1} color2={t.wave2} color3={t.wave3} />
      {/* Floating shapes */}
      <FloatingShapes accent={t.accent} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', zIndex: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} onClick={toggleTheme}
            style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
          <Select value={loginTheme} onChange={changeLoginTheme} size="small" popupMatchSelectWidth={false}
            style={{ minWidth: 80 }} suffixIcon={<SkinOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
            options={Object.entries(THEMES).map(([k, v]) => ({ value: k, label: v.name }))} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {appVersion && <Tag style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 11 }}>v{appVersion}</Tag>}
          {serverStatus === 'connected' && <Tag color="success" style={{ fontSize: 11 }}><WifiOutlined /> متصل</Tag>}
          {serverStatus === 'disconnected' && serverUrlInput && <Tag color="error" style={{ fontSize: 11 }}><DisconnectOutlined /> غير متصل</Tag>}
        </div>
      </div>

      {/* Character */}
      <div style={{ position: 'relative', zIndex: 10, marginBottom: -30, animation: 'avatarFloat 4s ease-in-out infinite' }}>
        <Avatar peeking={passwordFocused} />
      </div>

      {/* Glass card */}
      <div style={{
        width: 400, position: 'relative', zIndex: 10,
        background: isDark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 28, padding: '40px 32px 28px',
        boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.5)',
        animation: 'cardSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }} onClick={handleLogoClick}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none', letterSpacing: 1 }}>منصة</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 13 }}>نظام إدارة الزبائن والفواتير</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: !showSettings, message: 'أدخل اسم المستخدم' }]} style={{ marginBottom: 16 }}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />}
              placeholder="اسم المستخدم" autoFocus
              style={{ borderRadius: 14, height: 50, fontSize: 15, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: !showSettings, message: 'أدخل كلمة المرور' }]} style={{ marginBottom: 20 }}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)', fontSize: 16 }} />}
              placeholder="كلمة المرور"
              onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)}
              style={{ borderRadius: 14, height: 50, fontSize: 15, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }} />
          </Form.Item>

          {/* Hidden settings */}
          {showSettings && (
            <div style={{
              padding: 18, borderRadius: 16, marginBottom: 16,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: '1px dashed var(--border-color)', animation: 'fadeSlideDown 0.3s ease'
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, textAlign: 'center' }}>إعدادات السيرفر</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input prefix={<GlobalOutlined />} value={serverUrlInput} onChange={e => setServerUrlInput(e.target.value)}
                  placeholder="https://example.com" style={{ borderRadius: 10, flex: 1 }} />
                <Button onClick={checkServer} loading={checkingServer} style={{ borderRadius: 10 }}>فحص</Button>
              </div>
              {serverStatus === 'connected' && <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 6 }}><CheckCircleOutlined /> متاح</div>}
              {serverStatus === 'disconnected' && serverUrlInput && <div style={{ fontSize: 11, color: 'var(--error)', marginBottom: 6 }}><CloseCircleOutlined /> غير متاح</div>}
              <Input.Password prefix={<LockOutlined />} value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                placeholder="مفتاح API" style={{ borderRadius: 10, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" block onClick={saveAndHide} style={{ borderRadius: 10 }}>حفظ وإخفاء</Button>
                <Button block onClick={() => setShowSettings(false)} style={{ borderRadius: 10 }}>إخفاء</Button>
              </div>
            </div>
          )}

          <Button type="primary" htmlType="submit" block loading={loading} icon={<LoginOutlined />}
            style={{
              height: 52, borderRadius: 16, fontSize: 18, fontWeight: 700,
              background: t.btnGrad, border: 'none',
              boxShadow: `0 8px 24px ${t.accent}50`,
            }}>
            تسجيل الدخول
          </Button>
        </Form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 18, color: 'var(--text-muted)', fontSize: 11, opacity: 0.7 }}>
          منصة {appVersion && `• ${appVersion}`}
        </div>
      </div>

      {/* Update banner */}
      {(updateInfo || updateReady) && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          padding: '12px 24px', borderRadius: 16,
          background: isDark ? 'rgba(22,27,34,0.9)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 14, animation: 'slideUp 0.5s ease',
          color: 'var(--text-primary)', fontSize: 13
        }}>
          {updateReady ? (
            <>
              <CheckCircleOutlined style={{ color: '#2DA44E', fontSize: 20 }} />
              <span>التحديث جاهز</span>
              <Button size="small" type="primary" onClick={() => Modal.confirm({
                title: 'تثبيت التحديث', content: 'سيتم إعادة تشغيل البرنامج.',
                okText: 'ثبّت', cancelText: 'لاحقاً', onOk: () => updater?.install()
              })} style={{ borderRadius: 10, background: '#2DA44E', borderColor: '#2DA44E' }}>ثبّت الآن</Button>
            </>
          ) : downloadProgress !== null ? (
            <><span>جاري التحميل</span><Progress percent={downloadProgress} size="small" style={{ width: 140 }} strokeColor={t.accent} /></>
          ) : (
            <>
              <CloudDownloadOutlined style={{ color: t.accent, fontSize: 20 }} />
              <span>نسخة {updateInfo?.version}</span>
              <Button size="small" onClick={() => { setDownloadProgress(0); updater?.download() }}
                style={{ borderRadius: 10, background: t.accent, borderColor: t.accent, color: '#fff' }}>تحميل</Button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes avatarFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes cardSlideUp { from{opacity:0;transform:translateY(40px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateX(-50%) translateY(30px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes morphFloat {
          0%,100%{transform:rotate(0deg) scale(1);border-radius:30% 70% 70% 30%/30% 30% 70% 70%}
          25%{transform:rotate(5deg) scale(1.05);border-radius:70% 30% 30% 70%/70% 70% 30% 30%}
          50%{transform:rotate(-3deg) scale(0.95);border-radius:50% 50% 70% 30%/30% 70% 50% 50%}
          75%{transform:rotate(4deg) scale(1.02);border-radius:30% 70% 50% 50%/50% 30% 70% 50%}
        }
        .ant-select-selector{background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.15)!important;color:rgba(255,255,255,0.7)!important;border-radius:10px!important}
        .ant-select-arrow{color:rgba(255,255,255,0.4)!important}
      `}</style>
    </div>
  )
}
