// minasa — line icons (stroke-based, 24x24)

const Icon = ({ children, size = 22, color = 'currentColor', stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={color} strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block' }}>
    {children}
  </svg>
);

const I = {
  home: (p) => <Icon {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-5h4v5h5V9.5"/></Icon>,
  chart: (p) => <Icon {...p}><path d="M3 20h18"/><path d="M6 16V9"/><path d="M11 16V5"/><path d="M16 16v-7"/><path d="M21 16v-3"/></Icon>,
  users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9.5" r="2.3"/><path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M15.5 19c0-2 1.3-3.5 3.2-3.5 1.4 0 2.3.7 2.3.7"/></Icon>,
  bell: (p) => <Icon {...p}><path d="M6 10a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>,
  settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>,
  plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  filter: (p) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4"/></Icon>,
  arrRight: (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>,
  arrLeft: (p) => <Icon {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></Icon>,
  chevL: (p) => <Icon {...p}><path d="M15 6l-6 6 6 6"/></Icon>,
  chevR: (p) => <Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>,
  chevD: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  upArr: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  downArr: (p) => <Icon {...p}><path d="M12 5v14M5 12l7 7 7-7"/></Icon>,
  box: (p) => <Icon {...p}><path d="M21 7.5 12 3 3 7.5v9L12 21l9-4.5v-9z"/><path d="M3.3 7.7 12 12l8.7-4.3"/><path d="M12 12v9"/></Icon>,
  bag: (p) => <Icon {...p}><path d="M6 7h12l-1 13H7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></Icon>,
  star: (p) => <Icon {...p}><path d="m12 3 2.9 6 6.6.9-4.8 4.5 1.2 6.6L12 17.9 6.1 21l1.2-6.6L2.5 9.9l6.6-.9z"/></Icon>,
  heart: (p) => <Icon {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></Icon>,
  eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  dots: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></Icon>,
  calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>,
  sparkle: (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>,
  message: (p) => <Icon {...p}><path d="M21 12a8 8 0 1 1-3.5-6.6L21 5l-1 3.5A8 8 0 0 1 21 12z"/></Icon>,
  phone: (p) => <Icon {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></Icon>,
  truck: (p) => <Icon {...p}><path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></Icon>,
  tag: (p) => <Icon {...p}><path d="M20 12 12 20 3 11V3h8z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/></Icon>,
  logo: (p) => <Icon {...p} stroke={0}>
    <path d="M4 20V8l8 6 8-6v12" fill="currentColor"/>
    <circle cx="12" cy="7" r="2.5" fill="currentColor"/>
  </Icon>,
  menu: (p) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16"/></Icon>,
  logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/></Icon>,
  check: (p) => <Icon {...p}><path d="M5 12l5 5 9-10"/></Icon>,
  globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/></Icon>,
  mint: (p) => <Icon {...p}><path d="M12 3c3 2 5 5 5 9a5 5 0 1 1-10 0c0-4 2-7 5-9z"/><path d="M12 8c-1 2-1.5 4-1.5 6"/></Icon>,
};

window.I = I;
window.Icon = Icon;
