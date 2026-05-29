import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';

interface ProductSuggestionCardProps {
  query: string;
  suggestion: SuggestedProduct;
  onPress: () => void;
}

const MISSING_FIELD_LABELS: Record<SuggestedProduct['missingFields'][number], string> = {
  bore: 'çap',
  stroke: 'strok',
  options: 'seçenekler',
  spool_function: 'sürgü/fonksiyon',
  coil_voltage: 'bobin voltajı',
  connector: 'konnektör',
  flow_pressure: 'basınç/debi',
  manual_override: 'manuel kumanda',
  seal_material: 'conta',
};

function formatMissing(fields: SuggestedProduct['missingFields']): string {
  if (fields.length === 0) {
    return 'Eksik alan yok';
  }
  return `Eksik: ${fields.map((f) => MISSING_FIELD_LABELS[f] ?? f).join(', ')}`;
}

export function ProductSuggestionCard({ query, suggestion, onPress }: ProductSuggestionCardProps) {
  const { detectedAttributes } = suggestion;
  const isExactCodeMatch = suggestion.matchedBy === 'exact_match';
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);
  const modelCode = suggestion.exampleCodeFormat?.trim() ?? '';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {suggestion.brand}
          </Text>
          {modelCode ? (
            <Text style={styles.modelLine}>
              <Text style={styles.modelLabel}>Model: </Text>
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
        <Text style={styles.missing}>{formatMissing(suggestion.missingFields)}</Text>
      ) : null}
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
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  modelLine: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  modelLabel: {
    color: '#64748B',
    fontWeight: '600',
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
