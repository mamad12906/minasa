import React, { useEffect, useState } from 'react'
import { Table, Tag, Select, Row, Col } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const actionColors: Record<string, string> = {
  'إضافة': 'green', 'تعديل': 'blue', 'حذف': 'red',
  'تسجيل دخول': 'cyan', 'نقل': 'orange', 'تذكير': 'purple'
}

const entityLabels: Record<string, string> = {
  customer: 'زبون', user: 'مستخدم', platform: 'منصة',
  category: 'صنف', reminder: 'تذكير', login: 'دخول'
}

export default function AuditLog() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(30)
  const [entityFilter, setEntityFilter] = useState<string | undefined>()

  const audit = (window as any).__auditApi

  const load = async () => {
    if (!audit) return
    const res = await audit.list({ page, pageSize, entityType: entityFilter })
    if (res) { setData(res.data || []); setTotal(res.total || 0) }
  }

  useEffect(() => { load() }, [page, entityFilter])

  return (
    <div className="hover-card">
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>
            <HistoryOutlined style={{ marginLeft: 8 }} />سجل التغييرات
          </h2>
        </Col>
        <Col>
          <Select placeholder="الكل" allowClear value={entityFilter}
            onChange={v => { setEntityFilter(v); setPage(1) }}
            style={{ width: 150 }}
            options={Object.entries(entityLabels).map(([k, v]) => ({ value: k, label: v }))} />
        </Col>
      </Row>

      <Table dataSource={data} rowKey="id" size="small"
        pagination={{
          current: page, pageSize, total, showSizeChanger: false,
          showTotal: (t) => `${t} سجل`,
          onChange: (p) => setPage(p)
        }}
        columns={[
          { title: 'الوقت', dataIndex: 'created_at', width: 160,
            render: (v: string) => dayjs(v).isValid() ? dayjs(v).format('YYYY-MM-DD hh:mm A') : v },
          { title: 'المستخدم', dataIndex: 'user_name', width: 120,
            render: (v: string) => v || '-' },
          { title: 'الإجراء', dataIndex: 'action', width: 100,
            render: (v: string) => <Tag color={actionColors[v] || 'default'}>{v}</Tag> },
          { title: 'النوع', dataIndex: 'entity_type', width: 80,
            render: (v: string) => <Tag>{entityLabels[v] || v}</Tag> },
          { title: 'التفاصيل', dataIndex: 'details', ellipsis: true },
        ]}
      />
    </div>
  )
}
