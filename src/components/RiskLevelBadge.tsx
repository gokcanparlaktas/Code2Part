import { StyleSheet, Text, View } from 'react-native';

import type { RiskLevel } from '@/types/compatibility';
import { formatRiskLevel } from '@/utils/formatRisk';

const COLORS: Record<RiskLevel, { bg: string; text: string }> = {
  low: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FEE2E2', text: '#991B1B' },
};

interface RiskLevelBadgeProps {
  riskLevel: RiskLevel;
}

export function RiskLevelBadge({ riskLevel }: RiskLevelBadgeProps) {
  const palette = COLORS[riskLevel];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {formatRiskLevel(riskLevel)}
      </Text>
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
