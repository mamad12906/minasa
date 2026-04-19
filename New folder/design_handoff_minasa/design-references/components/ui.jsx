// minasa — shared UI primitives + tab bar

function Pill({ children, tone = 'up', sm = false }) {
  const M = window.MINASA;
  const bg = tone === 'up' ? 'rgba(94,226,160,0.14)' : tone === 'down' ? 'rgba(255,122,138,0.14)' : tone === 'warn' ? 'rgba(255,196,102,0.14)' : 'rgba(127,184,255,0.14)';
  const fg = tone === 'up' ? M.up : tone === 'down' ? M.down : tone === 'warn' ? M.warn : M.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: bg, color: fg,
      fontSize: sm ? 11 : 12, fontWeight: 600,
      padding: sm ? '2px 7px' : '3px 9px', borderRadius: 999,
      lineHeight: 1.2, fontFamily: M.fontNum,
      fontFeatureSettings: '"tnum"', direction: 'ltr',
    }}>{children}</span>
  );
}

function Card({ children, pad = 16, style = {} }) {
  const M = window.MINASA;
  return (
    <div style={{
      background: M.surface, borderRadius: M.r.lg,
      padding: pad, border: `1px solid ${M.line}`,
      ...style,
    }}>{children}</div>
  );
}

function Avatar({ initials, color = '#A8F0C6', size = 40, img }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: img ? `center/cover no-repeat url(${img})` : color + '33',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color, fontWeight: 700, fontSize: size * 0.38,
      flexShrink: 0, fontFamily: window.MINASA.fontAr,
      border: `1px solid ${color}55`,
    }}>{!img && initials}</div>
  );
}

function TabBar({ active = 'home' }) {
  const M = window.MINASA;
  const items = [
    { k: 'home',    label: 'الرئيسية',  icon: I.home },
    { k: 'chart',   label: 'التحليلات', icon: I.chart },
    { k: 'users',   label: 'الزبائن',   icon: I.users },
    { k: 'bell',    label: 'التنبيهات', icon: I.bell },
    { k: 'settings',label: 'الإعدادات', icon: I.settings },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 20, left: 12, right: 12,
      background: 'rgba(20,25,24,0.82)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      border: `1px solid ${M.line}`,
      borderRadius: 28, padding: '10px 8px',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
    }}>
      {items.map(it => {
        const on = it.k === active;
        return (
          <div key={it.k} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 4px', borderRadius: 20,
            background: on ? 'rgba(168,240,198,0.14)' : 'transparent',
          }}>
            <it.icon size={22} color={on ? M.mint : M.textDim}/>
            <div style={{
              fontSize: 10, color: on ? M.mint : M.textDim,
              fontWeight: on ? 600 : 500, fontFamily: M.fontAr,
            }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// TopBar — dark header with greeting + icons
function TopBar({ greeting, name, store, unread = 0 }) {
  const M = window.MINASA;
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '62px 18px 14px', gap: 12 }}>
      <Avatar initials={name?.[0] || 'م'} color={M.mint} size={44}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: M.textDim, fontFamily: M.fontAr }}>{greeting}</div>
        <div style={{ fontSize: 15, color: M.text, fontWeight: 600, fontFamily: M.fontAr, lineHeight: 1.2 }}>
          {store}
        </div>
      </div>
      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 20, background: M.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
        <I.search size={18} color={M.text}/>
      </div>
      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 20, background: M.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
        <I.bell size={18} color={M.text}/>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 8, left: 8, minWidth: 16, height: 16, borderRadius: 8,
            background: M.mint, color: M.mintInk, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', fontFamily: M.fontNum,
          }}>{unread}</div>
        )}
      </div>
    </div>
  );
}

// Screen Header — simpler inner screens
function ScreenHeader({ title, back = true }) {
  const M = window.MINASA;
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '62px 18px 14px', gap: 10 }}>
      {back && (
        <div style={{ width: 40, height: 40, borderRadius: 20, background: M.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
          <I.chevR size={18} color={M.text}/>
        </div>
      )}
      <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: M.text, fontFamily: M.fontAr, textAlign: 'center' }}>{title}</div>
      <div style={{ width: 40, height: 40, borderRadius: 20, background: M.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${M.line}` }}>
        <I.dots size={18} color={M.text}/>
      </div>
    </div>
  );
}

function SegmentControl({ items, active = 0 }) {
  const M = window.MINASA;
  return (
    <div style={{
      display: 'flex', gap: 2, background: M.surface,
      borderRadius: 12, padding: 3, border: `1px solid ${M.line}`,
    }}>
      {items.map((it, i) => {
        const on = i === active;
        return (
          <div key={i} style={{
            flex: 1, padding: '8px 10px', textAlign: 'center',
            borderRadius: 9, background: on ? M.mint : 'transparent',
            color: on ? M.mintInk : M.textDim,
            fontWeight: on ? 700 : 500, fontSize: 12,
            fontFamily: M.fontAr,
          }}>{it}</div>
        );
      })}
    </div>
  );
}

// Arabic number formatter (uses Arabic-Indic digits)
const fmt = (n, arabic = true) => {
  const str = Math.abs(n) >= 1000 ? n.toLocaleString('en-US') : String(n);
  if (!arabic) return str;
  const arDigits = '٠١٢٣٤٥٦٧٨٩';
  return str.replace(/\d/g, d => arDigits[+d]);
};

// Currency — SAR  
const money = (n, withSym = true) => {
  const v = n.toLocaleString('ar-EG', { maximumFractionDigits: 0 });
  return withSym ? `${v} ر.س` : v;
};

Object.assign(window, { Pill, Card, Avatar, TabBar, TopBar, ScreenHeader, SegmentControl, fmt, money });
