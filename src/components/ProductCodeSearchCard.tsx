import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';
import type { SuggestedProduct } from '@/types/suggestion';

import { productCodeResultHref } from '@/utils/productCodeRouteParam';

import { PartialSuggestionsPanel } from './PartialSuggestionsPanel';

const EXAMPLES = [
  '4WE6G-6X/EG24N9K4',
  'DG4V-3-2A-M-U-D24-60',
  'DSBC-63-200-PPVA',
  'C96-40-80',
  'SI-63-150',
  'DSG-01-3C2-D24-N1-50',
];

export function ProductCodeSearchCard() {
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

  const handleSelectSuggestion = (suggestion: SuggestedProduct) => {
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

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ürün kodu</Text>
      <Text style={styles.hint}>
        Festo, SMC, Parker, Aventics, AirTAC ve benzeri kodları buraya yazın
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Örn. DSBC-50-100-PPVA-N3"
        placeholderTextColor="#64748B"
        value={code}
        onChangeText={(value) => {
          setCode(value);
          setStrokeHint(false);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
        selectionColor="#1E40AF"
        underlineColorAndroid="#1E40AF"
      />

      {suggestions.length > 0 ? (
        <PartialSuggestionsPanel
          title="Bunlar olabilir"
          query={code}
          suggestions={suggestions}
          hasMoreResults={hasMoreResults}
          onSelectSuggestion={handleSelectSuggestion}
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
          !code.trim() && styles.buttonDisabled,
          pressed && code.trim() ? styles.buttonPressed : null,
        ]}
        onPress={handleSearch}
        disabled={!code.trim() || isSearching}
      >
        {isSearching ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Tanımla ve karşılaştır</Text>
        )}
      </Pressable>

      <Link href="/history" asChild>
        <Pressable style={({ pressed }) => [styles.historyLink, pressed && styles.historyLinkPressed]}>
          <Text style={styles.historyLinkText}>Son Aramalar</Text>
        </Pressable>
      </Link>

      <Text style={styles.examplesTitle}>Hızlı örnekler</Text>
      <View style={styles.examplesRow}>
        {EXAMPLES.map((example) => (
          <Pressable
            key={example}
            style={styles.exampleChip}
            onPress={() => setCode(example)}
          >
            <Text style={styles.exampleText}>{example}</Text>
          </Pressable>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  label: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  strokeHint: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1E40AF',
    borderRadius: 12,
    borderWidth: 2,
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '600',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 16,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#CBD5E1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  historyLinkPressed: {
    backgroundColor: '#F1F5F9',
  },
  historyLinkText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  examplesTitle: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
  },
});
