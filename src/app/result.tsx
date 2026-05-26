import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EvidenceDetails } from '@/components/EvidenceDetails';
import { LowConfidenceWarningCard } from '@/components/LowConfidenceWarningCard';
import { ProductCard } from '@/components/ProductCard';
import { ReliabilityNote } from '@/components/ReliabilityNote';
import { PartialSuggestionsPanel } from '@/components/PartialSuggestionsPanel';
import { UnresolvedResultCard } from '@/components/UnresolvedResultCard';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { suggestProducts } from '@/domain/resolver/suggestProducts';
import {
  isUnresolvedSaved,
  recordSearch,
  saveUnresolvedSearch,
} from '@/services/localSearchStore';
import { isLowConfidence } from '@/utils/confidenceScore';
import { isSeriesDataUnverified } from '@/utils/catalogReliability';

export default function ResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = typeof code === 'string' ? code : '';
  const [alreadySaved, setAlreadySaved] = useState(false);

  const { identification, hasEquivalents, isUnresolved, suggestions } = useMemo(() => {
    const resolved = resolveProductSearch(inputCode);
    const unresolved =
      resolved.identification.outcome === 'not_found' ||
      resolved.identification.outcome === 'series_only';
    const partialSuggestions = unresolved ? suggestProducts(inputCode) : [];

    return {
      identification: resolved.identification,
      hasEquivalents: resolved.hasEquivalents,
      isUnresolved: unresolved,
      suggestions: partialSuggestions,
    };
  }, [inputCode]);

  useEffect(() => {
    if (!inputCode) {
      return;
    }

    void recordSearch(identification);

    if (isUnresolved) {
      void isUnresolvedSaved(identification.normalizedCode).then(setAlreadySaved);
    }
  }, [inputCode, identification, isUnresolved]);

  const showLowConfidence =
    !isUnresolved && isLowConfidence(identification.confidence);
  const showSeriesReliabilityNote =
    !isUnresolved && isSeriesDataUnverified(identification.seriesId);

  const openEquivalents = () => {
    router.push({
      pathname: '/equivalents',
      params: { code: inputCode },
    });
  };

  const handleSaveUnresolved = async () => {
    await saveUnresolvedSearch(
      identification.inputCode,
      identification.normalizedCode
    );
    setAlreadySaved(true);
  };

  if (!inputCode) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sorgulanacak ürün kodu bulunamadı.</Text>
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
                Tam ürün kodu tanınamadı, ancak aşağıdaki seriler olası görünüyor.
              </Text>
              <PartialSuggestionsPanel
                title="Olası seriler"
                query={inputCode}
                suggestions={suggestions}
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
          {showLowConfidence ? <LowConfidenceWarningCard /> : null}

          <ProductCard identification={identification} />

          {showSeriesReliabilityNote ? (
            <ReliabilityNote message="Bu seri bilgisi henüz katalog kaynağıyla doğrulanmamış olabilir." />
          ) : null}

          {identification.outcome === 'full' ? (
            <EvidenceDetails identification={identification} />
          ) : null}

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
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  partialIntro: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  noEquivalentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  noEquivalentsText: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
});
