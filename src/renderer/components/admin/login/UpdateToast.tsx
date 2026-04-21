import React from 'react'
import { Button, Progress, Modal } from 'antd'
import { CheckCircleOutlined, CloudDownloadOutlined } from '@ant-design/icons'

interface Props {
  updateInfo: any
  updateReady: boolean
  downloadProgress: number | null
  onStartDownload: () => void
  onInstall: () => void
}

// Toast shown on the login screen while an auto-update is available /
// downloading / ready. Extracted so LoginPage.tsx stays focused on auth.
export default function UpdateToast({
  updateInfo, updateReady, downloadProgress, onStartDownload, onInstall,
}: Props) {
  if (!updateInfo && !updateReady) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      padding: '12px 20px',
      borderRadius: 14,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      animation: 'slideUp 0.4s ease',
      color: 'var(--text-primary)',
      fontSize: 13,
    }}>
      {updateReady ? (
        <>
          <CheckCircleOutlined style={{ color: 'var(--success)', fontSize: 18 }} />
          <span>التحديث جاهز</span>
          <Button
            size="small"
            type="primary"
            onClick={() => Modal.confirm({
              title: 'تثبيت التحديث',
              content: 'سيتم إعادة تشغيل البرنامج.',
              okText: 'ثبّت',
              cancelText: 'لاحقاً',
              onOk: onInstall,
            })}
            style={{ borderRadius: 8 }}
          >
            ثبّت الآن
          </Button>
        </>
      ) : downloadProgress !== null ? (
        <>
          <span>جاري التحميل</span>
          <Progress percent={downloadProgress} size="small" style={{ width: 140 }} strokeColor="var(--brand)" />
        </>
      ) : (
        <>
          <CloudDownloadOutlined style={{ color: 'var(--brand)', fontSize: 18 }} />
          <span>نسخة {updateInfo?.version}</span>
          <Button
            size="small"
            type="primary"
            onClick={onStartDownload}
            style={{ borderRadius: 8 }}
          >
            تحميل
          </Button>
        </>
      )}
    </div>
  )
}
