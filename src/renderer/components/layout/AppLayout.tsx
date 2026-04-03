import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './Sidebar'

const { Content } = Layout

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginRight: 220, transition: 'all 0.2s' }}>
        <Content style={{
          margin: 24,
          padding: 24,
          minHeight: 280,
          background: '#f0f2f5',
          overflow: 'auto',
          height: 'calc(100vh - 48px)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
