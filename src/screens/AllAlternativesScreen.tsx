import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { EquivalencePageScoreNote } from '@/components/EquivalencePageScoreNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { collectEquivalencePageLegacyScoreFootnote } from '@/domain/presentation/collectEquivalencePageAlerts';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { useBackendCompareLoader } from '@/hooks/useBackendCompareLoader';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import { isBackendResolverMode } from '@/services/resolverService';
import { colors, radius, spacing, typography } from '@/theme';
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

  const legacyScoreFootnote = useMemo(() => {
    const displayed = compatibilityResults.map((result) => {
      const rowKey = compatibilityResultKey(result);
      return mergeCompatibilityResultDisplay(result, resolveDisplayResult(result, rowKey));
    });
    return collectEquivalencePageLegacyScoreFootnote(displayed);
  }, [compatibilityResults, resolveDisplayResult]);

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
        <ActivityIndicator size="large" color={colors.navy[700]} />
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
      <SourceProductSummary identification={identification} />

      {compatibilityResults.length > 0 ? (
        <EquivalencePageScoreNote note={legacyScoreFootnote} />
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
  accordionList: {
    gap: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.surface.textMuted,
  },
  compareErrorCard: {
    backgroundColor: colors.status.danger.bg,
    borderColor: colors.status.danger.border,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  compareErrorText: {
    ...typography.bodySm,
    color: colors.status.danger.text,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.inverseMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h1,
    color: colors.text.inverse,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.inverseMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
});
