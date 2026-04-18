import React, { useState, useEffect, useRef } from 'react'
import { Form, Input, Button, message, Progress, Modal } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined,
  CloudDownloadOutlined, LockOutlined, GlobalOutlined,
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey, loadPersistentConfig } from '../../api/http'
import Icon from '../layout/Icon'

const SECRET_CLICKS = 7

const toArabicDigits = (s: string) => s.replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)])

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
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [updateReady, setUpdateReady] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<any>(null)
  const updater = (window as any).__updater

  useEffect(() => {
    (async () => {
      await loadPersistentConfig()
      setServerUrlInput(getServerUrl())
      setApiKeyInput(getApiKey())
      setConfigLoaded(true)
      try {
        setAppVersion(await (window as any).__appVersion?.() || '')
      } catch (err) {
        console.error('[LoginPage] Failed to get app version:', err)
      }
    })()
    if (updater) {
      updater.onUpdateAvailable((info: any) => setUpdateInfo(info))
      updater.onProgress((info: any) => setDownloadProgress(info.percent))
      updater.onUpdateDownloaded(() => { setDownloadProgress(null); setUpdateReady(true) })
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setShowSettings(p => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogoClick = () => {
    logoClickCount.current++
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
    if (logoClickCount.current >= SECRET_CLICKS) {
      setShowSettings(p => !p)
      logoClickCount.current = 0
      return
    }
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 1500)
  }

  const checkServer = async () => {
    if (!serverUrlInput) { setServerStatus('disconnected'); return }
    setCheckingServer(true)
    try {
      const c = new AbortController()
      setTimeout(() => c.abort(), 4000)
      await fetch(`${serverUrlInput.replace(/\/+$/, '')}/api/platforms`, {
        signal: c.signal,
        headers: apiKeyInput ? { 'x-api-key': apiKeyInput } : {},
      })
      setServerStatus('connected')
    } catch (err) {
      console.error('[LoginPage] Server check failed:', err)
      setServerStatus('disconnected')
    }
    setCheckingServer(false)
  }

  useEffect(() => { if (configLoaded && serverUrlInput) checkServer() }, [configLoaded])

  const handleLogin = async (values: any) => {
    setServerUrl(serverUrlInput)
    setApiKey(apiKeyInput)
    setLoading(true)
    try {
      const user = await window.api.users.login(values.username, values.password)
      setLoading(false)
      if (user) {
        let perms: any = {}
        try { perms = JSON.parse(user.permissions || '{}') }
        catch (err) { console.error('[LoginPage] Failed to parse permissions:', err) }
        login({ ...user, permissions: perms })
      } else {
        message.error('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch (err) {
      console.error('[LoginPage] Login failed:', err)
      setLoading(false)
      message.error('تعذر الاتصال بالسيرفر')
    }
  }

  const saveAndHide = () => {
    setServerUrl(serverUrlInput)
    setApiKey(apiKeyInput)
    setShowSettings(false)
    checkServer()
    message.success('تم حفظ الإعدادات')
  }

  const isDarkLayout = isDark

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1.1fr',
      background: 'var(--bg-base)',
      direction: 'rtl',
    }}>
      {/* ============ LEFT: Brand panel ============ */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0F4C3A 0%, #062A1F 100%)',
        padding: 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        {/* Radial overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at top left, rgba(212,165,116,0.18) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Logo + name (clickable for secret settings) */}
        <div
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
          onClick={handleLogoClick}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: 'linear-gradient(140deg, #D4A574, #A37B4F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(212,165,116,0.25)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 20V8l8-5 8 5v12M9 20v-7h6v7"
                stroke="#0F4C3A" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#F5F0E8', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
              منصة
            </div>
            <div style={{ color: '#D4A574', fontSize: 11, letterSpacing: '0.12em', fontWeight: 500 }}>
              MINASA CRM
            </div>
          </div>
        </div>

        {/* Middle hero text */}
        <div style={{ position: 'relative', maxWidth: 460 }}>
          <div className="eyebrow" style={{ color: '#D4A574', marginBottom: 14 }}>
            {appVersion ? `الإصدار ${toArabicDigits(appVersion)}` : 'منصة'}
          </div>
          <h1 style={{
            fontSize: 36,
            color: '#F5F0E8',
            lineHeight: 1.3,
            marginBottom: 16,
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>
            نظام إدارة الزبائن<br />
            والفواتير المتقدم
          </h1>
          <p style={{
            color: '#A8B2AD',
            fontSize: 14,
            maxWidth: 420,
            lineHeight: 1.8,
          }}>
            منظومة متكاملة لإدارة الزبائن، الفواتير، التذكيرات، والتواصل عبر واتساب.
          </p>
        </div>

        {/* Bottom meta */}
        <div style={{
          position: 'relative',
          display: 'flex',
          gap: 20,
          color: '#6B7570',
          fontSize: 11.5,
          alignItems: 'center',
        }}>
          <span>© {toArabicDigits('2026')} منصة</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>جميع الحقوق محفوظة</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7570',
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: 0,
            }}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={12} />
            {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          </button>
        </div>
      </div>

      {/* ============ RIGHT: Form panel ============ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: 'var(--bg-base)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>مرحباً بعودتك</div>
          <h2 style={{
            fontSize: 26,
            marginBottom: 8,
            color: 'var(--text-primary)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}>
            تسجيل الدخول
          </h2>
          <p style={{
            fontSize: 13,
            marginBottom: 28,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            أدخل بياناتك للوصول إلى لوحة التحكم
          </p>

          <Form onFinish={handleLogin} layout="vertical" requiredMark={false}>
            {/* Username */}
            <Form.Item
              name="username"
              rules={[{ required: !showSettings, message: 'أدخل اسم المستخدم' }]}
              style={{ marginBottom: 16 }}
              label={<span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>اسم المستخدم</span>}
            >
              <Input
                placeholder="admin"
                autoFocus
                style={{
                  height: 42,
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                }}
              />
            </Form.Item>

            {/* Password */}
            <Form.Item
              name="password"
              rules={[{ required: !showSettings, message: 'أدخل كلمة المرور' }]}
              style={{ marginBottom: 14 }}
              label={<span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>كلمة المرور</span>}
            >
              <Input.Password
                placeholder="••••••••"
                style={{
                  height: 42,
                  borderRadius: 10,
                  fontSize: 14,
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                }}
              />
            </Form.Item>

            {/* Remember me */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: 18,
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: 'var(--brand)' }}
              />
              تذكرني على هذا الجهاز
            </label>

            {/* Settings panel (hidden by default) */}
            {showSettings && (
              <div style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                background: 'var(--bg-elevated)',
                border: '1px dashed var(--border-strong)',
                animation: 'fadeSlideDown 0.25s ease',
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 10,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  إعدادات الخادم
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <Input
                    prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
                    value={serverUrlInput}
                    onChange={e => setServerUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    style={{ borderRadius: 8, flex: 1, height: 36 }}
                  />
                  <Button
                    onClick={checkServer}
                    loading={checkingServer}
                    style={{ borderRadius: 8, height: 36 }}
                    size="small"
                  >
                    فحص
                  </Button>
                </div>
                {serverStatus === 'connected' && (
                  <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8 }}>
                    <CheckCircleOutlined /> متاح
                  </div>
                )}
                {serverStatus === 'disconnected' && serverUrlInput && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>
                    <CloseCircleOutlined /> غير متاح
                  </div>
                )}
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="مفتاح API"
                  style={{ borderRadius: 8, marginBottom: 10, height: 36 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button type="primary" block onClick={saveAndHide} size="small" style={{ borderRadius: 8 }}>
                    حفظ وإخفاء
                  </Button>
                  <Button block onClick={() => setShowSettings(false)} size="small" style={{ borderRadius: 8 }}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 42,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--brand)',
                borderColor: 'var(--brand-strong)',
                marginTop: 4,
              }}
            >
              تسجيل الدخول
            </Button>
          </Form>

          {/* Connection status */}
          <div style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <span
              className="dot"
              style={{
                background: serverStatus === 'connected' ? 'var(--success)'
                  : serverStatus === 'disconnected' && serverUrlInput ? 'var(--danger)'
                  : 'var(--text-muted)',
              }}
            />
            {serverStatus === 'connected' && 'متصل بالخادم'}
            {serverStatus === 'disconnected' && serverUrlInput && 'غير متصل — وضع محلي'}
            {!serverUrlInput && 'وضع محلي'}
            {appVersion && <> · v{appVersion}</>}
          </div>
        </div>
      </div>

      {/* ============ Update toast ============ */}
      {(updateInfo || updateReady) && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          padding: '12px 20px',
          borderRadius: 14,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          animation: 'slideUp 0.4s ease',
          color: 'var(--text-primary)',
          fontSize: 13,
        }}>
          {updateReady ? (
            <>
              <CheckCircleOutlined style={{ color: 'var(--success)', fontSize: 18 }} />
              <span>التحديث جاهز</span>
              <Button
                size="small"
                type="primary"
                onClick={() => Modal.confirm({
                  title: 'تثبيت التحديث',
                  content: 'سيتم إعادة تشغيل البرنامج.',
                  okText: 'ثبّت',
                  cancelText: 'لاحقاً',
                  onOk: () => updater?.install(),
                })}
                style={{ borderRadius: 8 }}
              >
                ثبّت الآن
              </Button>
            </>
          ) : downloadProgress !== null ? (
            <>
              <span>جاري التحميل</span>
              <Progress percent={downloadProgress} size="small" style={{ width: 140 }} strokeColor="var(--brand)" />
            </>
          ) : (
            <>
              <CloudDownloadOutlined style={{ color: 'var(--brand)', fontSize: 18 }} />
              <span>نسخة {updateInfo?.version}</span>
              <Button
                size="small"
                type="primary"
                onClick={() => { setDownloadProgress(0); updater?.download() }}
                style={{ borderRadius: 8 }}
              >
                تحميل
              </Button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @media (max-width: 900px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
