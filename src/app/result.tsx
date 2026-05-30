import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ConfidenceBadge } from '@/components/ConfidenceBadge';
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
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';
import type { ProductIdentification } from '@/types/product';
import {
  decodeProductCodeFromRoute,
  productCodeEquivalentsHref,
  productCodeResultHref,
} from '@/utils/productCodeRouteParam';
import type { SuggestedProduct } from '@/types/suggestion';

function ResultHeaderBadge({ identification }: { identification: ProductIdentification }) {
  if (identification.outcome === 'full') {
    return <ConfidenceBadge confidence="high" label="Tam eşleşme" variant="dark" />;
  }
  return <ConfidenceBadge confidence={identification.confidence} variant="dark" />;
}

export default function ResultScreen() {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
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

  const headerOptions = useMemo(() => {
    if (!identification || isUnresolved) {
      return {
        title: 'Sonuç',
        headerRight: undefined,
      };
    }

    return {
      title: 'Sonuç',
      headerRight: () => (
        <View style={styles.headerBadgeWrap}>
          <ResultHeaderBadge identification={identification} />
        </View>
      ),
    };
  }, [identification, isUnresolved]);

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

  const renderState = (content: ReactNode) => (
    <View style={styles.stateContainer}>{content}</View>
  );

  let body: ReactNode;

  if (!inputCode) {
    body = renderState(
      <>
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
      </>
    );
  } else if (loading) {
    body = renderState(
      <>
        <ActivityIndicator size="large" color={homeColors.accent} />
        <Text style={styles.loadingText}>Ürün kodu çözümleniyor…</Text>
      </>
    );
  } else if (errorMessage || !identification || !reliability) {
    body = renderState(
      <>
        <Text style={styles.errorTitle}>Sonuç alınamadı</Text>
        <Text style={styles.emptyText}>{errorMessage ?? 'Bilinmeyen hata'}</Text>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Ana ekrana dön</Text>
        </Pressable>
      </>
    );
  } else {
    body = (
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
            <Text style={styles.pageTitle}>Tanımlanan ürün</Text>
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
                <Text style={styles.primaryButtonText}>Muadilleri gör</Text>
              </Pressable>
            ) : (
              <Text style={styles.noEquivalentsText}>
                Bu ürün için henüz muadil aday eklenmemiş.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.safe}>
      <Stack.Screen options={headerOptions} />
      {body}
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    safe: {
      backgroundColor: c.bg,
    flex: 1,
  },
  headerBadgeWrap: {
    marginRight: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  pageTitle: {
    color: c.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: c.textMuted,
    fontSize: 14,
  },
  partialIntro: {
    color: c.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: c.accent,
    borderRadius: 8,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  noEquivalentsText: {
    color: c.textDim,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    color: c.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorTitle: {
    color: c.red,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: c.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: c.accent,
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
