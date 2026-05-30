/** Code2Part industrial design palette — dark navy, silver, controlled orange accent. */
export const colors = {
  navy: {
    950: '#060D18',
    900: '#0A1628',
    800: '#0F1F38',
    700: '#132744',
    600: '#1A3358',
  },
  accent: {
    blue: '#3B82F6',
    blueLight: '#60A5FA',
    blueDark: '#2563EB',
    blueMuted: '#1D4ED8',
    orange: '#F97316',
    orangeDark: '#EA580C',
    /** Bright green for positive highlights on dark surfaces. */
    greenBright: '#4ADE80',
  },
  silver: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
  },
  text: {
    primary: '#0F172A',
    secondary: '#334155',
    muted: '#64748B',
    faint: '#94A3B8',
    inverse: '#F8FAFC',
    inverseMuted: '#CBD5E1',
    inverseFaint: '#94A3B8',
  },
  /** Text on dark card / elevated surfaces (background.card, background.elevated). */
  surface: {
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  },
  background: {
    screen: '#0A1628',
    card: '#0F1F38',
    elevated: '#132744',
    navy: '#0A1628',
    input: '#132744',
  },
  border: {
    default: '#243B5C',
    subtle: '#1A3358',
    strong: '#334155',
    accent: '#2563EB',
    accentLight: '#60A5FA',
    navy: '#1A3358',
  },
  match: {
    high: '#059669',
    medium: '#CA8A04',
    low: '#C2410C',
    highBg: '#ECFDF5',
    mediumBg: '#FFFBEB',
    lowBg: '#FFF7ED',
    track: '#CBD5E1',
  },
  status: {
    success: { bg: '#ECFDF5', text: '#047857', border: '#6EE7B7' },
    warning: { bg: '#FFFBEB', text: '#92400E', border: '#D97706' },
    danger: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
    info: { bg: '#EFF6FF', text: '#1E40AF', border: '#93C5FD' },
    neutral: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  },
  compat: {
    positive: { bg: '#F8FAFC', header: '#F0FDF4', border: '#059669', text: '#047857' },
    negative: { bg: '#F8FAFC', header: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
    check: { bg: 'rgba(202, 138, 4, 0.12)', border: '#FBBF24', text: '#FCD34D' },
    critical: { bg: 'rgba(220, 38, 38, 0.12)', border: '#F87171', text: '#FCA5A5' },
    important: { bg: 'rgba(202, 138, 4, 0.12)', border: '#FBBF24', text: '#FCD34D' },
    optional: { bg: 'rgba(148, 163, 184, 0.08)', border: '#64748B', text: '#CBD5E1' },
  },
} as const;

export type MatchLevelColor = keyof typeof colors.match;
