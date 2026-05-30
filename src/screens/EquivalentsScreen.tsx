import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { filterVisibleEquivalentResults } from '@/domain/resolver/filterVisibleEquivalentResults';
import { useBackendCompareLoader } from '@/hooks/useBackendCompareLoader';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import { isBackendResolverMode } from '@/services/resolverService';
import {
  compatibilityResultKey,
  mergeCompatibilityResultDisplay,
} from '@/utils/compatibilityResultKey';
import { decodeProductCodeFromRoute } from '@/utils/productCodeRouteParam';

function EquivalentsScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = decodeProductCodeFromRoute(code);
  const { loading, errorMessage, data } = useResolvedProductSearch(inputCode);
  const {
    loadingKey,
    errorMessage: compareErrorMessage,
    loadCompare,
    resolveDisplayResult,
    candidateCodeForResult,
  } = useBackendCompareLoader(inputCode);

  const { identification, compatibilityResults, isResolvable } = useMemo(() => {
    if (!data) {
      return {
        identification: null,
        compatibilityResults: [],
        isResolvable: false,
      };
    }

    const ok = data.identification.outcome === 'full';
    const results = ok ? sortCompatibilityResultsByMatchPercentage(data.compatibilityResults) : [];
    return {
      identification: data.identification,
      compatibilityResults: results,
      isResolvable: ok,
    };
  }, [data]);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const limited = useMemo(
    () => filterVisibleEquivalentResults(compatibilityResults),
    [compatibilityResults],
  );

  useEffect(() => {
    if (!expandedKey || !isBackendResolverMode()) {
      return;
    }

    const preview = compatibilityResults.find(
      (result) => compatibilityResultKey(result) === expandedKey
    );
    if (!preview) {
      return;
    }

    const candidateCode = candidateCodeForResult(preview);
    if (!candidateCode) {
      return;
    }

    void loadCompare(candidateCode, expandedKey);
  }, [expandedKey, compatibilityResults, candidateCodeForResult, loadCompare]);

  if (!inputCode) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Ürün kodu tekrar çözümlenemedi.</Text>
        <Text style={styles.errorMessage}>
          Arama ekranına dönüp tekrar deneyebilirsiniz.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text style={styles.loadingText}>Muadil adaylar yükleniyor…</Text>
      </View>
    );
  }

  if (errorMessage || !identification) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Sonuç alınamadı</Text>
        <Text style={styles.errorMessage}>{errorMessage ?? 'Bilinmeyen hata'}</Text>
      </View>
    );
  }

  if (!isResolvable) {
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
      <SourceProductSummary identification={identification} />

      {compareErrorMessage ? (
        <View style={styles.compareErrorCard}>
          <Text style={styles.compareErrorText}>{compareErrorMessage}</Text>
        </View>
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
            const displayResult = mergeCompatibilityResultDisplay(
              result,
              resolveDisplayResult(result, rowKey)
            );
            return (
              <EquivalentAccordionCard
                key={rowKey}
                result={displayResult}
                expanded={expandedKey === rowKey}
                loading={loadingKey === rowKey}
                onToggle={() =>
                  setExpandedKey((current) => (current === rowKey ? null : rowKey))
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
  compareErrorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  compareErrorText: {
    color: '#991B1B',
    fontSize: 14,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
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
