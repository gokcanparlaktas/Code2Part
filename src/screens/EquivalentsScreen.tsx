import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

function EquivalentsScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = typeof code === 'string' ? code : '';

  const { identification, compatibilityResults, isResolvable } = useMemo(() => {
    const resolved = resolveProductSearch(inputCode);
    const ok = resolved.identification.outcome === 'full';
    return {
      identification: resolved.identification,
      compatibilityResults: ok ? resolved.compatibilityResults : [],
      isResolvable: ok,
    };
  }, [inputCode]);

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);

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
        Bu ürüne benzer kullanılabilecek seri adayları
      </Text>

      <SourceProductSummary identification={identification} />

      {compatibilityResults.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Bu ürün için henüz muadil aday eklenmemiş.
          </Text>
        </View>
      ) : (
        <View style={styles.accordionList}>
          {compatibilityResults.map((result) => (
            <EquivalentAccordionCard
              key={result.candidate.seriesId}
              result={result}
              expanded={expandedSeriesId === result.candidate.seriesId}
              onToggle={() =>
                setExpandedSeriesId((current) =>
                  current === result.candidate.seriesId
                    ? null
                    : result.candidate.seriesId
                )
              }
            />
          ))}
        </View>
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
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#9A3412',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default EquivalentsScreen;
