import React from 'react'
import { Input, Button } from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, LockOutlined, GlobalOutlined,
} from '@ant-design/icons'

type ServerStatus = 'unknown' | 'connected' | 'disconnected'

interface Props {
  serverUrl: string
  onServerUrlChange: (v: string) => void
  apiKey: string
  onApiKeyChange: (v: string) => void
  status: ServerStatus
  checking: boolean
  onCheck: () => void
  onSave: () => void
  onCancel: () => void
}

export default function ServerSettingsPanel({
  serverUrl, onServerUrlChange, apiKey, onApiKeyChange,
  status, checking, onCheck, onSave, onCancel,
}: Props) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      background: 'var(--bg-elevated)',
      border: '1px dashed var(--border-strong)',
      animation: 'fadeSlideDown 0.25s ease',
    }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        إعدادات الخادم
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <Input
          prefix={<GlobalOutlined style={{ color: 'var(--text-muted)' }} />}
          value={serverUrl}
          onChange={e => onServerUrlChange(e.target.value)}
          placeholder="https://example.com"
          style={{ borderRadius: 8, flex: 1, height: 36 }}
        />
        <Button
          onClick={onCheck}
          loading={checking}
          style={{ borderRadius: 8, height: 36 }}
          size="small"
        >
          فحص
        </Button>
      </div>
      {status === 'connected' && (
        <div style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8 }}>
          <CheckCircleOutlined /> متاح
        </div>
      )}
      {status === 'disconnected' && serverUrl && (
        <div style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 8 }}>
          <CloseCircleOutlined /> غير متاح
        </div>
      )}
      <Input.Password
        prefix={<LockOutlined style={{ color: 'var(--text-muted)' }} />}
        value={apiKey}
        onChange={e => onApiKeyChange(e.target.value)}
        placeholder="مفتاح API"
        style={{ borderRadius: 8, marginBottom: 10, height: 36 }}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <Button type="primary" block onClick={onSave} size="small" style={{ borderRadius: 8 }}>
          حفظ وإخفاء
        </Button>
        <Button block onClick={onCancel} size="small" style={{ borderRadius: 8 }}>
          إلغاء
        </Button>
      </div>
    </div>
  )
}
