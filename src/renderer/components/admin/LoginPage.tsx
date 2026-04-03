import React, { useState } from 'react'
import { Card, Form, Input, Button, message, Collapse } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuth } from '../../App'
import { setServerUrl, getServerUrl, setApiKey, getApiKey } from '../../api/http'

export default function LoginPage() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [serverUrlInput, setServerUrlInput] = useState(getServerUrl())
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey())

  const handleLogin = async (values: any) => {
    // Save server URL and API key
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{
        width: 420, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: 'none', overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
          }}>
            <span style={{ fontSize: 36, color: '#fff', fontWeight: 'bold' }}>م</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 22 }}>منصة</h2>
          <p style={{ color: '#999', margin: '4px 0 0' }}>تسجيل الدخول</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'أدخل اسم المستخدم' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="اسم المستخدم"
              style={{ borderRadius: 10, height: 48 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'أدخل كلمة المرور' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="كلمة المرور"
              style={{ borderRadius: 10, height: 48 }} />
          </Form.Item>

          <Collapse ghost size="small" style={{ marginBottom: 16 }}
            items={[{
              key: 'server',
              label: <span style={{ color: '#999', fontSize: 13 }}><SettingOutlined /> إعدادات السيرفر</span>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Input prefix={<GlobalOutlined style={{ color: '#bbb' }} />}
                    value={serverUrlInput}
                    onChange={e => setServerUrlInput(e.target.value)}
                    placeholder="رابط السيرفر"
                    style={{ borderRadius: 10 }} />
                  <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />}
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="مفتاح API"
                    style={{ borderRadius: 10 }} />
                </div>
              )
            }]} />

          <Button type="primary" htmlType="submit" block loading={loading}
            style={{
              height: 48, borderRadius: 10, fontSize: 16, fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none', boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
            دخول
          </Button>
        </Form>
      </Card>
    </div>
  )
}
