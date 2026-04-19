// Design tokens for minasa — editable by Tweaks

const MINASA_TOKENS = /*EDITMODE-BEGIN*/{
  "accent": "#C2410C",
  "theme": "light",
  "density": "medium"
}/*EDITMODE-END*/;

// Given accent hex, derive a small palette.
function minasaPalette(accent, theme) {
  const dark = theme === 'dark';
  return {
    // backgrounds
    bg: dark ? '#111110' : '#FAF8F3',          // warm off-white / near-black
    surface: dark ? '#1C1B19' : '#FFFFFF',
    surfaceAlt: dark ? '#26241F' : '#F2EFE7',
    // text
    ink: dark ? '#F5F2EC' : '#1A1814',
    inkMute: dark ? '#A39F94' : '#6B665C',
    inkFaint: dark ? '#6B665C' : '#A39F94',
    // borders
    line: dark ? 'rgba(255,255,255,0.08)' : 'rgba(26,24,20,0.08)',
    lineStrong: dark ? 'rgba(255,255,255,0.16)' : 'rgba(26,24,20,0.14)',
    // accent (warm amber-orange by default)
    accent,
    accentSoft: hexWithAlpha(accent, 0.12),
    accentInk: '#FFFFFF',
    // semantic
    up: '#2F7D4F',      // muted green
    down: '#B23B3B',    // muted red
    upSoft: 'rgba(47,125,79,0.12)',
    downSoft: 'rgba(178,59,59,0.12)',
  };
}

function hexWithAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// Arabic numerals converter (optional — by default we use Western for metrics)
function ar(n) { return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]); }

// Fonts
const FONTS = {
  ui: '"IBM Plex Sans Arabic", "IBM Plex Sans", system-ui, sans-serif',
  num: '"Rubik", "IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
};

Object.assign(window, { MINASA_TOKENS, minasaPalette, hexWithAlpha, ar, FONTS });
