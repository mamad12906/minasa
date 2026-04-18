import React, { useId } from 'react'

interface Props {
  data: number[]
  color?: string
  w?: number
  h?: number
  fill?: boolean
}

export default function Sparkline({ data, color = 'var(--brand)', w = 100, h = 32, fill = true }: Props) {
  const gradId = useId().replace(/[^a-z0-9]/gi, '')

  if (!data || data.length < 2) {
    return <svg width={w} height={h} className="spark" />
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ])
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ')
  const area = path + ` L${w},${h} L0,${h} Z`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      {fill && (
        <>
          <defs>
            <linearGradient id={`g-${gradId}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#g-${gradId})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
