import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import {
  formatSuggestionMissingStatus,
  isSeriesNameOnlySuggestion,
} from '@/domain/presentation/suggestionDisplay';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';
import { colors, radius, spacing, typography } from '@/theme';

interface ProductSuggestionCardProps {
  query: string;
  suggestion: SuggestedProduct;
  onPress: () => void;
}

export function ProductSuggestionCard({ query, suggestion, onPress }: ProductSuggestionCardProps) {
  const { detectedAttributes } = suggestion;
  const isExactCodeMatch = suggestion.matchedBy === 'exact_match';
  const isSeriesFound = isSeriesNameOnlySuggestion(suggestion);
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);
  const modelCode = suggestion.exampleCodeFormat?.trim() ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{suggestion.brand}</Text>
          {modelCode ? (
            <Text style={styles.modelLine}>
              <Text style={styles.modelLabel}>Model </Text>
              {modelCode}
            </Text>
          ) : null}
        </View>
        <MatchPercentageRing match={matchPercentage} />
      </View>

      <Text style={styles.meta}>{suggestion.productTypeTr}</Text>
      <Text style={styles.meta}>Standart: {suggestion.standardFamily}</Text>

      {detectedAttributes.boreMm !== undefined ? (
        <Text style={styles.detected}>Çap: {detectedAttributes.boreMm} mm</Text>
      ) : null}
      {detectedAttributes.strokeMm !== undefined ? (
        <Text style={styles.detected}>Strok: {detectedAttributes.strokeMm} mm</Text>
      ) : null}

      {!isExactCodeMatch ? (
        <Text style={isSeriesFound ? styles.seriesFound : styles.missing}>
          {formatSuggestionMissingStatus(suggestion)}
        </Text>
      ) : null}
      <Text style={styles.hint}>{suggestion.suggestionTextTr}</Text>
      <Text style={styles.detailHint}>Detay için dokunun</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.navy[600],
    borderColor: colors.accent.blue,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.surface.text,
  },
  modelLine: {
    ...typography.code,
    color: colors.accent.blueLight,
    fontSize: 13,
    marginTop: 2,
  },
  modelLabel: {
    color: colors.surface.textMuted,
    fontFamily: undefined,
    fontWeight: '600',
  },
  meta: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
  },
  detected: {
    ...typography.bodySm,
    color: colors.accent.blueLight,
    fontWeight: '600',
  },
  missing: {
    ...typography.caption,
    color: colors.match.medium,
    fontWeight: '600',
  },
  seriesFound: {
    ...typography.caption,
    color: colors.accent.greenBright,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hint: {
    ...typography.caption,
    color: colors.surface.textMuted,
    marginTop: 2,
  },
  detailHint: {
    ...typography.caption,
    color: colors.accent.blueLight,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
