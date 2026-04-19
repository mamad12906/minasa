// minasa — tiny SVG chart primitives (RTL-aware)

function LineArea({ data, w = 300, h = 120, color = '#A8F0C6', fill = true, thickness = 2 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pad = 4;
  const sx = (i) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const sy = (v) => pad + (1 - (v - min) / rng) * (h - pad * 2);
  const pts = data.map((v, i) => `${sx(i)},${sy(v)}`).join(' ');
  const area = `M ${sx(0)},${h} L ${pts.split(' ').join(' L ')} L ${sx(data.length - 1)},${h} Z`;
  const gradId = 'g' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={thickness} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Sparkline({ data, w = 80, h = 28, color = '#A8F0C6' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Bars({ data, w = 300, h = 140, color = '#A8F0C6', highlight = -1, labels = [] }) {
  const max = Math.max(...data);
  const bw = (w - (data.length - 1) * 8) / data.length;
  return (
    <svg width={w} height={h + 18} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = (v / max) * h;
        const isHi = i === highlight;
        return (
          <g key={i}>
            <rect
              x={w - (i + 1) * bw - i * 8}
              y={h - bh}
              width={bw}
              height={bh}
              rx="4"
              fill={isHi ? color : 'rgba(168,240,198,0.28)'}
            />
            {labels[i] && (
              <text
                x={w - (i + 1) * bw - i * 8 + bw / 2}
                y={h + 14}
                fill="rgba(242,245,243,0.5)"
                fontSize="10"
                textAnchor="middle"
                fontFamily="Rubik, system-ui"
              >{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ segments, size = 120, thickness = 16 }) {
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness}/>
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * c;
        const off = acc * c;
        acc += frac;
        return (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

function Funnel({ steps, w = 340, color = '#A8F0C6' }) {
  const max = steps[0].value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: w }}>
      {steps.map((s, i) => {
        const frac = s.value / max;
        return (
          <div key={i} style={{ position: 'relative' }}>
            <div style={{
              height: 44, borderRadius: 10, overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center',
              padding: '0 14px',
            }}>
              <div style={{
                position: 'absolute', top: 0, bottom: 0, right: 0,
                width: `${frac * 100}%`,
                background: `linear-gradient(270deg, ${color}, ${color}55)`,
                opacity: 0.85 - i * 0.12,
              }}/>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', color: '#0B2018', fontWeight: 600, fontSize: 13 }}>
                <span style={{ color: '#0B2018' }}>{s.value.toLocaleString('ar-EG')}</span>
                <span>{s.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Heatmap — 7x N grid (days x weeks)
function Heatmap({ data, color = '#A8F0C6', cell = 14, gap = 3 }) {
  const max = Math.max(...data.flat(), 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data[0].length}, ${cell}px)`, gap, direction: 'ltr' }}>
      {data.flat().map((v, i) => (
        <div key={i} style={{
          width: cell, height: cell, borderRadius: 3,
          background: v === 0 ? 'rgba(255,255,255,0.05)' : color,
          opacity: v === 0 ? 1 : 0.25 + (v / max) * 0.75,
        }}/>
      ))}
    </div>
  );
}

Object.assign(window, { LineArea, Sparkline, Bars, Donut, Funnel, Heatmap });
