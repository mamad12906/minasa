import React, { useEffect, useState } from 'react'
import { Row, Col, Table, Tag, Spin, Empty } from 'antd'
import { UserOutlined, TeamOutlined, BankOutlined, TagsOutlined } from '@ant-design/icons'
import { useAuth } from '../../App'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  const isAdmin = user?.role === 'admin'
  const userId = (!isAdmin && user?.id) ? user.id : undefined

  const loadAll = async () => {
    setLoading(true)
    const data = await window.api.dashboard.stats(userId)
    setStats(data)
    setLoading(false)
  }

  if (loading || !stats) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div>
      {/* Header - flat, clean */}
      <div className="page-header">
        <h2>مرحباً {user?.display_name}</h2>
        <p>لوحة التحكم - منصة إدارة الزبائن</p>
      </div>

      {/* Stats */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        {[
          { label: 'إجمالي الزبائن', value: stats.totalCustomers, icon: <TeamOutlined />, color: '#1B6B93' },
          { label: 'الأصناف', value: stats.categoryBreakdown.length, icon: <TagsOutlined />, color: '#8B5CF6' },
          { label: 'الوزارات', value: stats.ministryBreakdown.length, icon: <BankOutlined />, color: '#2DA44E' },
        ].map((item, idx) => (
          <Col xs={24} sm={8} key={idx}>
            <div className="stat-card">
              <div className="stat-icon" style={{
                width: 48, height: 48, borderRadius: 12, background: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: '#fff', transition: 'transform 0.25s'
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Distribution */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} lg={12}>
          <div className="hover-card" style={{ height: '100%' }}>
            <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              <TagsOutlined style={{ marginLeft: 8, color: '#8B5CF6' }} />توزيع الأصناف
            </h3>
            {stats.categoryBreakdown.length === 0 ? (
              <Empty description="لا توجد أصناف" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : stats.categoryBreakdown.map((item: any, i: number) => {
              const colors = ['#1B6B93', '#2D99C8', '#4BADD4', '#7CC5E0', '#B0DBEC']
              const pct = stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{item.category}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                      {item.count} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bar-track)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 3,
                      background: colors[i % colors.length],
                      width: `${pct}%`
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="hover-card" style={{ height: '100%' }}>
            <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
              <BankOutlined style={{ marginLeft: 8, color: '#2DA44E' }} />توزيع الوزارات
            </h3>
            {stats.ministryBreakdown.length === 0 ? (
              <Empty description="لا توجد وزارات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : stats.ministryBreakdown.map((item: any, i: number) => {
              const maxCount = stats.ministryBreakdown[0]?.count || 1
              const pct = Math.round((item.count / maxCount) * 100)
              const colors = ['#2DA44E', '#4BB563', '#6DC882', '#9DDBA8']
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{i + 1}.</span>{item.ministry_name}
                    </span>
                    <Tag color="green" style={{ borderRadius: 6, fontSize: 12 }}>{item.count}</Tag>
                  </div>
                  <div style={{ height: 6, background: 'var(--bar-track)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 3,
                      background: colors[i % colors.length],
                      width: `${pct}%`
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Col>
      </Row>

      {/* Employee Stats */}
      {isAdmin && stats.employeeStats && stats.employeeStats.length > 0 && (
        <div className="hover-card" style={{ marginBottom: 28 }}>
          <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            <TeamOutlined style={{ marginLeft: 8, color: '#1B6B93' }} />زبائن كل موظف
          </h3>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {stats.employeeStats.map((emp: any) => {
              const maxCount = stats.employeeStats[0]?.customer_count || 1
              const pct = Math.round((emp.customer_count / maxCount) * 100)
              return (
                <div key={emp.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{emp.display_name}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                      {emp.customer_count} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>زبون</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bar-track)', borderRadius: 3, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 3,
                      background: '#1B6B93',
                      width: `${pct}%`, minWidth: pct > 0 ? 6 : 0
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Customers */}
      <div className="hover-card">
        <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
          <UserOutlined style={{ marginLeft: 8, color: '#1B6B93' }} />آخر الزبائن المضافين
        </h3>
        <Table dataSource={stats.recentCustomers} rowKey="id" pagination={false} size="small"
          scroll={{ x: 800 }}
          columns={[
            { title: 'الاسم', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
            { title: 'المنصة', dataIndex: 'platform_name', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-' },
            { title: 'الهاتف', dataIndex: 'phone_number' },
            { title: 'البطاقة', dataIndex: 'card_number' },
            { title: 'الوزارة', dataIndex: 'ministry_name' },
            { title: 'الحالة', dataIndex: 'status_note', render: (v: string) => v ? <Tag color="orange">{v}</Tag> : '-' },
            { title: 'الصنف', dataIndex: 'category', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
            { title: 'التاريخ', dataIndex: 'created_at', width: 160 }
          ]}
        />
      </div>
    </div>
  )
}
