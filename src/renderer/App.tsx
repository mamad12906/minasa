import React, { useState, createContext, useContext, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import arEG from 'antd/locale/ar_EG'
import { theme } from './theme/antd-theme'
import { api, clearToken, getToken } from './api/http'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './components/dashboard/StatCards'
import CustomerTable from './components/customers/CustomerTable'
import ExcelImport from './components/import-export/ExcelImport'
import AdminPanel from './components/admin/AdminPanel'
import BackupPage from './components/backup/BackupPage'
import AddCustomer from './components/customers/AddCustomer'
import EditCustomer from './components/customers/EditCustomer'
import LoginPage from './components/admin/LoginPage'

// Make api globally available as window.api
;(window as any).api = api

interface UserData {
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

export const AuthContext = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {}, can: () => true
})

export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState<UserData | null>(null)

  const login = (u: UserData) => setUser(u)
  const logout = () => { clearToken(); setUser(null) }
  const can = (section: string) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions[section] !== false
  }

  return (
    <ConfigProvider direction="rtl" locale={arEG} theme={theme}>
      <AntApp>
        <AuthContext.Provider value={{ user, login, logout, can }}>
          <HashRouter>
            {!user ? (
              <LoginPage />
            ) : (
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Dashboard />} />
                  {can('customers') && <Route path="customers" element={<CustomerTable />} />}
                  {can('customers') && <Route path="add-customer" element={<AddCustomer />} />}
                  {can('customers') && <Route path="edit-customer/:id" element={<EditCustomer />} />}
                  {can('import') && <Route path="import" element={<ExcelImport />} />}
                  <Route path="backup" element={<BackupPage />} />
                  {user.role === 'admin' && <Route path="admin" element={<AdminPanel />} />}
                  <Route path="*" element={<Navigate to="/" />} />
                </Route>
              </Routes>
            )}
          </HashRouter>
        </AuthContext.Provider>
      </AntApp>
    </ConfigProvider>
  )
}
