import { StyleSheet, Text, View } from 'react-native';

import type { SuggestionConfidence } from '@/types/suggestion';

const LABELS: Record<SuggestionConfidence, string> = {
  high: 'Yüksek olasılık',
  medium: 'Orta olasılık',
  low: 'Düşük olasılık',
};

const COLORS: Record<SuggestionConfidence, { bg: string; text: string }> = {
  high: { bg: '#DCFCE7', text: '#166534' },
  medium: { bg: '#FEF9C3', text: '#854D0E' },
  low: { bg: '#FFEDD5', text: '#9A3412' },
};

interface SuggestionConfidenceBadgeProps {
  confidence: SuggestionConfidence;
}

export function SuggestionConfidenceBadge({ confidence }: SuggestionConfidenceBadgeProps) {
  const palette = COLORS[confidence];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{LABELS[confidence]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
