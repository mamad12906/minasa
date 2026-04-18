import React from 'react'
import { Modal, Input, message } from 'antd'
import { SettingOutlined } from '@ant-design/icons'

export interface WAConfig {
  phoneId: string
  token: string
}

/** Read WhatsApp credentials from localStorage (persistent config mirrors this). */
export function getWAConfig(): WAConfig {
  try {
    const config = JSON.parse(localStorage.getItem('minasa_wa_config') || '{}')
    return { phoneId: config.phone_id || '', token: config.token || '' }
  } catch { return { phoneId: '', token: '' } }
}

/** Persist WhatsApp credentials to both localStorage and the electron persistent config. */
export function setWAConfig(phoneId: string, token: string) {
  localStorage.setItem('minasa_wa_config', JSON.stringify({ phone_id: phoneId, token }))
  ;(window as any).__config?.set('wa_phone_id', phoneId)
  ;(window as any).__config?.set('wa_token', token)
}

/** One-time hydration of localStorage from the persistent config. */
export function hydrateWAConfigFromPersistent() {
  setTimeout(async () => {
    try {
      const config = await (window as any).__config?.get()
      if (config?.wa_phone_id && config?.wa_token) {
        localStorage.setItem('minasa_wa_config', JSON.stringify({ phone_id: config.wa_phone_id, token: config.wa_token }))
      }
    } catch (err) { console.error('[WASettings] Failed to load WA config:', err) }
  }, 200)
}

interface Props {
  open: boolean
  phoneId: string
  token: string
  onPhoneIdChange: (v: string) => void
  onTokenChange: (v: string) => void
  onCancel: () => void
  onSaved: () => void
}

export default function WASettings({ open, phoneId, token, onPhoneIdChange, onTokenChange, onCancel, onSaved }: Props) {
  return (
    <Modal title={<span><SettingOutlined /> إعدادات WhatsApp API</span>}
      open={open} onCancel={onCancel} width={480}
      onOk={() => { setWAConfig(phoneId, token); onSaved(); message.success('تم حفظ إعدادات واتساب') }}
      okText="حفظ" cancelText="إلغاء">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phone Number ID:</div>
        <Input value={phoneId} onChange={e => onPhoneIdChange(e.target.value)} placeholder="مثال: 1123306807522253" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Access Token:</div>
        <Input.TextArea value={token} onChange={e => onTokenChange(e.target.value)} placeholder="EAAm..." rows={3} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        احصل على هذه المعلومات من developers.facebook.com → تطبيقك → واتساب → إعداد API
      </div>
    </Modal>
  )
}
