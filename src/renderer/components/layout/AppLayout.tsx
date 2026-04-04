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
          margin: 32,
          padding: 0,
          minHeight: 280,
          background: 'transparent',
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
