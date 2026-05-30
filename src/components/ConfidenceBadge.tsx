import { StyleSheet, Text, View } from 'react-native';

import type { ConfidenceLevel } from '@/types/product';
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
}

export function ConfidenceBadge({ confidence, label }: ConfidenceBadgeProps) {
  const palette = PALETTE[confidence];

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
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
