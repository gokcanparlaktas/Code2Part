import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { PartialSuggestionsPanel } from '@/components/PartialSuggestionsPanel';
import { UnresolvedResultCard } from '@/components/UnresolvedResultCard';
import { calculateProductReliability } from '@/domain/reliability/calculateProductReliability';
import { suggestProducts } from '@/domain/resolver/suggestProducts';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import {
  isUnresolvedSaved,
  recordSearch,
  saveUnresolvedSearch,
} from '@/services/localSearchStore';
import { colors, radius, spacing, typography, buttons } from '@/theme';
import {
  decodeProductCodeFromRoute,
  productCodeEquivalentsHref,
  productCodeResultHref,
} from '@/utils/productCodeRouteParam';
import type { SuggestedProduct } from '@/types/suggestion';

export default function ResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = decodeProductCodeFromRoute(code);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const { loading, errorMessage, data } = useResolvedProductSearch(inputCode);

  const { identification, hasEquivalents, isUnresolved, suggestions, productDetailRows } =
    useMemo(() => {
      if (!data) {
        return {
          identification: null,
          hasEquivalents: false,
          isUnresolved: false,
          suggestions: [],
          productDetailRows: [],
        };
      }

      const unresolved =
        data.identification.outcome === 'not_found' ||
        data.identification.outcome === 'series_only';
      const partialSuggestions = unresolved ? suggestProducts(inputCode) : [];

      return {
        identification: data.identification,
        hasEquivalents: data.hasEquivalents,
        isUnresolved: unresolved,
        suggestions: partialSuggestions,
        productDetailRows: data.productDetailRows,
      };
    }, [data, inputCode]);

  useEffect(() => {
    if (!inputCode || !identification) {
      return;
    }

    void recordSearch(identification);

    if (isUnresolved) {
      void isUnresolvedSaved(identification.normalizedCode).then(setAlreadySaved);
    }
  }, [inputCode, identification, isUnresolved]);

  const reliability = useMemo(
    () => (identification ? calculateProductReliability(identification) : null),
    [identification]
  );

  const openEquivalents = () => {
    router.push(productCodeEquivalentsHref(inputCode));
  };

  const handleSaveUnresolved = async () => {
    if (!identification) {
      return;
    }
    await saveUnresolvedSearch(
      identification.inputCode,
      identification.normalizedCode
    );
    setAlreadySaved(true);
  };

  const handleTrySuggestion = (suggestion: SuggestedProduct) => {
    const targetCode = suggestion.exampleCodeFormat?.trim();
    if (!targetCode) {
      return;
    }
    router.push(productCodeResultHref(targetCode));
  };

  if (!inputCode) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.emptyTitle}>Ürün kodu girilmedi</Text>
        <Text style={styles.emptyText}>
          Ana ekrandan bir ürün kodu yazıp aramayı tekrar deneyin.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Ana ekrana dön</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={colors.navy[700]} />
        <Text style={styles.loadingText}>Ürün kodu çözümleniyor…</Text>
      </View>
    );
  }

  if (errorMessage || !identification || !reliability) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.errorTitle}>Sonuç alınamadı</Text>
        <Text style={styles.emptyText}>{errorMessage ?? 'Bilinmeyen hata'}</Text>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Ana ekrana dön</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {isUnresolved ? (
        <>
          {suggestions.length > 0 ? (
            <>
              <Text style={styles.partialIntro}>
                Tam ürün kodu tanınamadı; aşağıdaki seriler olası görünüyor. Kesin eşleşme
                değildir — tam kodu veya marka/seri bilgisini deneyin.
              </Text>
              <PartialSuggestionsPanel
                title="Olası seriler"
                query={inputCode}
                suggestions={suggestions}
                onTrySuggestion={handleTrySuggestion}
              />
            </>
          ) : null}
          <UnresolvedResultCard
            originalInput={identification.inputCode}
            normalizedCode={identification.normalizedCode}
            brand={identification.brand.value}
            series={identification.series.value}
            initiallySaved={alreadySaved}
            hasPartialSuggestions={suggestions.length > 0}
            onSave={handleSaveUnresolved}
          />
        </>
      ) : (
        <>
          <ProductCard
            identification={identification}
            noticeText={reliability.seriesOnlyNoticeTr}
            detailRows={productDetailRows}
          />

          {hasEquivalents ? (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={openEquivalents}
            >
              <Text style={styles.primaryButtonText}>Muadilleri Gör</Text>
            </Pressable>
          ) : (
            <View style={styles.noEquivalentsCard}>
              <Text style={styles.noEquivalentsText}>
                Bu ürün için henüz muadil aday eklenmemiş.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.inverseMuted,
  },
  partialIntro: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '600',
  },
  primaryButton: {
    ...buttons.primary,
  },
  buttonPressed: buttons.primaryPressed,
  primaryButtonText: buttons.primaryTextLg,
  noEquivalentsCard: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  noEquivalentsText: {
    ...typography.body,
    color: colors.surface.textMuted,
    textAlign: 'center',
  },
  emptyTitle: {
    ...typography.h1,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h1,
    color: colors.status.danger.text,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.inverseMuted,
    textAlign: 'center',
  },
  backButton: {
    ...buttons.primaryCompact,
    marginTop: spacing.sm,
  },
  backButtonText: buttons.primaryText,
});
