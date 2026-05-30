import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';
import type { SuggestedProduct } from '@/types/suggestion';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProductCodeScanTarget } from '@/services/scanCaptureStore';
import { openProductCodeScan } from '@/utils/openProductCodeScan';

import { PartialSuggestionsPanel } from './PartialSuggestionsPanel';

interface ProductCodeFieldWithSuggestionsProps {
  label: string;
  hint?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: SuggestedProduct) => void;
  suggestionsTitle?: string;
  variant?: 'default' | 'compare';
  scanTarget?: ProductCodeScanTarget;
}

export function ProductCodeFieldWithSuggestions({
  label,
  hint,
  placeholder,
  value,
  onChange,
  onSelectSuggestion,
  suggestionsTitle = 'Bunlar olabilir',
  variant = 'default',
  scanTarget,
}: ProductCodeFieldWithSuggestionsProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const isCompare = variant === 'compare';

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

  const handleClear = () => {
    setSuggestionsDismissed(false);
    onChange('');
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
  const showClearButton = isCompare && value.length > 0;

  return (
    <View style={isCompare ? styles.compareField : styles.field}>
      <View style={isCompare ? styles.compareFieldHeader : styles.fieldHeader}>
        <Text style={isCompare ? styles.compareLabel : styles.label}>{label}</Text>
        {hint ? (
          <Text style={isCompare ? styles.compareHint : styles.hint}>{hint}</Text>
        ) : null}
      </View>

      {isCompare ? (
        <View style={styles.compareInputRow}>
          <View style={styles.compareInputWrapper}>
            <TextInput
              style={[styles.compareInput, showClearButton && styles.compareInputWithClear]}
              placeholder={placeholder}
              placeholderTextColor={homeColors.textDim}
              value={value}
              onChangeText={handleChangeText}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              selectionColor={homeColors.accent}
              underlineColorAndroid="transparent"
            />
            {showClearButton ? (
              <Pressable
                style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Temizle"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={homeColors.textMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={styles.cameraButton}
            onPress={() => {
              if (scanTarget) {
                openProductCodeScan(scanTarget);
              }
            }}
            disabled={!scanTarget}
            accessibilityRole="button"
            accessibilityLabel="Etiket oku"
          >
            <Ionicons name="camera-outline" size={22} color={homeColors.textMuted} />
          </Pressable>
        </View>
      ) : (
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
      )}

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

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    field: {
      gap: spacing.md,
    },
    compareField: {
      gap: 10,
      marginBottom: 12,
    },
    fieldHeader: {
      gap: spacing.xs,
    },
    compareFieldHeader: {
      gap: 0,
    },
    label: {
      ...typography.h3,
      color: colors.surface.text,
    },
    compareLabel: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    hint: {
      ...typography.bodySm,
      color: colors.surface.textMuted,
    },
    compareHint: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 10,
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
    compareInputRow: {
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: 8,
    },
    compareInputWrapper: {
      flex: 1,
      justifyContent: 'center',
      position: 'relative',
    },
    compareInput: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      color: c.textPrimary,
      flex: 1,
      fontFamily: homeMonoFont,
      fontSize: 15,
      letterSpacing: 0.3,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 13 : 11,
      width: '100%',
    },
    compareInputWithClear: {
      paddingRight: 38,
    },
    clearButton: {
      alignItems: 'center',
      bottom: 0,
      justifyContent: 'center',
      position: 'absolute',
      right: 10,
      top: 0,
      width: 28,
    },
    clearButtonPressed: {
      opacity: 0.7,
    },
    cameraButton: {
      alignItems: 'center',
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      justifyContent: 'center',
      minHeight: 48,
      minWidth: 48,
      paddingHorizontal: 12,
    },
  });
