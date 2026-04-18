import React from 'react'
import { useTheme } from '../../App'
import Icon from './Icon'
import { useTopbarValue } from './TopbarContext'

interface Props {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: Props) {
  const { isDark, toggle: toggleTheme } = useTheme()
  const state = useTopbarValue()

  const breadcrumb = state.breadcrumb
  const effectiveSubtitle = state.subtitle ?? subtitle
  const search = state.search
  const actions = state.actions

  return (
    <header style={{
      minHeight: 68,
      padding: '10px 28px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      {/* ===== RIGHT: breadcrumb + title + subtitle (first child = rightmost in RTL) ===== */}
      <div style={{ minWidth: 0 }}>
        {breadcrumb && breadcrumb.length > 0 && (
          <div style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="arrow_left" size={11} stroke={2} />}
                <span style={{
                  color: i === breadcrumb.length - 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}>{b}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          margin: 0,
          color: 'var(--text-primary)',
        }}>{title}</h1>
        {effectiveSubtitle && (
          <div style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}>{effectiveSubtitle}</div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* ===== CENTER: search + actions ===== */}
      {search && (
        <div className="input-wrap" style={{ width: 260, maxWidth: '32vw' }}>
          <Icon name="search" size={15} />
          <input
            className="input"
            placeholder={search.placeholder || 'بحث…'}
            value={search.value}
            onChange={e => search.onChange(e.target.value)}
            style={{ height: 36 }}
          />
        </div>
      )}

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actions}
        </div>
      )}

      {/* ===== LEFT: theme toggle (last child = leftmost in RTL) ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={isDark ? 'وضع النهار' : 'الوضع الليلي'}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={16} />
        </button>
      </div>
    </header>
  )
}
