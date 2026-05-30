import type { TextStyle, ViewStyle } from 'react-native';

import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';

export const buttons = {
  primary: {
    alignItems: 'center',
    backgroundColor: colors.accent.orange,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  } satisfies ViewStyle,
  primaryCompact: {
    alignItems: 'center',
    backgroundColor: colors.accent.orange,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } satisfies ViewStyle,
  primaryPressed: {
    backgroundColor: colors.accent.orangeDark,
  } satisfies ViewStyle,
  primaryDisabled: {
    backgroundColor: colors.navy[600],
    opacity: 0.55,
  } satisfies ViewStyle,
  primaryText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  } satisfies TextStyle,
  primaryTextLg: {
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  } satisfies TextStyle,
} as const;
