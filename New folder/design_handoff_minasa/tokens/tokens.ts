/**
 * Minasa design tokens — TypeScript export.
 * Drop into React Native / React / any TS project.
 */

export const colorsDark = {
  bg: {
    base:      '#0A0F0D',
    elevated:  '#0F1512',
    card:      '#141B17',
    cardHover: '#1A221D',
    input:     '#0F1512',
  },
  border: {
    default: '#1F2924',
    strong:  '#2A3830',
    subtle:  '#161E1A',
  },
  text: {
    primary:   '#E8EDEA',
    secondary: '#A8B2AD',
    muted:     '#6B7570',
    faint:     '#4A524E',
    onBrand:   '#F5F0E8',
  },
  brand: {
    default: '#2D6B55',
    hover:   '#3A8069',
    strong:  '#1A4A38',
    deep:    '#0F4C3A',
  },
  accent: {
    default: '#D4A574',
    hover:   '#E0B586',
    deep:    '#A37B4F',
  },
  success: '#4ADE80',
  warning: '#FBBF24',
  danger:  '#F87171',
  info:    '#60A5FA',
  violet:  '#A78BFA',
  chart:   ['#2D6B55', '#D4A574', '#60A5FA', '#A78BFA', '#F87171', '#FBBF24', '#4ADE80'],
} as const;

export const colorsLight = {
  bg: {
    base:      '#F7F5F0',
    elevated:  '#FBFAF7',
    card:      '#FFFFFF',
    cardHover: '#F3F1EC',
    input:     '#FBFAF7',
  },
  border: {
    default: '#E2DED5',
    strong:  '#CFC9BC',
    subtle:  '#EFEBE3',
  },
  text: {
    primary:   '#1A1F1C',
    secondary: '#4E5954',
    muted:     '#7E867F',
    faint:     '#B0B5AF',
    onBrand:   '#FFFFFF',
  },
  brand: {
    default: '#0F4C3A',
    hover:   '#0A3B2D',
    strong:  '#083326',
    deep:    '#062A1F',
  },
  accent: {
    default: '#A37B4F',
    hover:   '#8C6740',
    deep:    '#735033',
  },
  success: '#16A34A',
  warning: '#CA8A04',
  danger:  '#DC2626',
  info:    '#2563EB',
  violet:  '#7C3AED',
  chart:   ['#0F4C3A', '#A37B4F', '#2563EB', '#7C3AED', '#DC2626', '#CA8A04', '#16A34A'],
} as const;

export const typography = {
  fontFamily: {
    arabic:  'IBM Plex Sans Arabic, system-ui, sans-serif',
    numeric: 'Rubik, IBM Plex Sans Arabic, sans-serif',
    mono:    'JetBrains Mono, monospace',
  },
  size: { xs: 11, sm: 12, base: 13, md: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28, '4xl': 32, '5xl': 40 },
  weight: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.2, snug: 1.25, normal: 1.4, relaxed: 1.6 },
} as const;

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
} as const;

export const radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   28,
  full: 999,
} as const;

export const shadow = {
  dark: {
    sm: '0 1px 2px rgba(0,0,0,0.35)',
    md: '0 4px 12px rgba(0,0,0,0.4)',
    lg: '0 12px 32px rgba(0,0,0,0.55)',
  },
  light: {
    sm: '0 1px 2px rgba(20,30,25,0.05)',
    md: '0 4px 12px rgba(20,30,25,0.08)',
    lg: '0 12px 32px rgba(20,30,25,0.12)',
  },
} as const;

export const motion = {
  easing:   'cubic-bezier(0.2, 0, 0, 1)',
  duration: { fast: 150, normal: 250, slow: 400 },
} as const;

/** Helper: convert Western digits to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩). */
export const toArabicDigits = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export type MinasaTheme = 'dark' | 'light';

export const getColors = (theme: MinasaTheme) =>
  theme === 'dark' ? colorsDark : colorsLight;
