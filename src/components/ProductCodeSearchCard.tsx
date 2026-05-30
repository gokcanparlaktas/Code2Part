import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HowItWorksHelp } from '@/components/HowItWorksHelp';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';
import type { SuggestedProduct } from '@/types/suggestion';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import { productCodeResultHref } from '@/utils/productCodeRouteParam';

import { PartialSuggestionsPanel } from './PartialSuggestionsPanel';
import { RecentSearchHistoryPanel } from './RecentSearchHistoryPanel';

const ICON = require('../../assets/images/icon.png');

const EXAMPLES = [
  '4WE6G-6X/EG24N9K4',
  'DG4V-3-2A-M-U-D24-60',
  'DSBC-63-200-PPVA',
  'C96-40-80',
  'SI-63-150',
  'DSG-01-3C2-D24-N1-50',
];

export function ProductCodeSearchCard() {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const [code, setCode] = useState('');
  const [strokeHint, setStrokeHint] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const suggestionResult = useMemo(() => {
    const trimmed = code.trim();
    if (trimmed.length < 2) {
      return { suggestions: [], hasMoreResults: false };
    }
    return suggestProductsDetailed(trimmed, DEFAULT_SUGGESTION_LIMIT);
  }, [code]);

  const { suggestions, hasMoreResults } = suggestionResult;

  const handleTrySuggestion = (suggestion: SuggestedProduct) => {
    const hasBoreOnly =
      suggestion.detectedAttributes.boreMm !== undefined &&
      suggestion.missingFields.includes('stroke');

    if (hasBoreOnly) {
      setStrokeHint(true);
      if (suggestion.exampleCodeFormat) {
        setCode(suggestion.exampleCodeFormat);
      }
      return;
    }

    setStrokeHint(false);
    const targetCode = suggestion.exampleCodeFormat?.trim();
    if (!targetCode) {
      return;
    }
    setCode(targetCode);
    router.push({
      pathname: '/result',
      params: { code: targetCode },
    });
  };

  const handleSearch = () => {
    const trimmed = code.trim();
    if (!trimmed || isSearching) {
      return;
    }
    setIsSearching(true);
    router.push(productCodeResultHref(trimmed));
    setTimeout(() => setIsSearching(false), 400);
  };

  const handleClear = () => {
    setCode('');
    setStrokeHint(false);
  };

  const trimmedCode = code.trim();
  const showClearButton = code.length > 0;

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <View style={styles.headerSide}>
          <Image source={ICON} style={styles.logoIcon} accessibilityLabel="Code2Part logo" />
        </View>

        <Text style={styles.brandName}>
          <Text style={styles.brandNamePrimary}>Code</Text>
          <Text style={styles.brandNameBlue}>2</Text>
          <Text style={styles.brandNameOrange}>Part</Text>
        </Text>

        <View style={styles.headerSideRight}>
          <HowItWorksHelp compact />
          <ThemeModeToggle compact />
        </View>
      </View>

      <View style={styles.fieldHeader}>
        <Text style={styles.label}>Ürün kodu</Text>
        <Text style={styles.hint}>
          Aramak istediğiniz ürün kodunu giriniz; kod eksik olsa da tanımlama yapılabilir.
        </Text>
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, showClearButton && styles.inputWithClear]}
            placeholder="DSBC-50-100-PPVA-N3"
            placeholderTextColor={homeColors.textDim}
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setStrokeHint(false);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            selectionColor={homeColors.accent}
            underlineColorAndroid="transparent"
          />

          {showClearButton ? (
            <Pressable
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Aramayı temizle"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={homeColors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.cameraButton} onPress={() => {}}>
          <Ionicons name="camera-outline" size={22} color={homeColors.textMuted} />
        </Pressable>
      </View>

      {suggestions.length > 0 ? (
        <PartialSuggestionsPanel
          title="Bunlar olabilir"
          query={code}
          suggestions={suggestions}
          hasMoreResults={hasMoreResults}
          onTrySuggestion={handleTrySuggestion}
        />
      ) : null}

      {strokeHint ? (
        <Text style={styles.strokeHint}>
          Strok değerini de girerseniz ürün daha net tanımlanır.
        </Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.button,
          !trimmedCode && styles.buttonDisabled,
          pressed && trimmedCode ? styles.buttonPressed : null,
        ]}
        onPress={handleSearch}
        disabled={!trimmedCode || isSearching}
      >
        {isSearching ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Tanımla ve karşılaştır</Text>
        )}
      </Pressable>

      <RecentSearchHistoryPanel limit={3} showDivider />

      <View style={styles.examplesSection}>
        <Text style={styles.examplesTitle}>Hızlı örnekler</Text>
        <View style={styles.examplesRow}>
          {EXAMPLES.map((example) => {
            const isActive = trimmedCode === example;
            return (
              <Pressable
                key={example}
                style={({ pressed }) => [
                  styles.exampleChip,
                  isActive && styles.exampleChipActive,
                  pressed && styles.exampleChipPressed,
                ]}
                onPress={() => setCode(example)}
              >
                <Text style={[styles.exampleText, isActive && styles.exampleTextActive]}>
                  {example}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      gap: 16,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 20,
    },
    headerSide: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      width: 44,
    },
    headerSideRight: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'flex-end',
      minWidth: 96,
    },
    logoIcon: {
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      padding: 0,
      resizeMode: 'cover',
      width: 44,
    },
    brandName: {
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
    },
    brandNamePrimary: {
      color: c.headerTitle,
    },
    brandNameBlue: {
      color: c.brandAccentBlue,
    },
    brandNameOrange: {
      color: c.accent,
    },
    fieldHeader: {
      marginBottom: 12,
    },
    label: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    hint: {
      color: c.textDim,
      fontSize: 13,
      marginTop: 4,
    },
    inputRow: {
      alignItems: 'stretch',
      flexDirection: 'row',
      gap: 8,
    },
    inputWrapper: {
      flex: 1,
      justifyContent: 'center',
      position: 'relative',
    },
    input: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      color: c.textPrimary,
      fontFamily: homeMonoFont,
      fontSize: 15,
      letterSpacing: 0.3,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 13 : 11,
      width: '100%',
    },
    inputWithClear: {
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
    strokeHint: {
      color: c.textMuted,
      fontSize: 13,
      marginTop: 10,
    },
    button: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      marginTop: 10,
      paddingVertical: 14,
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonPressed: {
      opacity: 0.88,
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
    examplesSection: {
      gap: 10,
      marginTop: 18,
    },
    examplesTitle: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    examplesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    exampleChip: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 6,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    exampleChipActive: {
      borderColor: c.accent,
    },
    exampleChipPressed: {
      opacity: 0.85,
    },
    exampleText: {
      color: c.textDim,
      fontFamily: homeMonoFont,
      fontSize: 12,
      fontWeight: '500',
    },
    exampleTextActive: {
      color: c.accent,
    },
  });
