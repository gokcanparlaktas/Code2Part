import { StyleSheet, Text, View } from 'react-native';

import { getSuggestionReactKey, type SuggestedProduct } from '@/types/suggestion';

import { ProductSuggestionCard } from './ProductSuggestionCard';

interface PartialSuggestionsPanelProps {
  title: string;
  query: string;
  suggestions: SuggestedProduct[];
  hasMoreResults?: boolean;
  onSelectSuggestion?: (suggestion: SuggestedProduct) => void;
}

export function PartialSuggestionsPanel({
  title,
  query,
  suggestions,
  hasMoreResults = false,
  onSelectSuggestion,
}: PartialSuggestionsPanelProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {suggestions.map((suggestion) => (
          <ProductSuggestionCard
            key={getSuggestionReactKey(suggestion)}
            query={query}
            suggestion={suggestion}
            onPress={() => onSelectSuggestion?.(suggestion)}
          />
        ))}
      </View>
      {hasMoreResults ? (
        <Text style={styles.moreResultsHint}>
          Daha fazla sonuç var; aramayı daraltarak listeleyebilirsiniz.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  list: {
    gap: 10,
  },
  moreResultsHint: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
