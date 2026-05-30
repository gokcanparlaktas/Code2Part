import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CompatibilityWarningsList } from '@/components/CompatibilityWarningsList';
import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { collectEquivalencePageWarnings } from '@/domain/presentation/collectEquivalencePageWarnings';
import { ReliabilityNote } from '@/components/ReliabilityNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { useBackendCompareLoader } from '@/hooks/useBackendCompareLoader';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import { isBackendResolverMode } from '@/services/resolverService';
import { isEquivalenceMappingUnverified } from '@/utils/catalogReliability';
import {
  compatibilityResultKey,
  mergeCompatibilityResultDisplay,
} from '@/utils/compatibilityResultKey';
import { decodeProductCodeFromRoute } from '@/utils/productCodeRouteParam';

export default function AllAlternativesScreen() {
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

  const pageWarnings = useMemo(
    () => collectEquivalencePageWarnings(compatibilityResults),
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
        <Text style={styles.loadingText}>Alternatifler yükleniyor…</Text>
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
      <Text style={styles.pageSubtitle}>
        {compatibilityResults.length} alternatif bulundu.
      </Text>

      <SourceProductSummary identification={identification} />

      {isEquivalenceMappingUnverified(identification.seriesId) ? (
        <ReliabilityNote message="Bu muadil eşleştirme manuel eklenmiştir, sipariş öncesi teknik doğrulama önerilir." />
      ) : null}

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
          {compatibilityResults.map((result) => {
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
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
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
