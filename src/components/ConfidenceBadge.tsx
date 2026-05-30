import { StyleSheet, Text, View } from 'react-native';

import type { ConfidenceLevel } from '@/types/product';
import { formatConfidence } from '@/utils/formatConfidence';

const COLORS: Record<ConfidenceLevel, { bg: string; text: string }> = {
  high: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  low: { bg: '#FFEDD5', text: '#9A3412' },
  unknown: { bg: '#F3F4F6', text: '#4B5563' },
};

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  label?: string;
}

export function ConfidenceBadge({ confidence, label }: ConfidenceBadgeProps) {
  const palette = COLORS[confidence];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>
        {label ?? formatConfidence(confidence)}
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
    fontSize: 13,
    fontWeight: '600',
  },
});
