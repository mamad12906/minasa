// ============================================
// Shell: Sidebar + Topbar + page container
// Icons: inline Lucide-style strokes
// ============================================

const Icon = ({ name, size = 18, stroke = 1.75 }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><circle cx="17" cy="7" r="3"/><path d="M22 20v-1a4 4 0 0 0-4-4"/></>,
    invoice: <><path d="M6 2h9l4 4v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><path d="M14 2v5h5"/><path d="M9 13h7M9 17h5M9 9h2"/></>,
    chart: <><path d="M3 3v18h18"/><path d="M7 14l3-4 4 3 5-6"/></>,
    whatsapp: <><path d="M21 11.5a8.5 8.5 0 0 1-13 7.2L3 21l2.3-4.9A8.5 8.5 0 1 1 21 11.5z"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
    shield: <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.65 1.65 0 0 0 1.8.3h0a1.65 1.65 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.5h0a1.65 1.65 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.65 1.65 0 0 0-.3 1.8v0a1.65 1.65 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.5 1z"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    filter: <><path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z"/></>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    x: <><path d="M18 6L6 18M6 6l12 12"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    arrow_left: <><path d="M19 12H5M12 19l-7-7 7-7"/></>,
    arrow_right: <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    arrow_up: <><path d="M7 17L17 7M7 7h10v10"/></>,
    arrow_down: <><path d="M17 7L7 17M17 17H7V7"/></>,
    crown: <><path d="M2 20h20M3 6l5 4 4-7 4 7 5-4-2 12H5L3 6z"/></>,
    id: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h3M15 12h3M5 16c.5-2 2-3 4-3s3.5 1 4 3"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></>,
    layers: <><path d="M12 2l10 5-10 5L2 7l10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    pin: <><path d="M12 2v5l-3 3v3h10v-3l-3-3V2"/><path d="M12 16v6"/></>,
    message: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
    swap: <><path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/></>,
    sparkles: <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM5 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></>,
    wifi: <><path d="M5 12.55a11 11 0 0 1 14 0M8.5 16.4a6 6 0 0 1 7 0M12 20h.01M2 8.8a15 15 0 0 1 20 0"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 2v6h6"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    tag: <><path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0l-8.6-8.6V2h10l8 8a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/></>,
    dot3: <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

// -------- Sidebar --------
const NAV = [
  { key: 'dashboard',  icon: 'dashboard', label: 'لوحة التحكم' },
  { key: 'customers',  icon: 'users',     label: 'الزبائن',   badge: '5,182' },
  { key: 'invoices',   icon: 'invoice',   label: 'الفواتير' },
  { key: 'reports',    icon: 'chart',     label: 'التقارير' },
  { key: 'whatsapp',   icon: 'whatsapp',  label: 'واتساب',    dot: true },
  { key: 'reminders',  icon: 'bell',      label: 'التذكيرات', badge: '24' },
  { type: 'divider' },
  { key: 'import',     icon: 'upload',    label: 'استيراد Excel' },
  { key: 'backup',     icon: 'save',      label: 'نسخ احتياطي' },
  { type: 'divider', label: 'إدارة' },
  { key: 'admin',      icon: 'shield',    label: 'لوحة الأدمن' },
  { key: 'audit',      icon: 'history',   label: 'سجل التغييرات' },
  { key: 'database',   icon: 'database',  label: 'قاعدة البيانات' },
  { key: 'settings',   icon: 'settings',  label: 'الإعدادات' },
];

const Sidebar = ({ active, onNavigate, collapsed, onToggle }) => {
  const [hover, setHover] = React.useState(false);
  const expanded = !collapsed || hover;

  return (
    <aside
      onMouseEnter={() => collapsed && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: expanded ? 244 : 68,
        background: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        transition: 'width 0.2s ease',
        color: '#E8EDEA',
        overflow: 'hidden',
      }}>
      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 18px', gap: 12,
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(140deg, var(--brand) 0%, var(--brand-deep) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(212,165,116,0.25)',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 20V8l8-5 8 5v12" stroke="#D4A574" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M9 20v-7h6v7" stroke="#D4A574" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </div>
        {expanded && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8EDEA', letterSpacing: '-0.01em' }}>مِناصة</div>
            <div style={{ fontSize: 10.5, color: '#6B7570', fontWeight: 500, letterSpacing: '0.04em' }}>
              MINASA · v2.4.0
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        {NAV.map((item, i) => {
          if (item.type === 'divider') {
            return (
              <div key={i} style={{ margin: '14px 0 8px', padding: '0 10px' }}>
                {expanded && item.label ? (
                  <div style={{ fontSize: 10.5, color: '#4A524E', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' }}>
                    {item.label}
                  </div>
                ) : <div style={{ height: 1, background: '#1F2924' }}/>}
              </div>
            );
          }
          const isActive = active === item.key;
          return (
            <button key={item.key}
              onClick={() => onNavigate(item.key)}
              title={!expanded ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', height: 38, padding: '0 12px',
                background: isActive ? 'var(--brand-tint)' : 'transparent',
                border: 'none',
                color: isActive ? '#D4A574' : '#A8B2AD',
                borderRadius: 9, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
                marginBottom: 2, textAlign: 'right',
                transition: 'background 0.12s, color 0.12s',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#141B17'; e.currentTarget.style.color = '#E8EDEA'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#A8B2AD'; }}}
            >
              <Icon name={item.icon} size={17} />
              {expanded && <span style={{ flex: 1 }}>{item.label}</span>}
              {expanded && item.badge && (
                <span className="num" style={{
                  fontSize: 10.5, fontWeight: 600, padding: '2px 7px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(212,165,116,0.2)' : '#1F2924',
                  color: isActive ? '#D4A574' : '#A8B2AD',
                }}>{item.badge}</span>
              )}
              {expanded && item.dot && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }}/>
              )}
              {!expanded && item.dot && (
                <span style={{ position: 'absolute', top: 9, left: 9, width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }}/>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: expanded ? '8px 10px' : '6px',
          borderRadius: 10,
          background: '#141B17',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 50,
            background: 'linear-gradient(140deg, #D4A574, #A37B4F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#0A0F0D', fontSize: 12, flexShrink: 0,
          }}>ف.م</div>
          {expanded && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#E8EDEA', display: 'flex', alignItems: 'center', gap: 5 }}>
                  فاتن المحمد
                  <Icon name="crown" size={11} stroke={2} />
                </div>
                <div style={{ fontSize: 10.5, color: '#6B7570' }}>أدمن · متصل</div>
              </div>
              <button className="icon-btn" style={{ color: '#6B7570', width: 28, height: 28 }} title="تسجيل خروج">
                <Icon name="logout" size={14} />
              </button>
            </>
          )}
        </div>

        {expanded && (
          <button onClick={onToggle}
            style={{
              marginTop: 8, width: '100%', height: 30,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#6B7570', fontSize: 11, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
            <Icon name="pin" size={11} />
            {collapsed ? 'تثبيت القائمة' : 'طيّ القائمة'}
          </button>
        )}
      </div>
    </aside>
  );
};

// -------- Topbar --------
const Topbar = ({ title, subtitle, onToggleTheme, isDark, breadcrumb, actions, onShowNotif }) => (
  <header style={{
    height: 68, padding: '0 28px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-base)',
    display: 'flex', alignItems: 'center', gap: 16,
    position: 'sticky', top: 0, zIndex: 20,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      {breadcrumb && (
        <div className="hide-narrow" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="arrow_left" size={11} stroke={2} />}
              <span style={{ color: i === breadcrumb.length - 1 ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h1>
      {subtitle && <div className="hide-narrow" style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>

    <div className="input-wrap hide-tight" style={{ width: 220, maxWidth: '28vw' }}>
      <Icon name="search" size={15} />
      <input className="input" placeholder="بحث…" style={{ height: 36 }}/>
    </div>

    {actions}

    <button className="icon-btn" onClick={onShowNotif} title="التذكيرات" style={{ position: 'relative' }}>
      <Icon name="bell" size={16} />
      <span style={{ position: 'absolute', top: 7, left: 7, width: 7, height: 7, borderRadius: 50, background: 'var(--danger)', boxShadow: '0 0 0 2px var(--bg-base)' }}/>
    </button>
    <button className="icon-btn" onClick={onToggleTheme} title="تبديل الوضع">
      <Icon name={isDark ? 'sun' : 'moon'} size={16} />
    </button>
  </header>
);

Object.assign(window, { Icon, Sidebar, Topbar });
