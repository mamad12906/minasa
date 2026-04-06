import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Collapse, Tag, Tooltip } from 'antd'
import {
  UserOutlined, LockOutlined, GlobalOutlined, SettingOutlined,
  MoonOutlined, SunOutlined, WifiOutlined, DisconnectOutlined,
  CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey, loadPersistentConfig } from '../../api/http'

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

  // Load persistent config on mount
  useEffect(() => {
    const init = async () => {
      await loadPersistentConfig()
      setServerUrlInput(getServerUrl())
      setApiKeyInput(getApiKey())
      setConfigLoaded(true)
      // Get app version
      try {
        const v = await (window as any).__appVersion?.()
        setAppVersion(v || '')
      } catch {}
    }
    init()
  }, [])

  // Check server connection
  const checkServer = async () => {
    if (!serverUrlInput) { setServerStatus('disconnected'); return }
    setCheckingServer(true)
    try {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 4000)
      const url = serverUrlInput.replace(/\/+$/, '')
      // Any response from server = connected (even 401/403)
      const res = await fetch(`${url}/api/platforms`, {
        signal: controller.signal,
        headers: apiKeyInput ? { 'x-api-key': apiKeyInput } : {}
      })
      // Server responded = connected (even if auth failed)
      setServerStatus('connected')
    } catch {
      // Network error / timeout = disconnected
      setServerStatus('disconnected')
    }
    setCheckingServer(false)
  }

  useEffect(() => {
    if (configLoaded && serverUrlInput) {
      checkServer()
    }
  }, [configLoaded])

  const handleLogin = async (values: any) => {
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
    } catch (err: any) {
      setLoading(false)
      message.error('تعذر الاتصال بالسيرفر. تحقق من رابط السيرفر.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark
        ? 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #1C2333 100%)'
        : 'linear-gradient(135deg, #0f4c75 0%, #1B6B93 50%, #3282B8 100%)',
      transition: 'background 0.5s',
      position: 'relative'
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px'
      }}>
        <Button type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {appVersion && (
            <Tag color="rgba(255,255,255,0.15)" style={{ color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 11 }}>
              v{appVersion}
            </Tag>
          )}
          {serverStatus === 'connected' && (
            <Tooltip title="متصل بالسيرفر">
              <Tag color="success" style={{ fontSize: 11 }}><WifiOutlined /> متصل</Tag>
            </Tooltip>
          )}
          {serverStatus === 'disconnected' && serverUrlInput && (
            <Tooltip title="غير متصل - وضع محلي">
              <Tag color="error" style={{ fontSize: 11 }}><DisconnectOutlined /> غير متصل</Tag>
            </Tooltip>
          )}
        </div>
      </div>

      <Card style={{
        width: 420, borderRadius: 20,
        boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.5)' : '0 12px 48px rgba(0,0,0,0.2)',
        border: 'none', background: 'var(--bg-card)',
        overflow: 'hidden'
      }}>
        {/* Header with gradient stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #1B6B93, #3282B8, #1B6B93)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 8 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #0f4c75, #1B6B93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(27,107,147,0.3)'
          }}>
            <span style={{ fontSize: 34, color: '#fff', fontWeight: 'bold' }}>م</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)', fontWeight: 700 }}>منصة</h2>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0', fontSize: 13 }}>نظام إدارة الزبائن والفواتير</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'أدخل اسم المستخدم' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="اسم المستخدم" style={{ borderRadius: 10, height: 46 }}
              autoFocus />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'أدخل كلمة المرور' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
              placeholder="كلمة المرور" style={{ borderRadius: 10, height: 46 }} />
          </Form.Item>

          <Collapse ghost size="small" style={{ marginBottom: 16 }}
            items={[{
              key: 'server',
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
                  <SettingOutlined /> إعدادات السيرفر
                  {serverStatus === 'connected' && <CheckCircleOutlined style={{ color: 'var(--success)', fontSize: 12 }} />}
                  {serverStatus === 'disconnected' && serverUrlInput && <CloseCircleOutlined style={{ color: 'var(--error)', fontSize: 12 }} />}
                </div>
              ),
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
                      value={serverUrlInput} onChange={e => setServerUrlInput(e.target.value)}
                      placeholder="https://example.com" style={{ borderRadius: 10, flex: 1 }}
                      status={serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') ? 'warning' : undefined} />
                    <Button onClick={checkServer} loading={checkingServer}
                      style={{ borderRadius: 10, minWidth: 70 }}>
                      فحص
                    </Button>
                  </div>
                  {serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') && (
                    <div style={{ fontSize: 11, color: '#D29922' }}><InfoCircleOutlined /> يُنصح باستخدام HTTPS لحماية البيانات</div>
                  )}
                  {serverStatus === 'connected' && (
                    <div style={{ fontSize: 11, color: 'var(--success)' }}><CheckCircleOutlined /> السيرفر متاح ويعمل</div>
                  )}
                  {serverStatus === 'disconnected' && serverUrlInput && (
                    <div style={{ fontSize: 11, color: 'var(--error)' }}><CloseCircleOutlined /> تعذر الاتصال بالسيرفر - يمكن الدخول بوضع محلي</div>
                  )}
                  <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                    value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="مفتاح API" style={{ borderRadius: 10 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                    الإعدادات تُحفظ تلقائياً ولا تُحذف عند التحديث
                  </div>
                </div>
              )
            }]} />

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{
              height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600,
              background: 'linear-gradient(135deg, #0f4c75, #1B6B93)',
              border: 'none', boxShadow: '0 4px 16px rgba(27,107,147,0.3)'
            }}>
            دخول
          </Button>

          {!serverUrlInput && (
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
              <InfoCircleOutlined /> بدون رابط سيرفر، سيعمل التطبيق بوضع محلي فقط
            </div>
          )}
        </Form>

        {/* Footer */}
        <div style={{
          textAlign: 'center', marginTop: 20, paddingTop: 16,
          borderTop: '1px solid var(--border-light)',
          color: 'var(--text-muted)', fontSize: 11
        }}>
          منصة - نظام إدارة الزبائن والفواتير {appVersion && `| الإصدار ${appVersion}`}
        </div>
      </Card>
    </div>
  )
}
