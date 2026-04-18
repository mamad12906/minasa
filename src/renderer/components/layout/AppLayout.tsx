import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/':               { title: 'لوحة التحكم',    subtitle: 'نظرة عامة على الأداء' },
  '/customers':      { title: 'الزبائن',        subtitle: 'إدارة قاعدة الزبائن' },
  '/add-customer':   { title: 'إضافة زبون',     subtitle: 'إدخال بيانات زبون جديد' },
  '/edit-customer':  { title: 'تعديل زبون',     subtitle: 'تحديث بيانات الزبون' },
  '/customer':       { title: 'ملف الزبون',     subtitle: 'عرض وإدارة بيانات الزبون' },
  '/invoices':       { title: 'الفواتير',       subtitle: 'إصدار ومتابعة الفواتير' },
  '/reports':        { title: 'التقارير',       subtitle: 'تحليلات وإحصاءات' },
  '/whatsapp':       { title: 'واتساب',         subtitle: 'رسائل وقوالب' },
  '/import':         { title: 'استيراد Excel',  subtitle: 'استيراد بيانات الزبائن' },
  '/backup':         { title: 'نسخ احتياطي',    subtitle: 'حفظ واستعادة البيانات' },
  '/admin':          { title: 'لوحة الأدمن',    subtitle: 'إدارة المستخدمين والصلاحيات' },
  '/audit':          { title: 'سجل التغييرات',   subtitle: 'تتبّع العمليات' },
  '/database':       { title: 'قاعدة البيانات', subtitle: 'إدارة الاتصال والأعمدة' },
}

const COLLAPSE_KEY = 'sidebar-collapsed'

export default function AppLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1')

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  // Match by longest prefix (e.g. /edit-customer/5 falls back to /customers)
  const meta = PAGE_META[location.pathname]
    || Object.entries(PAGE_META).find(([k]) => k !== '/' && location.pathname.startsWith(k))?.[1]
    || { title: '' }

  const marginRight = collapsed ? 68 : 244

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div style={{
        marginRight,
        transition: 'margin-right 0.2s ease',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <Topbar title={meta.title} subtitle={meta.subtitle} />

        <main style={{
          padding: '20px 28px 40px',
          minHeight: 'calc(100vh - 68px)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
