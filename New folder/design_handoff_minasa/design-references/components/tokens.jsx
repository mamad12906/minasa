// minasa — design tokens

const MINASA = {
  // dark palette
  bg:        '#0B0F0E',      // near-black
  surface:   '#141918',      // card
  surface2:  '#1C2322',      // elevated
  line:      'rgba(255,255,255,0.08)',
  lineStrong:'rgba(255,255,255,0.14)',

  // text
  text:      '#F2F5F3',
  textDim:   'rgba(242,245,243,0.62)',
  textMute:  'rgba(242,245,243,0.38)',

  // brand
  mint:      '#A8F0C6',      // primary accent — mint green
  mintDeep:  '#5EE2A0',
  mintInk:   '#0B2018',      // on-mint text

  // semantic
  up:        '#5EE2A0',      // positive delta
  down:      '#FF7A8A',      // negative delta
  warn:      '#FFC466',
  info:      '#7FB8FF',
  purple:    '#C7A7FF',

  // chart palette
  c1: '#A8F0C6',
  c2: '#7FB8FF',
  c3: '#C7A7FF',
  c4: '#FFC466',
  c5: '#FF9CB3',

  // light palette (for onboarding / contrast screens)
  lightBg:   '#F5F3EE',
  lightSurf: '#FFFFFF',
  lightText: '#0E1412',
  lightDim:  'rgba(14,20,18,0.60)',

  // radii + shadow
  r: { sm: 10, md: 16, lg: 20, xl: 28 },
  shadow: '0 1px 2px rgba(0,0,0,0.25), 0 8px 32px rgba(0,0,0,0.28)',

  // font
  fontAr: '"IBM Plex Sans Arabic", "Rubik", -apple-system, system-ui, sans-serif',
  fontNum:'"Rubik", "IBM Plex Sans Arabic", system-ui, sans-serif',
};

window.MINASA = MINASA;
