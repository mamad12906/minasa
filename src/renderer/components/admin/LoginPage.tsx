import React, { useState, useEffect, useRef } from 'react'
import { Card, Form, Input, Button, message, Tag, Tooltip } from 'antd'
import {
  UserOutlined, LockOutlined, GlobalOutlined,
  MoonOutlined, SunOutlined, WifiOutlined, DisconnectOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey, loadPersistentConfig } from '../../api/http'

// Secret code to show settings
const SECRET_WORD = '##settings'
const SECRET_CLICKS = 5
const SECRET_KEY_COMBO = 'ctrl+shift+s'

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
  // Hidden settings
  const [showSettings, setShowSettings] = useState(false)
  const logoClickCount = useRef(0)
  const logoClickTimer = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      await loadPersistentConfig()
      setServerUrlInput(getServerUrl())
      setApiKeyInput(getApiKey())
      setConfigLoaded(true)
      try { setAppVersion(await (window as any).__appVersion?.() || '') } catch {}
    }
    init()
  }, [])

  // Keyboard shortcut: Ctrl+Shift+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setShowSettings(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Logo click: 5 rapid clicks
  const handleLogoClick = () => {
    logoClickCount.current++
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current)
    if (logoClickCount.current >= SECRET_CLICKS) {
      setShowSettings(prev => !prev)
      logoClickCount.current = 0
      return
    }
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0 }, 1500)
  }

  const checkServer = async () => {
    if (!serverUrlInput) { setServerStatus('disconnected'); return }
    setCheckingServer(true)
    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 4000)
      await fetch(`${serverUrlInput.replace(/\/+$/, '')}/api/platforms`, {
        signal: controller.signal,
        headers: apiKeyInput ? { 'x-api-key': apiKeyInput } : {}
      })
      setServerStatus('connected')
    } catch {
      setServerStatus('disconnected')
    }
    setCheckingServer(false)
  }

  useEffect(() => {
    if (configLoaded && serverUrlInput) checkServer()
  }, [configLoaded])

  const handleLogin = async (values: any) => {
    // Secret word in username field
    if (values.username === SECRET_WORD) {
      setShowSettings(prev => !prev)
      return
    }
    setServerUrl(serverUrlInput)
    setApiKey(apiKeyInput)
    setLoading(true)
    try {
      const user = await window.api.users.login(values.username, values.password)
      setLoading(false)
      if (user) {
        let perms: any = {}
        try { perms = JSON.parse(user.permissions || '{}') } catch {}
        login({ ...user, permissions: perms })
      } else {
        message.error('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch {
      setLoading(false)
      message.error('تعذر الاتصال بالسيرفر. تحقق من رابط السيرفر.')
    }
  }

  const saveAndHide = () => {
    setServerUrl(serverUrlInput)
    setApiKey(apiKeyInput)
    setShowSettings(false)
    checkServer()
    message.success('تم حفظ الإعدادات')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #1C2333 100%)'
        : 'linear-gradient(135deg, #0f4c75 0%, #1B6B93 50%, #3282B8 100%)',
      transition: 'background 0.5s', position: 'relative'
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px'
      }}>
        <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {appVersion && (
            <Tag color="rgba(255,255,255,0.15)" style={{ color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 11 }}>v{appVersion}</Tag>
          )}
          {serverStatus === 'connected' && (
            <Tooltip title="متصل بالسيرفر"><Tag color="success" style={{ fontSize: 11 }}><WifiOutlined /> متصل</Tag></Tooltip>
          )}
          {serverStatus === 'disconnected' && serverUrlInput && (
            <Tooltip title="غير متصل - وضع محلي"><Tag color="error" style={{ fontSize: 11 }}><DisconnectOutlined /> غير متصل</Tag></Tooltip>
          )}
        </div>
      </div>

      <Card style={{
        width: 420, borderRadius: 20,
        boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.2)',
        border: 'none', background: 'var(--bg-card)', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #1B6B93, #3282B8, #1B6B93)' }} />

        <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 8 }}>
          {/* Logo - click 5 times to show settings */}
          <div onClick={handleLogoClick} style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0f4c75, #1B6B93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(27,107,147,0.3)', cursor: 'pointer',
            userSelect: 'none', transition: 'transform 0.2s',
          }}>
            <span style={{ fontSize: 34, color: '#fff', fontWeight: 'bold' }}>م</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)', fontWeight: 700 }}>منصة</h2>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0', fontSize: 13 }}>نظام إدارة الزبائن والفواتير</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: !showSettings, message: 'أدخل اسم المستخدم' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="اسم المستخدم" style={{ borderRadius: 10, height: 46 }} autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: !showSettings, message: 'أدخل كلمة المرور' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="كلمة المرور" style={{ borderRadius: 10, height: 46 }} />
          </Form.Item>

          {/* Hidden Server Settings */}
          {showSettings && (
            <div style={{
              padding: 16, borderRadius: 12, marginBottom: 16,
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(27,107,147,0.05)',
              border: '1px dashed var(--border-color)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, textAlign: 'center' }}>
                إعدادات السيرفر
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
                  value={serverUrlInput} onChange={e => setServerUrlInput(e.target.value)}
                  placeholder="https://example.com" style={{ borderRadius: 10, flex: 1 }}
                  status={serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') ? 'warning' : undefined} />
                <Button onClick={checkServer} loading={checkingServer} style={{ borderRadius: 10 }}>فحص</Button>
              </div>
              {serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') && (
                <div style={{ fontSize: 11, color: '#D29922', marginBottom: 6 }}><InfoCircleOutlined /> يُنصح باستخدام HTTPS</div>
              )}
              {serverStatus === 'connected' && (
                <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 6 }}><CheckCircleOutlined /> السيرفر متاح</div>
              )}
              {serverStatus === 'disconnected' && serverUrlInput && (
                <div style={{ fontSize: 11, color: 'var(--error)', marginBottom: 6 }}><CloseCircleOutlined /> تعذر الاتصال</div>
              )}
              <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                placeholder="مفتاح API" style={{ borderRadius: 10, marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button type="primary" block onClick={saveAndHide} style={{ borderRadius: 10 }}>حفظ وإخفاء</Button>
                <Button block onClick={() => setShowSettings(false)} style={{ borderRadius: 10 }}>إخفاء</Button>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                الإعدادات تُحفظ في ملف دائم ولا تُحذف عند التحديث
              </div>
            </div>
          )}

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{
              height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600,
              background: 'linear-gradient(135deg, #0f4c75, #1B6B93)',
              border: 'none', boxShadow: '0 4px 16px rgba(27,107,147,0.3)'
            }}>
            دخول
          </Button>

          {!serverUrlInput && !showSettings && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <InfoCircleOutlined /> بدون سيرفر، يعمل بوضع محلي
            </div>
          )}
        </Form>

        <div style={{
          textAlign: 'center', marginTop: 20, paddingTop: 16,
          borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: 11
        }}>
          منصة - نظام إدارة الزبائن والفواتير {appVersion && `| ${appVersion}`}
        </div>
      </Card>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
