import React, { useEffect, useState } from 'react'
import { Row, Col, Tag, Spin, Empty, Table, Button, Select, Modal, Descriptions, message } from 'antd'
import { BarChartOutlined, TeamOutlined, UserOutlined, PrinterOutlined, TrophyOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuth } from '../../App'

export default function ReportsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>()
  const [empCustomers, setEmpCustomers] = useState<any[]>([])
  const [empLoading, setEmpLoading] = useState(false)
  // Customer card
  const [cardCustomer, setCardCustomer] = useState<any>(null)

  useEffect(() => { loadStats(); loadUsers() }, [])

  const loadStats = async () => {
    setLoading(true)
    const data = await window.api.dashboard.stats(isAdmin ? undefined : user?.id)
    setStats(data)
    setLoading(false)
  }

  const loadUsers = async () => {
    if (isAdmin) setAllUsers(await window.api.users.list())
  }

  const loadEmployeeCustomers = async (userId: number) => {
    setSelectedEmployee(userId)
    setEmpLoading(true)
    const res = await window.api.customer.list({ page: 1, pageSize: 1000, userId })
    setEmpCustomers(res?.data || [])
    setEmpLoading(false)
  }

  const printCustomerCard = (customer: any) => {
    setCardCustomer(customer)
  }

  const doPrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800')
    if (!printWindow || !cardCustomer) return
    const endDate = cardCustomer.months_count && cardCustomer.created_at
      ? dayjs(cardCustomer.created_at).add(cardCustomer.months_count, 'month').format('YYYY-MM-DD') : '-'

    printWindow.document.write(`
      <html dir="rtl"><head><title>بطاقة زبون</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Arial; padding: 30px; color: #1A2332; }
        h1 { text-align: center; color: #1B6B93; border-bottom: 3px solid #1B6B93; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        td, th { padding: 10px 14px; border: 1px solid #E2E8F0; text-align: right; }
        th { background: #F0F4F7; font-weight: 600; width: 35%; }
        .footer { text-align: center; margin-top: 30px; color: #94A3B8; font-size: 12px; }
        @media print { body { padding: 10px; } }
      </style></head><body>
        <h1>بطاقة زبون - منصة</h1>
        <table>
          <tr><th>الاسم الرباعي</th><td>${cardCustomer.full_name}</td></tr>
          <tr><th>اسم الأم</th><td>${cardCustomer.mother_name || '-'}</td></tr>
          <tr><th>رقم الهاتف</th><td>${cardCustomer.phone_number || '-'}</td></tr>
          <tr><th>رقم البطاقة</th><td>${cardCustomer.card_number || '-'}</td></tr>
          <tr><th>المنصة</th><td>${cardCustomer.platform_name || '-'}</td></tr>
          <tr><th>الوزارة</th><td>${cardCustomer.ministry_name || '-'}</td></tr>
          <tr><th>الصنف</th><td>${cardCustomer.category || '-'}</td></tr>
          <tr><th>الحالة</th><td>${cardCustomer.status_note || '-'}</td></tr>
          <tr><th>عدد الأشهر</th><td>${cardCustomer.months_count || '-'}</td></tr>
          <tr><th>تاريخ الانتهاء</th><td>${endDate}</td></tr>
          <tr><th>تاريخ الإنشاء</th><td>${cardCustomer.created_at || '-'}</td></tr>
          <tr><th>ملاحظات</th><td>${cardCustomer.notes || '-'}</td></tr>
        </table>
        <div class="footer">طُبعت بتاريخ ${dayjs().format('YYYY-MM-DD hh:mm A')} | منصة إدارة الزبائن</div>
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  if (loading || !stats) return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>

  const topCategory = stats.categoryBreakdown[0]
  const topMinistry = stats.ministryBreakdown[0]

  return (
    <div>
      <div className="page-header">
        <h2><BarChartOutlined style={{ marginLeft: 8 }} />التقارير والإحصائيات</h2>
        <p>تحليل شامل للبيانات والأداء</p>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1B6B93', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><TeamOutlined /></div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>إجمالي الزبائن</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalCustomers}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><TrophyOutlined /></div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>أكثر صنف</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{topCategory?.category || '-'}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#2DA44E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><BarChartOutlined /></div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>أكثر وزارة</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{topMinistry?.ministry_name || '-'}</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D29922', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}><UserOutlined /></div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>الموظفين</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.employeeStats?.length || 0}</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Employee Performance - Admin */}
      {isAdmin && stats.employeeStats && stats.employeeStats.length > 0 && (
        <div className="hover-card" style={{ marginBottom: 24 }}>
          <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            <TeamOutlined style={{ marginLeft: 8, color: '#1B6B93' }} />أداء الموظفين
          </h3>
          <Table dataSource={stats.employeeStats} rowKey="id" size="small" pagination={false}
            columns={[
              { title: 'الموظف', dataIndex: 'display_name', render: (v: string) => <strong>{v}</strong> },
              { title: 'عدد الزبائن', dataIndex: 'customer_count', render: (v: number) => <Tag color="blue" style={{ fontWeight: 600 }}>{v}</Tag> },
              { title: 'النسبة', key: 'pct', render: (_: any, r: any) => {
                const pct = stats.totalCustomers > 0 ? Math.round((r.customer_count / stats.totalCustomers) * 100) : 0
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--bar-track)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: '#1B6B93', width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 35 }}>{pct}%</span>
                  </div>
                )
              }},
              { title: '', key: 'action', width: 80, render: (_: any, r: any) => (
                <Button size="small" onClick={() => loadEmployeeCustomers(r.id)}>تفاصيل</Button>
              )}
            ]}
          />
        </div>
      )}

      {/* Selected Employee Customers */}
      {selectedEmployee && (
        <div className="hover-card" style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
            <Col><h3 style={{ margin: 0, color: 'var(--text-primary)' }}>زبائن {allUsers.find(u => u.id === selectedEmployee)?.display_name}</h3></Col>
            <Col><Button size="small" onClick={() => { setSelectedEmployee(undefined); setEmpCustomers([]) }}>إغلاق</Button></Col>
          </Row>
          <Table dataSource={empCustomers} rowKey="id" loading={empLoading} size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: 'الاسم', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
              { title: 'الهاتف', dataIndex: 'phone_number' },
              { title: 'الوزارة', dataIndex: 'ministry_name' },
              { title: 'الصنف', dataIndex: 'category', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
              { title: 'الأشهر', dataIndex: 'months_count', render: (v: number) => v ? <Tag color="orange">{v}</Tag> : '-' },
              { title: '', key: 'print', width: 50, render: (_: any, r: any) => (
                <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => printCustomerCard(r)} />
              )}
            ]}
          />
        </div>
      )}

      {/* Recent Customers with Print */}
      <div className="hover-card">
        <h3 style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12, marginBottom: 16, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
          آخر الزبائن المضافين
        </h3>
        <Table dataSource={stats.recentCustomers} rowKey="id" size="small" pagination={false}
          columns={[
            { title: 'الاسم', dataIndex: 'full_name', render: (v: string) => <strong>{v}</strong> },
            { title: 'الهاتف', dataIndex: 'phone_number' },
            { title: 'الوزارة', dataIndex: 'ministry_name' },
            { title: 'الصنف', dataIndex: 'category', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
            { title: 'التاريخ', dataIndex: 'created_at', width: 140 },
            { title: '', key: 'print', width: 50, render: (_: any, r: any) => (
              <Button type="link" size="small" icon={<PrinterOutlined />} onClick={() => printCustomerCard(r)} title="طباعة بطاقة" />
            )}
          ]}
        />
      </div>

      {/* Print Customer Card Modal */}
      <Modal title="بطاقة الزبون" open={!!cardCustomer} onCancel={() => setCardCustomer(null)}
        footer={[
          <Button key="close" onClick={() => setCardCustomer(null)}>إغلاق</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={doPrint}>طباعة</Button>
        ]} width={500}>
        {cardCustomer && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="الاسم">{cardCustomer.full_name}</Descriptions.Item>
            <Descriptions.Item label="اسم الأم">{cardCustomer.mother_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الهاتف">{cardCustomer.phone_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="البطاقة">{cardCustomer.card_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="المنصة">{cardCustomer.platform_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الوزارة">{cardCustomer.ministry_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="الصنف">{cardCustomer.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="الأشهر">{cardCustomer.months_count || '-'}</Descriptions.Item>
            <Descriptions.Item label="التاريخ">{cardCustomer.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
