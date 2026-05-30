import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';
import type { SuggestedProduct } from '@/types/suggestion';
import { colors, radius, spacing, typography } from '@/theme';

import { PartialSuggestionsPanel } from './PartialSuggestionsPanel';

interface ProductCodeFieldWithSuggestionsProps {
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: SuggestedProduct) => void;
  suggestionsTitle?: string;
}

export function ProductCodeFieldWithSuggestions({
  label,
  hint,
  placeholder,
  value,
  onChange,
  onSelectSuggestion,
  suggestionsTitle = 'Bunlar olabilir',
}: ProductCodeFieldWithSuggestionsProps) {
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  const suggestionResult = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      return { suggestions: [], hasMoreResults: false };
    }
    return suggestProductsDetailed(trimmed, DEFAULT_SUGGESTION_LIMIT);
  }, [value]);

  const handleChangeText = (text: string) => {
    setSuggestionsDismissed(false);
    onChange(text);
  };

  const handleTrySuggestion = (suggestion: SuggestedProduct) => {
    const hasBoreOnly =
      suggestion.detectedAttributes.boreMm !== undefined &&
      suggestion.missingFields.includes('stroke');

    if (hasBoreOnly && suggestion.exampleCodeFormat) {
      onChange(suggestion.exampleCodeFormat);
      return;
    }

    const targetCode = suggestion.exampleCodeFormat?.trim();
    if (!targetCode) {
      return;
    }

    onSelectSuggestion(suggestion);
    setSuggestionsDismissed(true);
    onChange(targetCode);
  };

  const showSuggestions =
    suggestionResult.suggestions.length > 0 && !suggestionsDismissed;

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.text.inverseFaint}
        value={value}
        onChangeText={handleChangeText}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
        selectionColor={colors.accent.blue}
        underlineColorAndroid={colors.accent.blueDark}
      />

      {showSuggestions ? (
        <PartialSuggestionsPanel
          title={suggestionsTitle}
          query={value}
          suggestions={suggestionResult.suggestions}
          hasMoreResults={suggestionResult.hasMoreResults}
          onTrySuggestion={handleTrySuggestion}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.md,
  },
  fieldHeader: {
    gap: spacing.xs,
  },
  label: {
    ...typography.h3,
    color: colors.surface.text,
  },
  hint: {
    ...typography.bodySm,
    color: colors.surface.textMuted,
  },
  input: {
    backgroundColor: colors.background.input,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
});
