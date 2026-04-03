import React, { useState, useEffect } from 'react'
import { Card, Button, message, Row, Col, Tag, InputNumber, Modal, Divider } from 'antd'
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
    setAutoDir(s.dir || '')
    setAutoHours(s.hours || 0)
    setAutoActive(!!(s.dir && s.hours > 0))
  }

  const action = async (key: string, fn: () => Promise<any>) => {
    setLoading(key); setLastResult(null)
    const r = await fn()
    setLoading(null)
    if (r && typeof r === 'string') { setLastResult(r); message.success('تم بنجاح!') }
    else if (r?.success) { message.success(r.message || 'تم بنجاح!') }
    else if (r === null) { message.info('تم الإلغاء') }
    else { message.error(r?.message || 'حدث خطأ') }
    return r
  }

  const doRestore = () => {
    Modal.confirm({
      title: 'استرجاع النسخة الاحتياطية',
      icon: <ExclamationCircleOutlined />,
      content: 'سيتم استبدال قاعدة البيانات الحالية بالنسخة الاحتياطية. سيتم حفظ نسخة من الحالية قبل الاستبدال. هل تريد المتابعة؟',
      okText: 'نعم، استرجع',
      cancelText: 'إلغاء',
      okButtonProps: { danger: true },
      onOk: async () => {
        const r = await action('restore', () => window.api.backup.restore())
        if (r?.success) {
          Modal.success({
            title: 'تم الاسترجاع',
            content: 'تم استرجاع النسخة الاحتياطية. يرجى إعادة تشغيل البرنامج.',
            okText: 'حسناً'
          })
        }
      }
    })
  }

  const setupAuto = async () => {
    const dir = await window.api.backup.selectDir()
    if (!dir) return
    await window.api.backup.autoSetup(dir, newHours)
    message.success(`تم تفعيل النسخ التلقائي كل ${newHours} ساعة`)
    loadAutoSettings()
  }

  const stopAuto = async () => {
    await window.api.backup.autoStop()
    message.success('تم إيقاف النسخ التلقائي')
    loadAutoSettings()
  }

  const cardStyle = (gradient: string, shadow: string): React.CSSProperties => ({
    borderRadius: 16, border: 'none', height: '100%', overflow: 'hidden',
    boxShadow: `0 6px 24px ${shadow}`,
    transition: 'all 0.4s cubic-bezier(.4,0,.2,1)', cursor: 'pointer',
    position: 'relative'
  })

  const iconBoxStyle = (bg: string, shadow: string): React.CSSProperties => ({
    width: 64, height: 64, borderRadius: 16, margin: '0 auto 14px',
    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 8px 24px ${shadow}`, transition: 'transform 0.4s',
    fontSize: 30, color: '#fff'
  })

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff',
        boxShadow: '0 8px 32px rgba(17, 153, 142, 0.3)',
        transition: 'transform 0.3s'
      }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#fff' }}>
          <SaveOutlined style={{ marginLeft: 10 }} />نسخ احتياطي واسترجاع
        </h2>
        <p style={{ margin: '4px 0 0', opacity: 0.85 }}>
          {isAdmin ? 'إدارة النسخ الاحتياطية لجميع البيانات' : `نسخ احتياطي لزبائن ${user?.platform_name}`}
        </p>
      </div>

      {/* Manual Backup Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={cardStyle(
              'linear-gradient(135deg, #667eea, #764ba2)', 'rgba(102,126,234,0.15)')}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="backup-icon" style={iconBoxStyle(
                  'linear-gradient(135deg, #667eea, #764ba2)', 'rgba(102,126,234,0.4)')}>
                  <DatabaseOutlined />
                </div>
                <h3>نسخة قاعدة البيانات</h3>
                <p style={{ color: '#888', fontSize: 13 }}>ملف .db كامل</p>
                <Tag color="gold" style={{ marginBottom: 12 }}>أدمن</Tag><br />
                <Button type="primary" size="large" loading={loading === 'db'}
                  onClick={() => action('db', window.api.backup.database)}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', minWidth: 160 }}>
                  <SaveOutlined /> حفظ
                </Button>
              </div>
            </Card>
          </Col>
        )}

        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={cardStyle(
              'linear-gradient(135deg, #f5576c, #ff6b6b)', 'rgba(245,87,108,0.15)')}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="backup-icon" style={iconBoxStyle(
                  'linear-gradient(135deg, #f5576c, #ff6b6b)', 'rgba(245,87,108,0.4)')}>
                  <ReloadOutlined />
                </div>
                <h3>استرجاع نسخة احتياطية</h3>
                <p style={{ color: '#888', fontSize: 13 }}>استرجاع ملف .db سابق</p>
                <Tag color="red" style={{ marginBottom: 12 }}>تحذير: يستبدل الحالي</Tag><br />
                <Button danger size="large" loading={loading === 'restore'}
                  onClick={doRestore}
                  style={{ borderRadius: 10, minWidth: 160 }}>
                  <CloudUploadOutlined /> استرجاع
                </Button>
              </div>
            </Card>
          </Col>
        )}

        {isAdmin && (
          <Col xs={24} sm={12} lg={8}>
            <Card hoverable className="backup-card" style={cardStyle(
              'linear-gradient(135deg, #43e97b, #38f9d7)', 'rgba(67,233,123,0.15)')}>
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div className="backup-icon" style={iconBoxStyle(
                  'linear-gradient(135deg, #43e97b, #38f9d7)', 'rgba(67,233,123,0.4)')}>
                  <FileExcelOutlined />
                </div>
                <h3>تصدير كل الزبائن Excel</h3>
                <p style={{ color: '#888', fontSize: 13 }}>كل زبائن كل الموظفين مع اسم الموظف</p>
                <Tag color="gold" style={{ marginBottom: 12 }}>أدمن</Tag><br />
                <Button type="primary" size="large" loading={loading === 'excel-all'}
                  onClick={() => action('excel-all', window.api.backup.excelAll)}
                  style={{ borderRadius: 10, background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', color: '#333', minWidth: 160 }}>
                  <FileExcelOutlined /> تصدير
                </Button>
              </div>
            </Card>
          </Col>
        )}

        <Col xs={24} sm={12} lg={isAdmin ? 8 : 24}>
          <Card hoverable className="backup-card" style={cardStyle(
            'linear-gradient(135deg, #4facfe, #00f2fe)', 'rgba(79,172,254,0.15)')}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className="backup-icon" style={iconBoxStyle(
                'linear-gradient(135deg, #4facfe, #00f2fe)', 'rgba(79,172,254,0.4)')}>
                <FileExcelOutlined />
              </div>
              <h3>{isAdmin ? 'تصدير زبائني (أدمن)' : 'تصدير زبائني'}</h3>
              <p style={{ color: '#888', fontSize: 13 }}>
                Excel لزبائن <Tag color="blue">{user?.display_name}</Tag>
              </p>
              <br />
              <Button type="primary" size="large" loading={loading === 'user-export'}
                onClick={() => action('user-export', () => window.api.backup.excelUser(user?.id || 0, user?.display_name || ''))}
                style={{ borderRadius: 10, background: 'linear-gradient(135deg, #4facfe, #00f2fe)', border: 'none', color: '#333', minWidth: 160 }}>
                <FileExcelOutlined /> تصدير زبائني
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Auto Backup */}
      {isAdmin && (
        <Card className="backup-card" style={{
          borderRadius: 16, border: 'none',
          boxShadow: '0 6px 24px rgba(250,173,20,0.12)',
          transition: 'all 0.4s cubic-bezier(.4,0,.2,1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: autoActive ? 'linear-gradient(135deg, #52c41a, #73d13d)' : 'linear-gradient(135deg, #faad14, #ffc53d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: autoActive ? '0 4px 12px rgba(82,196,26,0.4)' : '0 4px 12px rgba(250,173,20,0.4)'
            }}>
              <ClockCircleOutlined style={{ fontSize: 22, color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ margin: 0 }}>النسخ الاحتياطي التلقائي</h3>
              {autoActive ? (
                <Tag color="success" style={{ marginTop: 4 }}>✓ مفعّل - كل {autoHours} ساعة</Tag>
              ) : (
                <Tag color="warning" style={{ marginTop: 4 }}>غير مفعّل</Tag>
              )}
            </div>
          </div>

          {autoActive && (
            <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 10, border: '1px solid #b7eb8f', marginBottom: 16 }}>
              <div style={{ fontSize: 13 }}>
                <FolderOpenOutlined style={{ marginLeft: 6 }} />
                المجلد: <strong style={{ wordBreak: 'break-all' }}>{autoDir}</strong>
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                <ClockCircleOutlined style={{ marginLeft: 6 }} />
                الفترة: كل <strong>{autoHours}</strong> ساعة
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {!autoActive ? (
              <>
                <span style={{ fontSize: 14 }}>كل</span>
                <InputNumber min={1} max={168} value={newHours} onChange={v => setNewHours(v || 24)}
                  style={{ width: 80, borderRadius: 8 }} />
                <span style={{ fontSize: 14 }}>ساعة</span>
                <Button type="primary" icon={<ClockCircleOutlined />} onClick={setupAuto}
                  style={{ borderRadius: 8, background: 'linear-gradient(135deg, #faad14, #ffc53d)', border: 'none', color: '#333' }}>
                  تفعيل وتحديد المجلد
                </Button>
              </>
            ) : (
              <Button danger icon={<StopOutlined />} onClick={stopAuto} style={{ borderRadius: 8 }}>
                إيقاف النسخ التلقائي
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Result */}
      {lastResult && (
        <Card style={{ marginTop: 20, borderRadius: 14, background: '#f6ffed', border: '2px solid #52c41a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
            <div>
              <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 16 }}>تم بنجاح!</div>
              <div style={{ color: '#666', fontSize: 13, wordBreak: 'break-all' }}>{lastResult}</div>
            </div>
          </div>
        </Card>
      )}

      <style>{`
        .backup-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 12px 36px rgba(0,0,0,0.12) !important;
        }
        .backup-card:hover .backup-icon {
          transform: scale(1.1) rotate(5deg);
        }
        .backup-card { transition: all 0.4s cubic-bezier(.4,0,.2,1) !important; }
        .backup-icon { transition: all 0.4s cubic-bezier(.4,0,.2,1) !important; }
      `}</style>
    </div>
  )
}
