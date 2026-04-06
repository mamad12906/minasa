import React, { useState, createContext, useContext, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import arEG from 'antd/locale/ar_EG'
import { lightTheme, darkTheme } from './theme/antd-theme'
import { api, clearToken } from './api/http'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './components/dashboard/StatCards'
import CustomerTable from './components/customers/CustomerTable'
import ExcelImport from './components/import-export/ExcelImport'
import AdminPanel from './components/admin/AdminPanel'
import BackupPage from './components/backup/BackupPage'
import AddCustomer from './components/customers/AddCustomer'
import EditCustomer from './components/customers/EditCustomer'
import LoginPage from './components/admin/LoginPage'
import AuditLog from './components/admin/AuditLog'
import DatabaseManager from './components/admin/DatabaseManager'
import InvoicePage from './components/invoices/InvoicePage'
import ReportsPage from './components/reports/ReportsPage'

// Expose api globally for all components
;(window as any).api = api

export interface UserData {
  id: number
  username: string
  display_name: string
  role: string
  permissions: Record<string, boolean>
  platform_name: string
}

interface AuthCtx {
  user: UserData | null
  login: (user: UserData) => void
  logout: () => void
  can: (section: string) => boolean
}

interface ThemeCtx {
  isDark: boolean
  toggle: () => void
}

export const AuthContext = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {}, can: () => true
})

export const ThemeContext = createContext<ThemeCtx>({
  isDark: false, toggle: () => {}
})

export const useAuth = () => useContext(AuthContext)
export const useTheme = () => useContext(ThemeContext)

export default function App() {
  const [user, setUser] = useState<UserData | null>(null)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const login = (u: UserData) => {
    setUser(u)
  }

  const logout = () => { clearToken(); setUser(null) }
  const can = (section: string) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions[section] !== false
  }
  const toggleTheme = () => setIsDark(prev => !prev)

  return (
    <ConfigProvider direction="rtl" locale={arEG} theme={isDark ? darkTheme : lightTheme}>
      <AntApp>
        <ThemeContext.Provider value={{ isDark, toggle: toggleTheme }}>
          <AuthContext.Provider value={{ user, login, logout, can }}>
            <HashRouter>
              {!user ? (
                <LoginPage />
              ) : (
                <>
                  <Routes>
                    <Route path="/" element={<AppLayout />}>
                      <Route index element={<Dashboard />} />
                      {can('customers') && <Route path="customers" element={<CustomerTable />} />}
                      {can('customers') && <Route path="add-customer" element={<AddCustomer />} />}
                      {can('customers') && <Route path="edit-customer/:id" element={<EditCustomer />} />}
                      {can('customers') && <Route path="invoices" element={<InvoicePage />} />}
                    <Route path="reports" element={<ReportsPage />} />
                    {can('import') && <Route path="import" element={<ExcelImport />} />}
                      <Route path="backup" element={<BackupPage />} />
                      {user.role === 'admin' && <Route path="admin" element={<AdminPanel />} />}
                      {user.role === 'admin' && <Route path="audit" element={<AuditLog />} />}
                    {user.role === 'admin' && <Route path="database" element={<DatabaseManager />} />}
                      <Route path="*" element={<Navigate to="/" />} />
                    </Route>
                  </Routes>

                </>
              )}
            </HashRouter>
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </AntApp>
    </ConfigProvider>
  )
}
