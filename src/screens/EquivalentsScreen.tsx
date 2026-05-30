import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { EquivalencePageScoreNote } from '@/components/EquivalencePageScoreNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { collectEquivalencePageLegacyScoreFootnote } from '@/domain/presentation/collectEquivalencePageAlerts';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { filterVisibleEquivalentResults } from '@/domain/resolver/filterVisibleEquivalentResults';
import { useBackendCompareLoader } from '@/hooks/useBackendCompareLoader';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import { isBackendResolverMode } from '@/services/resolverService';
import { colors, radius, spacing, typography, buttons } from '@/theme';
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

  const legacyScoreFootnote = useMemo(() => {
    const displayed = limited.visible.map((result) => {
      const rowKey = compatibilityResultKey(result);
      return mergeCompatibilityResultDisplay(result, resolveDisplayResult(result, rowKey));
    });
    return collectEquivalencePageLegacyScoreFootnote(displayed);
  }, [limited.visible, resolveDisplayResult]);

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
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  accordionList: {
    gap: spacing.md,
  },
  limitedFooter: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  limitedHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  allButton: {
    ...buttons.primary,
    paddingVertical: spacing.md,
  },
  allButtonPressed: buttons.primaryPressed,
  allButtonText: {
    ...buttons.primaryText,
    fontSize: 15,
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
    textAlign: 'center',
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
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.inverseMuted,
    textAlign: 'center',
  },
  errorTitle: {
    ...typography.h1,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.inverseMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default EquivalentsScreen;
