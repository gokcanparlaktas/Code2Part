import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';

interface ProductSuggestionCardProps {
  query: string;
  suggestion: SuggestedProduct;
  onPress: () => void;
}

function formatMissing(fields: SuggestedProduct['missingFields']): string {
  if (fields.length === 0) {
    return 'Eksik alan yok';
  }
  const labels: Record<string, string> = {
    bore: 'çap',
    stroke: 'strok',
    options: 'seçenekler',
  };
  return `Eksik: ${fields.map((f) => labels[f] ?? f).join(', ')}`;
}

export function ProductSuggestionCard({ query, suggestion, onPress }: ProductSuggestionCardProps) {
  const { detectedAttributes } = suggestion;
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {suggestion.brand} {suggestion.series}
        </Text>
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

      <Text style={styles.missing}>{formatMissing(suggestion.missingFields)}</Text>
      <Text style={styles.hint}>{suggestion.suggestionTextTr}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cardPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingRight: 8,
  },
  meta: {
    color: '#475569',
    fontSize: 14,
  },
  detected: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  missing: {
    color: '#B45309',
    fontSize: 13,
  },
  hint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
