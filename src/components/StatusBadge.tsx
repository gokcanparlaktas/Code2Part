import { StyleSheet, Text, View } from 'react-native';

import type { CompatibilityStatus } from '@/types/compatibility';

const LABELS: Record<CompatibilityStatus, string> = {
  compatible: 'Uyumlu',
  different: 'Farklı',
  unknownOrCheck: 'Kontrol gerekli',
};

const COLORS: Record<CompatibilityStatus, { bg: string; text: string }> = {
  compatible: { bg: '#DCFCE7', text: '#166534' },
  different: { bg: '#FEE2E2', text: '#991B1B' },
  unknownOrCheck: { bg: '#FEF3C7', text: '#92400E' },
};

interface StatusBadgeProps {
  status: CompatibilityStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const palette = COLORS[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
