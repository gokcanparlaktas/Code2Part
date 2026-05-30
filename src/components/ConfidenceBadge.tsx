import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ConfidenceLevel } from '@/types/product';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, radius, spacing, typography } from '@/theme';
import { formatConfidence } from '@/utils/formatConfidence';

const PALETTE: Record<ConfidenceLevel, { bg: string; text: string; border: string }> = {
  high: colors.status.success,
  medium: colors.status.warning,
  low: { bg: colors.match.lowBg, text: colors.match.low, border: colors.match.low },
  unknown: colors.status.neutral,
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  label?: string;
  variant?: 'default' | 'dark';
}

export function ConfidenceBadge({
  confidence,
  label,
  variant = 'default',
}: ConfidenceBadgeProps) {
  const { homeColors } = useTheme();

  const darkPalette = useMemo(
    (): Record<ConfidenceLevel, { bg: string; text: string; border: string }> => ({
      high: {
        bg: homeColors.greenBg,
        text: homeColors.green,
        border: homeColors.greenBorder,
      },
      medium: {
        bg: homeColors.amberBg,
        text: homeColors.amber,
        border: homeColors.amberBorder,
      },
      low: {
        bg: homeColors.redBg,
        text: homeColors.red,
        border: homeColors.redBorder,
      },
      unknown: {
        bg: homeColors.inputBg,
        text: homeColors.textMuted,
        border: homeColors.border,
      },
    }),
    [homeColors]
  );

  const palette =
    variant === 'dark' ? darkPalette[confidence] : PALETTE[confidence];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>
        {label ?? formatConfidence(confidence)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  text: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
