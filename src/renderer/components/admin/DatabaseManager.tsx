import React, { useEffect, useState } from 'react'
import { Button, Modal, Select, Tag, Input, message, Row, Col, Spin } from 'antd'
import {
  DeleteOutlined, ExclamationCircleOutlined, WarningOutlined,
  DatabaseOutlined, UserOutlined, ThunderboltOutlined
} from '@ant-design/icons'

export default function DatabaseManager() {
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  // Delete all
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  // Delete by employee
  const [deleteByUser, setDeleteByUser] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>()
  const [confirmUserText, setConfirmUserText] = useState('')

  const ipc = (ch: string, ...args: any[]) => (window as any).__ipc2?.invoke?.(ch, ...args) ||
    ((window as any).__ipc2 as any)?.[ch]?.(...args) || Promise.resolve(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [u, s] = await Promise.all([
        window.api.users.list(),
        window.api.dashboard.stats()
      ])
      setUsers(u || [])
      setStats(s)
    } catch (err) { console.error('[DatabaseManager] Failed to load data:', err) } finally { setLoading(false) }
  }

  const getServerInfo = () => ({
    url: localStorage.getItem('minasa_server_url') || '',
    token: localStorage.getItem('minasa_token') || '',
    apiKey: localStorage.getItem('minasa_api_key') || ''
  })

  const deleteAllCustomers = async () => {
    if (confirmText !== 'حذف الكل') { message.error('اكتب "حذف الكل" للتأكيد'); return }
    setDeleting(true)
    try {
      const ipc2 = (window as any).__ipc2
      const s = getServerInfo()
      message.info('جاري الحذف من المحلي والسيرفر... لا تغلق التطبيق')
      const res = await ipc2?.dbDeleteAllCustomers(s.url, s.token, s.apiKey)
      if (res?.success) {
        const parts = [`محلي: ${res.deleted}`]
        if (res.serverDeleted > 0) parts.push(`سيرفر: ${res.serverDeleted}`)
        message.success(`تم الحذف | ${parts.join(' | ')}`)
        setConfirmDeleteAll(false); setConfirmText(''); load()
      } else { message.error('فشل الحذف: ' + (res?.error || '')) }
    } catch (e: any) { message.error(e.message) }
    setDeleting(false)
  }

  const deleteUserCustomers = async () => {
    if (!selectedUserId) { message.error('اختر موظف'); return }
    const userName = users.find(u => u.id === selectedUserId)?.display_name || ''
    if (confirmUserText !== userName) { message.error(`اكتب "${userName}" للتأكيد`); return }
    setDeleting(true)
    try {
      const ipc2 = (window as any).__ipc2
      const s = getServerInfo()
      message.info('جاري الحذف...')
      const res = await ipc2?.dbDeleteUserCustomers(selectedUserId, s.url, s.token, s.apiKey)
      if (res?.success) {
        const parts = [`محلي: ${res.deleted}`]
        if (res.serverDeleted > 0) parts.push(`سيرفر: ${res.serverDeleted}`)
        message.success(`تم حذف زبائن ${userName} | ${parts.join(' | ')}`)
        setDeleteByUser(false); setSelectedUserId(undefined); setConfirmUserText(''); load()
      } else { message.error('فشل الحذف') }
    } catch (e: any) { message.error(e.message) }
    setDeleting(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>

  return (
    <div>
      <div className="page-header">
        <h2><DatabaseOutlined style={{ marginLeft: 8 }} />إدارة قاعدة البيانات</h2>
        <p>حذف البيانات وإعادة تهيئة القاعدة - للأدمن فقط</p>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1B6B93', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
              <DatabaseOutlined />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>إجمالي الزبائن</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stats?.totalCustomers || 0}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={8}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2DA44E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
              <UserOutlined />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>الموظفين</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{users.length}</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Danger Zone */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, padding: 28,
        border: '2px solid var(--error)', boxShadow: 'var(--shadow-card)'
      }}>
        <h3 style={{ color: 'var(--error)', marginBottom: 20, fontSize: 18, fontWeight: 700 }}>
          <WarningOutlined style={{ marginLeft: 8 }} />منطقة الخطر
        </h3>

        {/* Delete all customers */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 16,
          background: 'var(--error-bg)', border: '1px solid var(--error-border)'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>حذف جميع الزبائن</h4>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                حذف كل الزبائن والتذكيرات من القاعدة المحلية والسيرفر. لا يمكن التراجع!
              </p>
            </Col>
            <Col>
              <Button danger type="primary" icon={<DeleteOutlined />}
                onClick={() => setConfirmDeleteAll(true)}
                style={{ borderRadius: 8 }}>
                حذف الكل
              </Button>
            </Col>
          </Row>
        </div>

        {/* Delete by employee */}
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 16,
          background: 'var(--warning-bg)', border: '1px solid var(--warning-border)'
        }}>
          <Row justify="space-between" align="middle">
            <Col>
              <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>حذف زبائن موظف معين</h4>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                حذف جميع زبائن موظف محدد فقط. لا يمكن التراجع!
              </p>
            </Col>
            <Col>
              <Button danger icon={<UserOutlined />}
                onClick={() => setDeleteByUser(true)}
                style={{ borderRadius: 8 }}>
                حذف زبائن موظف
              </Button>
            </Col>
          </Row>
        </div>

        {/* Employee breakdown */}
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--text-primary)', fontWeight: 600 }}>زبائن كل موظف</h4>
          {users.filter(u => u.customer_count > 0).map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{u.display_name}</span>
              <Tag color="blue" style={{ fontWeight: 600 }}>{u.customer_count || 0} زبون</Tag>
            </div>
          ))}
          {users.filter(u => u.customer_count > 0).length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Confirm Delete All Modal */}
      <Modal
        title={<span style={{ color: 'var(--error)' }}><ExclamationCircleOutlined /> تأكيد حذف جميع الزبائن</span>}
        open={confirmDeleteAll}
        onCancel={() => { setConfirmDeleteAll(false); setConfirmText('') }}
        footer={null}
        width={480}
      >
        <div style={{
          padding: 16, borderRadius: 10, marginBottom: 16,
          background: 'var(--error-bg)', border: '1px solid var(--error-border)', textAlign: 'center'
        }}>
          <WarningOutlined style={{ fontSize: 40, color: 'var(--error)', marginBottom: 10 }} />
          <h3 style={{ color: 'var(--error)', margin: '0 0 8px' }}>تحذير!</h3>
          <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: 14 }}>
            سيتم حذف <strong>{stats?.totalCustomers || 0} زبون</strong> وجميع التذكيرات نهائياً.
            <br />هذا الإجراء <strong>لا يمكن التراجع عنه</strong>.
          </p>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
          اكتب <Tag color="error">حذف الكل</Tag> للتأكيد:
        </p>
        <Input value={confirmText} onChange={e => setConfirmText(e.target.value)}
          placeholder="حذف الكل" style={{ marginBottom: 16, borderRadius: 8 }}
          status={confirmText && confirmText !== 'حذف الكل' ? 'error' : undefined} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={() => { setConfirmDeleteAll(false); setConfirmText('') }}>إلغاء</Button>
          <Button danger type="primary" loading={deleting}
            disabled={confirmText !== 'حذف الكل'}
            onClick={deleteAllCustomers}
            icon={<ThunderboltOutlined />}>
            حذف نهائي
          </Button>
        </div>
      </Modal>

      {/* Confirm Delete User's Customers Modal */}
      <Modal
        title={<span style={{ color: '#D29922' }}><ExclamationCircleOutlined /> حذف زبائن موظف</span>}
        open={deleteByUser}
        onCancel={() => { setDeleteByUser(false); setSelectedUserId(undefined); setConfirmUserText('') }}
        footer={null}
        width={480}
      >
        <p style={{ marginBottom: 12 }}>اختر الموظف:</p>
        <Select value={selectedUserId} onChange={v => { setSelectedUserId(v); setConfirmUserText('') }}
          placeholder="اختر الموظف" style={{ width: '100%', marginBottom: 16 }}
          options={users.filter(u => (u.customer_count || 0) > 0).map(u => ({
            value: u.id,
            label: `${u.display_name} (${u.customer_count || 0} زبون)`
          }))} />

        {selectedUserId && (
          <>
            <div style={{
              padding: 12, borderRadius: 8, marginBottom: 12,
              background: 'var(--warning-bg)', border: '1px solid var(--warning-border)'
            }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: 13 }}>
                سيتم حذف <strong>{users.find(u => u.id === selectedUserId)?.customer_count || 0} زبون</strong> للموظف
                <strong> {users.find(u => u.id === selectedUserId)?.display_name}</strong> نهائياً.
              </p>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>
              اكتب اسم الموظف <Tag color="warning">{users.find(u => u.id === selectedUserId)?.display_name}</Tag> للتأكيد:
            </p>
            <Input value={confirmUserText} onChange={e => setConfirmUserText(e.target.value)}
              placeholder={users.find(u => u.id === selectedUserId)?.display_name || ''}
              style={{ marginBottom: 16, borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => { setDeleteByUser(false); setSelectedUserId(undefined); setConfirmUserText('') }}>إلغاء</Button>
              <Button danger loading={deleting}
                disabled={confirmUserText !== users.find(u => u.id === selectedUserId)?.display_name}
                onClick={deleteUserCustomers}
                icon={<DeleteOutlined />}>
                حذف زبائن الموظف
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
