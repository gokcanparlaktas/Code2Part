import { StyleSheet, Text, View } from 'react-native';

import { filterGenericCompatibilityWarningsForUi } from '@/domain/presentation/filterGenericCompatibilityWarnings';
import { formatCompatibilityWarningForUi } from '@/domain/presentation/formatCompatibilityMetadata';

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
      <Text style={styles.sectionTitle}>Uyarılar</Text>
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
    gap: 10,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  warningItem: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    gap: 6,
    padding: 12,
  },
  catalogReviewItem: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  warningTitle: {
    color: '#9A3412',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  catalogReviewTitle: {
    color: '#92400E',
  },
  warningDetail: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
