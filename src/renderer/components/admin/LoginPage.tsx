import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Collapse } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined, SettingOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useAuth, useTheme } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey } from '../../api/http'

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl())
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())

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
      background: isDark ? '#0D1117' : '#1B6B93',
      transition: 'background 0.3s'
    }}>
      <Button type="text"
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        style={{ position: 'absolute', top: 20, left: 20, color: '#fff', fontSize: 18, opacity: 0.6 }}
      />

      <Card style={{
        width: 400, borderRadius: 16,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.15)',
        border: 'none', background: 'var(--bg-card)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, margin: '0 auto 14px',
            background: '#1B6B93',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 30, color: '#fff', fontWeight: 'bold' }}>م</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)', fontWeight: 700 }}>منصة</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14 }}>تسجيل الدخول</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'أدخل اسم المستخدم' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="اسم المستخدم"
              style={{ borderRadius: 10, height: 46 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'أدخل كلمة المرور' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="كلمة المرور"
              style={{ borderRadius: 10, height: 46 }} />
          </Form.Item>

          <Collapse ghost size="small" style={{ marginBottom: 16 }}
            items={[{
              key: 'server',
              label: <span style={{ color: 'var(--text-muted)', fontSize: 13 }}><SettingOutlined /> إعدادات السيرفر</span>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Input prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
                    value={serverUrlInput} onChange={e => setServerUrlInput(e.target.value)}
                    placeholder="https://example.com" style={{ borderRadius: 10 }}
                    status={serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') ? 'warning' : undefined} />
                  {serverUrlInput && !serverUrlInput.startsWith('https') && !serverUrlInput.includes('localhost') && !serverUrlInput.includes('192.168') && (
                    <div style={{ fontSize: 11, color: '#D29922' }}>يُنصح باستخدام HTTPS لحماية البيانات</div>
                  )}
                  <Input.Password prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
                    value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="مفتاح API" style={{ borderRadius: 10 }} />
                </div>
              )
            }]} />

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{ height: 46, borderRadius: 10, fontSize: 16, fontWeight: 600 }}>
            دخول
          </Button>
        </Form>
      </Card>
    </div>
  )
}
