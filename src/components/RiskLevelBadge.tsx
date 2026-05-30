import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RiskLevel } from '@/types/compatibility';
import type { EquivalenceStatusTone } from '@/domain/presentation/formatCompatibilityMetadata';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, radius, spacing, typography } from '@/theme';
import { formatRiskLevel } from '@/utils/formatRisk';

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  low: colors.status.success,
  medium: colors.status.warning,
  high: colors.status.danger,
};

const TONE_COLORS: Record<EquivalenceStatusTone, { bg: string; text: string; border: string }> = {
  positive: colors.status.success,
  caution: colors.status.warning,
  danger: colors.status.danger,
};

interface RiskLevelBadgeProps {
  riskLevel?: RiskLevel;
  /** When set, shown instead of legacy risk text (e.g. "Yüksek uyum"). */
  label?: string;
  tone?: EquivalenceStatusTone;
  variant?: 'default' | 'dark';
}

export function RiskLevelBadge({
  riskLevel,
  label,
  tone,
  variant = 'default',
}: RiskLevelBadgeProps) {
  const { homeColors } = useTheme();

  const darkRiskColors = useMemo(
    (): Record<RiskLevel, { bg: string; text: string; border: string }> => ({
      low: {
        bg: homeColors.greenBg,
        text: homeColors.green,
        border: homeColors.greenBorder,
      },
      medium: {
        bg: homeColors.checkBlueBg,
        text: homeColors.checkBlue,
        border: homeColors.checkBlueBorder,
      },
      high: {
        bg: homeColors.redBg,
        text: homeColors.red,
        border: homeColors.redBorder,
      },
    }),
    [homeColors]
  );

  const darkToneColors = useMemo(
    (): Record<EquivalenceStatusTone, { bg: string; text: string; border: string }> => ({
      positive: darkRiskColors.low,
      caution: darkRiskColors.medium,
      danger: darkRiskColors.high,
    }),
    [darkRiskColors]
  );

  const displayLabel = label ?? (riskLevel ? formatRiskLevel(riskLevel) : '');
  const isDark = variant === 'dark';
  const riskPalette = isDark ? darkRiskColors : RISK_COLORS;
  const tonePalette = isDark ? darkToneColors : TONE_COLORS;
  const palette =
    label && tone
      ? tonePalette[tone]
      : riskLevel
        ? riskPalette[riskLevel]
        : tonePalette.caution;

  if (!displayLabel) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{displayLabel}</Text>
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
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
