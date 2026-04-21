import React, { useState } from 'react'
import Icon, { IconName } from '../../layout/Icon'

interface LookupItem { id: number; name: string }

type ChipTone = 'brand' | 'violet' | 'accent'

interface Props {
  title: string
  icon: IconName
  items: LookupItem[]
  iconBg: string
  iconFg: string
  chipTone: ChipTone
  placeholder: string
  emptyLabel: string
  onAdd: (name: string) => Promise<void> | void
  onDelete: (id: number) => Promise<void> | void
}

// Generic lookup manager — replaced 3 near-identical blocks (platforms,
// categories, ministries) on the admin panel.
export default function LookupCard({
  title, icon, items, iconBg, iconFg, chipTone,
  placeholder, emptyLabel, onAdd, onDelete,
}: Props) {
  const [value, setValue] = useState('')

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed) return
    await onAdd(trimmed)
    setValue('')
  }

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: iconBg, color: iconFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={15} />
        </div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
        <span className="chip chip--neutral" style={{ marginInlineStart: 'auto' }}>
          <span className="num">{items.length}</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ flex: 1 }}
        />
        <button className="btn btn--primary btn--sm" onClick={submit}>
          <Icon name="plus" size={12} stroke={2.3} /> إضافة
        </button>
      </div>

      {items.length === 0 ? (
        <div className="muted" style={{ fontSize: 12, padding: 10 }}>{emptyLabel}</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map(item => (
            <span key={item.id} className={`chip chip--${chipTone}`} style={{ cursor: 'default' }}>
              {item.name}
              <button
                onClick={() => onDelete(item.id)}
                style={{
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'inherit',
                  padding: 0, display: 'flex', alignItems: 'center',
                  opacity: 0.7,
                }}
                title="حذف"
              >
                <Icon name="x" size={10} stroke={2.3} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
