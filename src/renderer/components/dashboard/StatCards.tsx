import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Tag, Spin, Empty } from 'antd'
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
      {/* Header */}
      <div className="dash-header" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        transition: 'transform 0.3s, box-shadow 0.3s'
      }}>
        <h2 style={{ margin: 0, fontSize: 26, color: '#fff' }}>مرحباً {user?.display_name}</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: 14 }}>لوحة التحكم - منصة إدارة الزبائن</p>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { label: 'إجمالي الزبائن', value: stats.totalCustomers, icon: <TeamOutlined />,
            bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', shadow: 'rgba(79,172,254,0.4)' },
          { label: 'الأصناف', value: stats.categoryBreakdown.length, icon: <TagsOutlined />,
            bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', shadow: 'rgba(161,140,209,0.4)' },
          { label: 'الوزارات', value: stats.ministryBreakdown.length, icon: <BankOutlined />,
            bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', shadow: 'rgba(67,233,123,0.4)' },
        ].map((item, idx) => (
          <Col xs={24} sm={8} key={idx}>
            <div className="stat-card" style={{
              background: '#fff', borderRadius: 14, padding: '20px 24px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
              cursor: 'pointer', transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
              display: 'flex', alignItems: 'center', gap: 16
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: item.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 15px ${item.shadow}`, fontSize: 24, color: '#fff',
                transition: 'transform 0.35s'
              }} className="stat-icon">
                {item.icon}
              </div>
              <div>
                <div style={{ color: '#999', fontSize: 13 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#333', lineHeight: 1.2 }}>
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Distribution */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <div className="hover-card" style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            transition: 'all 0.35s cubic-bezier(.4,0,.2,1)', height: '100%'
          }}>
            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
              <TagsOutlined style={{ marginLeft: 8, color: '#a18cd1' }} />توزيع الأصناف
            </h3>
            {stats.categoryBreakdown.length === 0 ? (
              <Empty description="لا توجد أصناف" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : stats.categoryBreakdown.map((item: any, i: number) => {
              const colors = ['#7c3aed', '#a855f7', '#c084fc', '#d8b4fe', '#ede9fe']
              const pct = stats.totalCustomers > 0 ? Math.round((item.count / stats.totalCustomers) * 100) : 0
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{item.category}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.count} <span style={{ color: '#bbb', fontSize: 12 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 5,
                      background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
                      width: `${pct}%`, transition: 'width 1.2s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Col>
        <Col xs={24} lg={12}>
          <div className="hover-card" style={{
            background: '#fff', borderRadius: 14, padding: '20px 24px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
            transition: 'all 0.35s cubic-bezier(.4,0,.2,1)', height: '100%'
          }}>
            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
              <BankOutlined style={{ marginLeft: 8, color: '#43e97b' }} />توزيع الوزارات (الأكثر أولاً)
            </h3>
            {stats.ministryBreakdown.length === 0 ? (
              <Empty description="لا توجد وزارات" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : stats.ministryBreakdown.map((item: any, i: number) => {
              const maxCount = stats.ministryBreakdown[0]?.count || 1
              const pct = Math.round((item.count / maxCount) * 100)
              const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}><span style={{ color: '#bbb', marginLeft: 6 }}>{i + 1}.</span>{item.ministry_name}</span>
                    <Tag color="green" style={{ borderRadius: 6, fontSize: 13 }}>{item.count}</Tag>
                  </div>
                  <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      height: '100%', borderRadius: 5,
                      background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
                      width: `${pct}%`, transition: 'width 1.2s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Col>
      </Row>

      {/* Employee Stats - Admin only */}
      {isAdmin && stats.employeeStats && stats.employeeStats.length > 0 && (
        <div className="hover-card" style={{
          background: '#fff', borderRadius: 14, padding: '20px 24px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          transition: 'all 0.35s cubic-bezier(.4,0,.2,1)', marginBottom: 24
        }}>
          <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
            <TeamOutlined style={{ marginLeft: 8, color: '#667eea' }} />زبائن كل موظف
          </h3>
          <Row gutter={[12, 12]}>
            {stats.employeeStats.map((emp: any) => {
              const maxCount = stats.employeeStats[0]?.customer_count || 1
              const pct = Math.round((emp.customer_count / maxCount) * 100)
              return (
                <Col xs={24} sm={12} lg={8} key={emp.id}>
                  <div style={{
                    padding: '14px 16px', borderRadius: 12, background: '#f8f9ff',
                    border: '1px solid #e8ecff', transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{emp.display_name}</span>
                      <Tag color="blue" style={{ fontSize: 15, padding: '1px 12px', fontWeight: 'bold' }}>{emp.customer_count}</Tag>
                    </div>
                    <div style={{ height: 8, background: '#e8ecff', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                        width: `${pct}%`, transition: 'width 1.2s ease', minWidth: pct > 0 ? 8 : 0
                      }} />
                    </div>
                  </div>
                </Col>
              )
            })}
          </Row>
        </div>
      )}

      {/* Recent Customers */}
      <div className="hover-card" style={{
        background: '#fff', borderRadius: 14, padding: '20px 24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
        transition: 'all 0.35s cubic-bezier(.4,0,.2,1)'
      }}>
        <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 12 }}>
          <UserOutlined style={{ marginLeft: 8, color: '#4facfe' }} />آخر الزبائن المضافين
        </h3>
        <Table dataSource={stats.recentCustomers} rowKey="id" pagination={false} size="small"
          scroll={{ x: 800 }}
          columns={[
            { title: 'الاسم', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
            { title: 'المنصة', dataIndex: 'platform_name', render: (v: string) => v ? <Tag color="blue" style={{ borderRadius: 6 }}>{v}</Tag> : '-' },
            { title: 'الهاتف', dataIndex: 'phone_number' },
            { title: 'البطاقة', dataIndex: 'card_number' },
            { title: 'الوزارة', dataIndex: 'ministry_name' },
            { title: 'الحالة', dataIndex: 'status_note', render: (v: string) => v ? <Tag color="orange" style={{ borderRadius: 6 }}>{v}</Tag> : '-' },
            { title: 'الصنف', dataIndex: 'category', render: (v: string) => v ? <Tag color="purple" style={{ borderRadius: 6 }}>{v}</Tag> : '-' },
            { title: 'التاريخ', dataIndex: 'created_at', width: 160 }
          ]}
        />
      </div>

      {/* Hover animations CSS */}
      <style>{`
        .stat-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 12px 35px rgba(0,0,0,0.12) !important;
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.15) rotate(5deg);
        }
        .hover-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1) !important;
          border: 1px solid rgba(102,126,234,0.2);
        }
        .dash-header:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.45) !important;
        }
        .bar-fill {
          animation: barGrow 1.2s ease-out;
        }
        @keyframes barGrow {
          from { width: 0 !important; }
        }
      `}</style>
    </div>
  )
}
