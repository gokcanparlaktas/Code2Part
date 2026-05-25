import { StyleSheet, Text, View } from 'react-native';

import type { CheckSeverity } from '@/types/compatibility';
import { formatCheckSeverity } from '@/utils/formatRisk';

const COLORS: Record<CheckSeverity, { bg: string; text: string }> = {
  low: { bg: '#E2E8F0', text: '#475569' },
  medium: { bg: '#FEF3C7', text: '#92400E' },
  high: { bg: '#FEE2E2', text: '#991B1B' },
};

interface SeverityBadgeProps {
  severity: CheckSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const palette = COLORS[severity];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {formatCheckSeverity(severity)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
