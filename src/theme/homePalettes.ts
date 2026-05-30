import { Platform } from 'react-native';

import { colors } from '@/theme/colors';

export type HomeColorPalette = {
  bg: string;
  cardBg: string;
  inputBg: string;
  resultBg: string;
  border: string;
  borderDark: string;
  borderSub: string;
  accent: string;
  /** Logo "2", footer Match. — her iki temada açık mavi. */
  brandAccentBlue: string;
  brandBlue: string;
  checkBlue: string;
  checkBlueBorder: string;
  checkBlueBg: string;
  textPrimary: string;
  textMuted: string;
  textDim: string;
  footerBg: string;
  footerText: string;
  footerSep: string;
  headerTitle: string;
  tabBarInactive: string;
  /** Skor / uyum yüzdesi kartları — açık modda beyaz değil, lacivert tonlu yüzey. */
  scoreCardBg: string;
  green: string;
  greenBorder: string;
  greenBg: string;
  red: string;
  redBorder: string;
  redBg: string;
  amber: string;
  amberBorder: string;
  amberBg: string;
};

/** Mevcut koyu tema — varsayılan görünüm. */
export const darkHomeColors: HomeColorPalette = {
  bg: '#0b1929',
  cardBg: '#152535',
  inputBg: '#0f2035',
  resultBg: '#0f2035',
  border: '#1e3a55',
  borderDark: '#111e2d',
  borderSub: '#1a2f45',
  accent: colors.accent.orange,
  brandAccentBlue: colors.accent.blueLight,
  brandBlue: colors.accent.blueLight,
  checkBlue: colors.accent.blueLight,
  checkBlueBorder: '#1e4a7a',
  checkBlueBg: 'rgba(96, 165, 250, 0.1)',
  textPrimary: '#c0d8ea',
  textMuted: '#6b8fa8',
  textDim: '#4a6a80',
  footerBg: '#080f18',
  footerText: '#2a4a60',
  footerSep: '#1a2f45',
  headerTitle: '#ffffff',
  tabBarInactive: '#3a5a70',
  scoreCardBg: '#0f2035',
  green: '#4a9e6a',
  greenBorder: '#1a4a25',
  greenBg: '#0a1a0f',
  red: '#c04a4a',
  redBorder: '#4a1515',
  redBg: '#1a0f0f',
  amber: '#c8900a',
  amberBorder: '#4a3a00',
  amberBg: '#1a1500',
};

/** Açık tema — lacivert, beyaz, turuncu. */
export const lightHomeColors: HomeColorPalette = {
  bg: '#ffffff',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
  resultBg: '#ffffff',
  border: '#c5d0dc',
  borderDark: '#dce4ed',
  borderSub: '#e8edf2',
  accent: colors.accent.orange,
  brandAccentBlue: colors.accent.blueLight,
  brandBlue: colors.navy[900],
  checkBlue: colors.navy[800],
  checkBlueBorder: '#b8c8d8',
  checkBlueBg: 'rgba(10, 22, 40, 0.05)',
  textPrimary: colors.navy[900],
  textMuted: colors.navy[600],
  textDim: '#475569',
  footerBg: '#f8fafc',
  footerText: colors.navy[600],
  footerSep: '#cbd5e1',
  headerTitle: colors.navy[900],
  tabBarInactive: '#64748b',
  scoreCardBg: '#ffffff',
  green: '#15803d',
  greenBorder: '#bbf7d0',
  greenBg: '#f0fdf4',
  red: '#b91c1c',
  redBorder: '#fecaca',
  redBg: '#fef2f2',
  amber: '#a16207',
  amberBorder: '#fde68a',
  amberBg: '#fffbeb',
};

export const homeMonoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export type ThemeMode = 'dark' | 'light';

export function homeColorsForMode(mode: ThemeMode): HomeColorPalette {
  return mode === 'light' ? lightHomeColors : darkHomeColors;
}
