import React, { useState, useEffect } from 'react'
import { Card, Button, message, Row, Col, Tag, InputNumber, Modal } from 'antd'
import {
  DatabaseOutlined, FileExcelOutlined, SaveOutlined, CheckCircleOutlined,
  CloudUploadOutlined, FolderOpenOutlined, ClockCircleOutlined, StopOutlined,
  ExclamationCircleOutlined, ReloadOutlined
} from '@ant-design/icons'
import { useAuth } from '../../App'

export default function BackupPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [loading, setLoading] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [autoDir, setAutoDir] = useState('')
  const [autoHours, setAutoHours] = useState(0)
  const [autoActive, setAutoActive] = useState(false)
  const [newHours, setNewHours] = useState<number>(24)

  useEffect(() => { loadAutoSettings() }, [])

  const loadAutoSettings = async () => {
    const s = await window.api.backup.autoGet()
    setAutoDir(s.dir || ''); setAutoHours(s.hours || 0); setAutoActive(!!(s.dir && s.hours > 0))
  }

  const action = async (key: string, fn: () => Promise<any>) => {
    setLoading(key); setLastResult(null)
    const r = await fn(); setLoading(null)
    if (r && typeof r === 'string') { setLastResult(r); message.success('تم بنجاح!') }
    else if (r?.success) { message.success(r.message || 'تم بنجاح!') }
    else if (r === null) { message.info('تم الإلغاء') }
    else { message.error(r?.message || 'حدث خطأ') }
    return r
  }

  const doRestore = () => {
    Modal.confirm({
      title: 'استرجاع النسخة الاحتياطية', icon: <ExclamationCircleOutlined />,
      content: 'سيتم استبدال قاعدة البيانات الحالية بالنسخة الاحتياطية. هل تريد المتابعة؟',
      okText: 'نعم، استرجع', cancelText: 'إلغاء', okButtonProps: { danger: true },
      onOk: async () => {
        const r = await action('restore', () => window.api.backup.restore())
        if (r?.success) Modal.success({ title: 'تم الاسترجاع', content: 'يرجى إعادة تشغيل البرنامج.', okText: 'حسناً' })
      }
    })
  }

  const setupAuto = async () => {
    const dir = await window.api.backup.selectDir()
    if (!dir) return
    await window.api.backup.autoSetup(dir, newHours)
    message.success(`تم تفعيل النسخ التلقائي كل ${newHours} ساعة`); loadAutoSettings()
  }

  const stopAuto = async () => {
    await window.api.backup.autoStop(); message.success('تم إيقاف النسخ التلقائي'); loadAutoSettings()
  }

  const iconBox = (bg: string): React.CSSProperties => ({
    width: 56, height: 56, borderRadius: 14, margin: '0 auto 12px',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.25s', fontSize: 26, color: '#fff'
  })

  return (
    <div>
      <div className="page-header">
        <h2><SaveOutlined style={{ marginLeft: 8 }} />نسخ احتياطي واسترجاع</h2>
        <p>{isAdmin ? 'إدارة النسخ الاحتياطية لجميع البيانات' : `نسخ احتياطي لزبائن ${user?.platform_name}`}</p>
      </div>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={{ borderRadius: 14, border: '1px solid var(--border-light)', height: '100%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div className="backup-icon" style={iconBox('#1B6B93')}><DatabaseOutlined /></div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>نسخة قاعدة البيانات</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>ملف .db كامل</p>
                <Button type="primary" size="large" loading={loading === 'db'} onClick={() => action('db', window.api.backup.database)}
                  style={{ borderRadius: 8, minWidth: 150 }}><SaveOutlined /> حفظ</Button>
              </div>
            </Card>
          </Col>
        )}
        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={{ borderRadius: 14, border: '1px solid var(--border-light)', height: '100%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div className="backup-icon" style={iconBox('#CF222E')}><ReloadOutlined /></div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>استرجاع نسخة احتياطية</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>استرجاع ملف .db سابق</p>
                <Button danger size="large" loading={loading === 'restore'} onClick={doRestore}
                  style={{ borderRadius: 8, minWidth: 150 }}><CloudUploadOutlined /> استرجاع</Button>
              </div>
            </Card>
          </Col>
        )}
        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={{ borderRadius: 14, border: '1px solid var(--border-light)', height: '100%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div className="backup-icon" style={iconBox('#2DA44E')}><FileExcelOutlined /></div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>تصدير كل الزبائن Excel</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>كل الزبائن مع اسم الموظف</p>
                <Button type="primary" size="large" loading={loading === 'excel-all'} onClick={() => action('excel-all', window.api.backup.excelAll)}
                  style={{ borderRadius: 8, minWidth: 150, background: '#2DA44E', borderColor: '#2DA44E' }}><FileExcelOutlined /> تصدير</Button>
              </div>
            </Card>
          </Col>
        )}
        <Col xs={24} sm={12} lg={isAdmin ? 8 : 24}>
          <Card hoverable className="backup-card" style={{ borderRadius: 14, border: '1px solid var(--border-light)', height: '100%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div className="backup-icon" style={iconBox('#1B6B93')}><FileExcelOutlined /></div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 4 }}>{isAdmin ? 'تصدير زبائني' : 'تصدير زبائني'}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                Excel لزبائن <Tag color="blue">{user?.display_name}</Tag>
              </p>
              <Button type="primary" size="large" loading={loading === 'user-export'}
                onClick={() => action('user-export', () => window.api.backup.excelUser(user?.id || 0, user?.display_name || ''))}
                style={{ borderRadius: 8, minWidth: 150 }}><FileExcelOutlined /> تصدير زبائني</Button>
            </div>
          </Card>
        </Col>
      </Row>

      {isAdmin && (
        <div className="hover-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: autoActive ? '#2DA44E' : '#D29922',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ClockCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 15 }}>النسخ الاحتياطي التلقائي</h3>
              {autoActive ? <Tag color="success" style={{ marginTop: 4 }}>مفعّل - كل {autoHours} ساعة</Tag>
                : <Tag color="warning" style={{ marginTop: 4 }}>غير مفعّل</Tag>}
            </div>
          </div>
          {autoActive && (
            <div style={{ padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 8, border: '1px solid var(--success-border)', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}><FolderOpenOutlined style={{ marginLeft: 6 }} />المجلد: <strong style={{ wordBreak: 'break-all' }}>{autoDir}</strong></div>
              <div style={{ fontSize: 13, marginTop: 3 }}><ClockCircleOutlined style={{ marginLeft: 6 }} />كل <strong>{autoHours}</strong> ساعة</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {!autoActive ? (
              <>
                <span style={{ fontSize: 14 }}>كل</span>
                <InputNumber min={1} max={168} value={newHours} onChange={v => setNewHours(v || 24)} style={{ width: 80, borderRadius: 8 }} />
                <span style={{ fontSize: 14 }}>ساعة</span>
                <Button type="primary" icon={<ClockCircleOutlined />} onClick={setupAuto}
                  style={{ borderRadius: 8, background: '#D29922', borderColor: '#D29922' }}>تفعيل وتحديد المجلد</Button>
              </>
            ) : (
              <Button danger icon={<StopOutlined />} onClick={stopAuto} style={{ borderRadius: 8 }}>إيقاف النسخ التلقائي</Button>
            )}
          </div>
        </div>
      )}

      {lastResult && (
        <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: 'var(--success-bg)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--success)' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--success)', fontSize: 15 }}>تم بنجاح!</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, wordBreak: 'break-all' }}>{lastResult}</div>
          </div>
        </div>
      )}
    </div>
  )
}
