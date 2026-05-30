import { StyleSheet, Text, View } from 'react-native';

import type { RiskLevel } from '@/types/compatibility';
import type { EquivalenceStatusTone } from '@/domain/presentation/formatCompatibilityMetadata';
import { formatRiskLevel } from '@/utils/formatRisk';

const COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  low: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FEE2E2', text: '#991B1B' },
};

const TONE_COLORS: Record<EquivalenceStatusTone, { bg: string; text: string }> = {
  positive: { bg: '#DCFCE7', text: '#166534' },
  caution: { bg: '#FEF3C7', text: '#92400E' },
  danger: { bg: '#FEE2E2', text: '#991B1B' },
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
        ? COLORS[riskLevel]
        : TONE_COLORS.caution;

  if (!displayLabel) {
    return null;
  }

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
});
