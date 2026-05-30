import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CompatibilityWarningsList } from '@/components/CompatibilityWarningsList';
import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { collectEquivalencePageWarnings } from '@/domain/presentation/collectEquivalencePageWarnings';
import { ReliabilityNote } from '@/components/ReliabilityNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { filterVisibleEquivalentResults } from '@/domain/resolver/filterVisibleEquivalentResults';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
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

function EquivalentsScreen() {
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
  const limited = useMemo(
    () => filterVisibleEquivalentResults(compatibilityResults),
    [compatibilityResults],
  );

  const pageWarnings = useMemo(
    () => collectEquivalencePageWarnings(compatibilityResults),
    [compatibilityResults],
  );

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
        Bu ürüne benzer kullanılabilecek seri adayları. Liste teknik onay yerine geçmez;
        kontrol edilmesi gereken alanlar kart içinde gösterilir.
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
          {limited.visible.map((result) => {
            const rowKey = compatibilityResultKey(result);
            return (
            <EquivalentAccordionCard
              key={rowKey}
              result={result}
              expanded={expandedKey === rowKey}
              onToggle={() =>
                setExpandedKey((current) =>
                  current === rowKey
                    ? null
                    : rowKey
                )
              }
            />
            );
          })}
          {limited.isLimited ? (
            <View style={styles.limitedFooter}>
              <Text style={styles.limitedHint}>
                Düşük uyumlu alternatifler gizlendi.
              </Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/all-alternatives',
                    params: { code: inputCode },
                  })
                }
                style={({ pressed }) => [
                  styles.allButton,
                  pressed && styles.allButtonPressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.allButtonText}>
                  Tüm alternatifleri gör ({limited.totalCount})
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <CompatibilityWarningsList warnings={pageWarnings} />

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
  limitedFooter: {
    gap: 10,
    paddingTop: 6,
  },
  limitedHint: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  allButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  allButtonPressed: {
    opacity: 0.9,
  },
  allButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
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
