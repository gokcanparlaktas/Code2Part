import { StyleSheet, Text, View } from 'react-native';

import type { SuggestedProduct } from '@/types/suggestion';

import { ProductSuggestionCard } from './ProductSuggestionCard';

interface PartialSuggestionsPanelProps {
  title: string;
  suggestions: SuggestedProduct[];
  onSelectSuggestion?: (suggestion: SuggestedProduct) => void;
}

export function PartialSuggestionsPanel({
  title,
  suggestions,
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
            key={suggestion.seriesId}
            suggestion={suggestion}
            onPress={() => onSelectSuggestion?.(suggestion)}
          />
        ))}
      </View>
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
});
