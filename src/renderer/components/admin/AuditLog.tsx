import React, { useEffect, useState } from 'react'
import { Table, Tag, Row, Col } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const actionMeta: Record<string, { label: string; color: string }> = {
  login: { label: 'تسجيل دخول', color: 'cyan' },
  login_failed: { label: 'فشل دخول', color: 'red' },
  create: { label: 'إضافة', color: 'green' },
  update: { label: 'تعديل', color: 'blue' },
  delete: { label: 'حذف', color: 'red' },
  delete_all: { label: 'حذف جماعي', color: 'red' },
  delete_user_customers: { label: 'حذف زبائن مستخدم', color: 'red' },
  reset_password: { label: 'تعيين كلمة مرور', color: 'orange' },
}

const entityLabels: Record<string, string> = {
  customer: 'زبون',
  user: 'مستخدم',
  platform: 'منصة',
  category: 'صنف',
  ministry: 'وزارة',
  reminder: 'تذكير',
  auth: 'دخول',
}

export default function AuditLog() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await window.api.audit.list({
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setData(res?.data || [])
      setTotal(res?.total || 0)
    } catch (e) {
      console.error('[AuditLog] failed to load:', e)
      setData([])
      setTotal(0)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  return (
    <div className="hover-card">
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
            <HistoryOutlined style={{ marginLeft: 8 }} />سجل التغييرات (السيرفر)
          </h2>
        </Col>
      </Row>

      <Table
        dataSource={data}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{
          current: page, pageSize, total, showSizeChanger: false,
          showTotal: (t) => `${t} سجل`,
          onChange: (p) => setPage(p),
        }}
        columns={[
          {
            title: 'الوقت',
            dataIndex: 'created_at',
            width: 160,
            render: (v: string) =>
              dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD hh:mm A') : v,
          },
          {
            title: 'المستخدم',
            dataIndex: 'username',
            width: 120,
            render: (v: string) => v || '-',
          },
          {
            title: 'الإجراء',
            dataIndex: 'action',
            width: 140,
            render: (v: string) => {
              const meta = actionMeta[v] || { label: v, color: 'default' }
              return <Tag color={meta.color}>{meta.label}</Tag>
            },
          },
          {
            title: 'النوع',
            dataIndex: 'entity_type',
            width: 90,
            render: (v: string) => v ? <Tag>{entityLabels[v] || v}</Tag> : null,
          },
          {
            title: 'التفاصيل',
            dataIndex: 'details',
            ellipsis: true,
          },
          {
            title: 'IP',
            dataIndex: 'ip',
            width: 110,
            render: (v: string) =>
              v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> : '-',
          },
        ]}
      />
    </div>
  )
}
