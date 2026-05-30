import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getSuggestionReactKey, type SuggestedProduct } from '@/types/suggestion';
import { colors, spacing, typography } from '@/theme';

import { ProductSuggestionCard } from './ProductSuggestionCard';
import { ProductSuggestionDetailsModal } from './ProductSuggestionDetailsModal';

interface PartialSuggestionsPanelProps {
  title: string;
  query: string;
  suggestions: SuggestedProduct[];
  hasMoreResults?: boolean;
  onTrySuggestion?: (suggestion: SuggestedProduct) => void;
}

export function PartialSuggestionsPanel({
  title,
  query,
  suggestions,
  hasMoreResults = false,
  onTrySuggestion,
}: PartialSuggestionsPanelProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedProduct | null>(null);

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
            onPress={() => setSelectedSuggestion(suggestion)}
          />
        ))}
      </View>
      {hasMoreResults ? (
        <Text style={styles.moreResultsHint}>
          Daha fazla sonuç var; aramayı daraltarak listeleyebilirsiniz.
        </Text>
      ) : null}

      <ProductSuggestionDetailsModal
        visible={selectedSuggestion !== null}
        suggestion={selectedSuggestion}
        query={query}
        onClose={() => setSelectedSuggestion(null)}
        onTry={
          onTrySuggestion
            ? (suggestion) => {
                setSelectedSuggestion(null);
                onTrySuggestion(suggestion);
              }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
  },
  list: {
    gap: spacing.sm,
  },
  moreResultsHint: {
    ...typography.caption,
    color: colors.surface.textMuted,
    fontStyle: 'italic',
  },
});
