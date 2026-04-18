import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 40,
            fontFamily: 'Tajawal, sans-serif',
            backgroundColor: '#f5f5f5',
            color: '#333'
          }}
        >
          <h1 style={{ fontSize: 28, marginBottom: 16 }}>حدث خطأ غير متوقع</h1>
          <p style={{ fontSize: 16, marginBottom: 24, color: '#666' }}>
            عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى إعادة تشغيل البرنامج.
          </p>
          <details
            style={{
              maxWidth: 600,
              width: '100%',
              padding: 16,
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              marginBottom: 24,
              direction: 'ltr',
              textAlign: 'left'
            }}
          >
            <summary style={{ cursor: 'pointer', marginBottom: 8 }}>تفاصيل الخطأ</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#c00' }}>
              {this.state.error?.message}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 32px',
              fontSize: 16,
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            إعادة تحميل
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
