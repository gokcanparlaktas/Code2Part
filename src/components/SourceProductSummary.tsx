import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";
import type { ProductIdentification } from "@/types/product";
import { formatSourceSummary } from "@/utils/formatSourceSummary";

interface SourceProductSummaryProps {
  identification: ProductIdentification;
}

export function SourceProductSummary({
  identification,
}: SourceProductSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Kaynak ürün</Text>
      <Text style={styles.summary}>{formatSourceSummary(identification)}</Text>
      <Text style={styles.code}>{identification.normalizedCode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderColor: colors.accent.orangeDark,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  label: {
    ...typography.sectionTitle,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
  },
  summary: {
    ...typography.h2,
    color: colors.text.inverse,
    lineHeight: 24,
  },
  code: {
    ...typography.code,
    color: colors.navy[900],
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
