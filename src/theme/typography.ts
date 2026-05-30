import type { TextStyle } from 'react-native';

import { colors } from './colors';

export const typography = {
  hero: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.3,
  } satisfies TextStyle,
  brand: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
  } satisfies TextStyle,
  h1: {
    fontSize: 20,
    fontWeight: '800',
  } satisfies TextStyle,
  h2: {
    fontSize: 17,
    fontWeight: '700',
  } satisfies TextStyle,
  h3: {
    fontSize: 15,
    fontWeight: '700',
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
  label: {
    fontSize: 13,
    fontWeight: '600',
  } satisfies TextStyle,
  code: {
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  } satisfies TextStyle,
  codeLg: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '700',
  } satisfies TextStyle,
} as const;

export const textColors = {
  primary: { color: colors.text.primary },
  secondary: { color: colors.text.secondary },
  muted: { color: colors.text.muted },
  inverse: { color: colors.text.inverse },
  accent: { color: colors.accent.blue },
} as const;
