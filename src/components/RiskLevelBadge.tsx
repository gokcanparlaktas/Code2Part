import { StyleSheet, Text, View } from 'react-native';

import type { RiskLevel } from '@/types/compatibility';
import type { EquivalenceStatusTone } from '@/domain/presentation/formatCompatibilityMetadata';
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
}

export function RiskLevelBadge({ riskLevel, label, tone }: RiskLevelBadgeProps) {
  const displayLabel = label ?? (riskLevel ? formatRiskLevel(riskLevel) : '');
  const palette =
    label && tone
      ? TONE_COLORS[tone]
      : riskLevel
        ? RISK_COLORS[riskLevel]
        : TONE_COLORS.caution;

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
