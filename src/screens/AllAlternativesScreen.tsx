import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { ReliabilityNote } from '@/components/ReliabilityNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { isEquivalenceMappingUnverified } from '@/utils/catalogReliability';
import { decodeProductCodeFromRoute } from '@/utils/productCodeRouteParam';

function compatibilityResultKey(result: {
  candidate: { suggestedCode: string | null; seriesId: string; targetIdentification: any | null };
}): string {
  const fromId = result.candidate.targetIdentification?.normalizedCode;
  if (typeof fromId === 'string' && fromId.trim()) {
    return fromId;
  }
  const fromSuggested = result.candidate.suggestedCode?.trim();
  if (fromSuggested) {
    return normalizeCode(fromSuggested);
  }
  return result.candidate.seriesId;
}

export default function AllAlternativesScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = decodeProductCodeFromRoute(code);

  const { identification, compatibilityResults, isResolvable } = useMemo(() => {
    const resolved = resolveProductSearch(inputCode);
    const ok = resolved.identification.outcome === 'full';
    const results = ok ? resolved.compatibilityResults : [];
    return {
      identification: resolved.identification,
      compatibilityResults: sortCompatibilityResultsByMatchPercentage(results),
      isResolvable: ok,
    };
  }, [inputCode]);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (!inputCode || !isResolvable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Ürün kodu tekrar çözümlenemedi.</Text>
        <Text style={styles.errorMessage}>
          Arama ekranına dönüp tekrar deneyebilirsiniz.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageSubtitle}>
        {compatibilityResults.length} alternatif bulundu.
      </Text>

      <SourceProductSummary identification={identification} />

      {isEquivalenceMappingUnverified(identification.seriesId) ? (
        <ReliabilityNote message="Bu muadil eşleştirme manuel eklenmiştir, sipariş öncesi teknik doğrulama önerilir." />
      ) : null}

      {compatibilityResults.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Bu ürün için henüz muadil aday eklenmemiş.
          </Text>
        </View>
      ) : (
        <View style={styles.accordionList}>
          {compatibilityResults.map((result) => {
            const rowKey = compatibilityResultKey(result);
            return (
              <EquivalentAccordionCard
                key={rowKey}
                result={result}
                expanded={expandedKey === rowKey}
                onToggle={() =>
                  setExpandedKey((current) => (current === rowKey ? null : rowKey))
                }
              />
            );
          })}
        </View>
      )}

      <DemoDisclaimerNote compact />
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
  pageSubtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
  },
  accordionList: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  emptyText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

