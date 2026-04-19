// Tiny SVG charts tuned for minasa's minimal look.

function Sparkline({ data, w = 120, h = 32, stroke, fill, strokeWidth = 1.6 }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {fill && <path d={area} fill={fill} />}
      <path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LineChart({ data, w = 340, h = 140, color, grid = 'rgba(0,0,0,0.06)', axisLabels }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pad = 8;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)]);
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L${w - pad} ${h - pad} L${pad} ${h - pad} Z`;
  // 4 horizontal grid lines
  const lines = [0, 0.33, 0.66, 1].map(t => h - pad - t * (h - pad * 2));
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {lines.map((y, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke={grid} strokeDasharray="2 4" />
      ))}
      <defs>
        <linearGradient id={`lg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#lg-${color.replace('#','')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => i === pts.length - 1 && (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="5" fill="#fff" stroke={color} strokeWidth="2" />
        </g>
      ))}
      {axisLabels && (
        <g style={{ fontFamily: FONTS.ui, fontSize: 10, fill: 'rgba(0,0,0,0.4)' }}>
          {axisLabels.map((l, i) => (
            <text key={i} x={pad + i * ((w - pad * 2) / (axisLabels.length - 1))} y={h} textAnchor="middle">{l}</text>
          ))}
        </g>
      )}
    </svg>
  );
}

function BarChart({ data, w = 320, h = 140, color, labels, maxVal }) {
  const max = maxVal ?? Math.max(...data);
  const pad = 8;
  const gap = 8;
  const bw = (w - pad * 2 - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad * 2 - 14);
        const x = pad + i * (bw + gap);
        const y = h - pad - 14 - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx={3} fill={color} opacity={i === data.length - 1 ? 1 : 0.38} />
            {labels && (
              <text x={x + bw / 2} y={h - 2} textAnchor="middle" style={{ fontFamily: FONTS.ui, fontSize: 10, fill: 'rgba(0,0,0,0.4)' }}>{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Donut({ segments, size = 120, thickness = 14, center }) {
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const len = (s.value / total) * circ;
        const dash = `${len} ${circ - len}`;
        const el = (
          <circle
            key={i}
            cx={c} cy={c} r={r} fill="none"
            stroke={s.color} strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${c} ${c})`}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
      {center && (
        <g>
          <text x={c} y={c - 2} textAnchor="middle" style={{ fontFamily: FONTS.num, fontSize: size * 0.2, fontWeight: 600 }}>{center.value}</text>
          <text x={c} y={c + size * 0.14} textAnchor="middle" style={{ fontFamily: FONTS.ui, fontSize: 10, fill: 'rgba(0,0,0,0.5)' }}>{center.label}</text>
        </g>
      )}
    </svg>
  );
}

function Funnel({ steps, w = 320, color }) {
  const max = steps[0].value;
  const rowH = 36;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: w, direction: 'rtl' }}>
      {steps.map((s, i) => {
        const pct = s.value / max;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative', height: rowH, background: 'rgba(0,0,0,0.04)', borderRadius: 4 }}>
              <div style={{
                position: 'absolute', top: 0, right: 0, height: '100%',
                width: `${pct * 100}%`, background: color, opacity: 0.2 + (i === 0 ? 0.6 : (1 - i * 0.15)) * 0.4,
                borderRadius: 4,
              }} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 12px',
                fontFamily: FONTS.ui, fontSize: 13,
              }}>
                <span style={{ color: 'rgba(0,0,0,0.55)' }}>{s.label}</span>
                <span style={{ fontFamily: FONTS.num, fontWeight: 500 }}>{s.value.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ width: 42, textAlign: 'left', fontFamily: FONTS.num, fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
              {Math.round(pct * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeatCells({ rows = 7, cols = 24, color, data }) {
  // data: 2d array of 0..1 values; fallback to generated
  const cells = data || Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random()));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2, direction: 'rtl' }}>
      {cells.flatMap((row, r) => row.map((v, c) => (
        <div key={`${r}-${c}`} style={{
          aspectRatio: '1', borderRadius: 2,
          background: color, opacity: 0.08 + v * 0.9,
        }} />
      )))}
    </div>
  );
}

Object.assign(window, { Sparkline, LineChart, BarChart, Donut, Funnel, HeatCells });
