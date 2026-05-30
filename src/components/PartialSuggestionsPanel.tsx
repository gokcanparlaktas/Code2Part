import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getSuggestionReactKey, type SuggestedProduct } from '@/types/suggestion';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

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
  const styles = useHomeStyles(createStyles);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedProduct | null>(null);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {suggestions.map((suggestion, index) => (
          <ProductSuggestionCard
            key={getSuggestionReactKey(suggestion)}
            query={query}
            suggestion={suggestion}
            isLast={index === suggestions.length - 1}
            onPress={() => setSelectedSuggestion(suggestion)}
          />
        ))}
      </View>
      {hasMoreResults ? (
        <Text style={styles.moreResultsHint}>
          Daha fazla sonuç var; aramayı daraltın.
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

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    panel: {
      gap: 8,
      marginTop: 10,
    },
    title: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    list: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      overflow: 'hidden',
      paddingHorizontal: 12,
    },
    moreResultsHint: {
      color: c.textDim,
      fontSize: 11,
    },
  });
