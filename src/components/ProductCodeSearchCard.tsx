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

import { AppLogo } from '@/components/AppLogo';
import { HowItWorksHelp } from '@/components/HowItWorksHelp';
import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';
import type { SuggestedProduct } from '@/types/suggestion';
import { colors, radius, spacing, typography, buttons } from '@/theme';
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

  return (
    <View style={styles.card}>
      <View style={styles.brandHeader}>
        <View style={styles.brandHeaderRow}>
          <View style={styles.brandLogoArea}>
            <AppLogo size="lg" />
          </View>
          <HowItWorksHelp />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.fieldHeader}>
          <Text style={styles.label}>Ürün kodu</Text>
          <Text style={styles.hint}>
            Festo, SMC, Parker, Rexroth, Eaton ve benzeri kodları girin
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Örn. DSBC-50-100-PPVA-N3"
          placeholderTextColor={colors.text.inverseFaint}
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setStrokeHint(false);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          selectionColor={colors.accent.blue}
          underlineColorAndroid={colors.accent.blueDark}
        />

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
            !code.trim() && styles.buttonDisabled,
            pressed && code.trim() ? styles.buttonPressed : null,
          ]}
          onPress={handleSearch}
          disabled={!code.trim() || isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <Text style={styles.buttonText}>Tanımla ve karşılaştır</Text>
          )}
        </Pressable>

        <Link href="/history" asChild>
          <Pressable
            style={({ pressed }) => [styles.historyLink, pressed && styles.historyLinkPressed]}
          >
            <Text style={styles.historyLinkText}>Son Aramalar</Text>
          </Pressable>
        </Link>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Hızlı örnekler</Text>
          <View style={styles.examplesRow}>
            {EXAMPLES.map((example) => (
              <Pressable
                key={example}
                style={({ pressed }) => [styles.exampleChip, pressed && styles.exampleChipPressed]}
                onPress={() => setCode(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  brandHeader: {
    backgroundColor: colors.background.navy,
    borderBottomColor: colors.border.default,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  brandHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandLogoArea: {
    flex: 1,
    paddingRight: spacing.md,
  },
  body: {
    backgroundColor: colors.background.card,
    gap: spacing.md,
    padding: spacing.xl,
  },
  fieldHeader: {
    gap: spacing.xs,
  },
  label: {
    ...typography.h2,
    color: colors.text.inverse,
  },
  hint: {
    ...typography.bodySm,
    color: colors.text.inverseMuted,
  },
  strokeHint: {
    ...typography.bodySm,
    color: colors.accent.blueLight,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background.input,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.inverse,
    fontSize: 17,
    fontWeight: '600',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  button: {
    ...buttons.primary,
    marginTop: spacing.xs,
  },
  buttonDisabled: buttons.primaryDisabled,
  buttonPressed: buttons.primaryPressed,
  buttonText: buttons.primaryText,
  historyLink: {
    alignSelf: 'flex-start',
    borderColor: colors.border.default,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyLinkPressed: {
    backgroundColor: colors.background.elevated,
  },
  historyLinkText: {
    color: colors.text.inverseMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  examplesSection: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
  examplesTitle: {
    ...typography.sectionTitle,
    color: colors.text.inverseFaint,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exampleChip: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  exampleChipPressed: {
    backgroundColor: colors.navy[600],
    borderColor: colors.border.strong,
  },
  exampleText: {
    ...typography.caption,
    color: colors.text.inverseMuted,
    fontWeight: '600',
  },
});
