import { StyleSheet, Text, View } from 'react-native';

import { filterGenericCompatibilityWarningsForUi } from '@/domain/presentation/filterGenericCompatibilityWarnings';
import { formatCompatibilityWarningForUi } from '@/domain/presentation/formatCompatibilityMetadata';
import { colors, radius, spacing, typography } from '@/theme';

interface CompatibilityWarningsListProps {
  warnings: string[];
}

export function CompatibilityWarningsList({ warnings }: CompatibilityWarningsListProps) {
  const visibleWarnings = filterGenericCompatibilityWarningsForUi(warnings);

  if (visibleWarnings.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kontrol notları</Text>
      {visibleWarnings.map((warning) => {
        const formatted = formatCompatibilityWarningForUi(warning);
        return (
          <View
            key={warning}
            style={[
              styles.warningItem,
              formatted.isCatalogReview && styles.catalogReviewItem,
            ]}
          >
            <Text
              style={[
                styles.warningTitle,
                formatted.isCatalogReview && styles.catalogReviewTitle,
              ]}
            >
              {formatted.title}
            </Text>
            {formatted.detail && formatted.detail !== formatted.title ? (
              <Text style={styles.warningDetail}>{formatted.detail}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
  },
  warningItem: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderLeftColor: colors.match.medium,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  catalogReviewItem: {
    borderLeftColor: colors.accent.orange,
  },
  warningTitle: {
    ...typography.bodySm,
    color: colors.surface.text,
    fontWeight: '700',
  },
  catalogReviewTitle: {
    color: colors.match.medium,
  },
  warningDetail: {
    ...typography.bodySm,
    color: colors.surface.textMuted,
  },
});
