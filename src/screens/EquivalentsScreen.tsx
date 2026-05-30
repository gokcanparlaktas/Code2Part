import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EquivalentAccordionCard } from '@/components/EquivalentAccordionCard';
import { EquivalencePageScoreNote } from '@/components/EquivalencePageScoreNote';
import { SourceProductSummary } from '@/components/SourceProductSummary';
import { EQUIVALENCE_PAGE_SCORE_NOTE_TR } from '@/domain/presentation/formatCompatibilityMetadata';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { filterVisibleEquivalentResults } from '@/domain/resolver/filterVisibleEquivalentResults';
import { useBackendCompareLoader } from '@/hooks/useBackendCompareLoader';
import { useResolvedProductSearch } from '@/hooks/useResolvedProductSearch';
import { isBackendResolverMode } from '@/services/resolverService';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';
import {
  compatibilityResultKey,
  mergeCompatibilityResultDisplay,
} from '@/utils/compatibilityResultKey';
import { decodeProductCodeFromRoute } from '@/utils/productCodeRouteParam';

function EquivalentsScreen() {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = decodeProductCodeFromRoute(code);
  const { loading, errorMessage, data } = useResolvedProductSearch(inputCode);
  const {
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
        <ActivityIndicator size="large" color={homeColors.accent} />
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
        <EquivalencePageScoreNote note={EQUIVALENCE_PAGE_SCORE_NOTE_TR} />
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
        <>
          <Text style={styles.listTitle}>Muadil adaylar</Text>
          <View style={styles.accordionList}>
            {limited.visible.map((result, index) => {
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
                  isLast={index === limited.visible.length - 1}
                  onToggle={() =>
                    setExpandedKey((current) => (current === rowKey ? null : rowKey))
                  }
                />
              );
            })}
          </View>

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
        </>
      )}
    </ScrollView>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    scroll: {
      backgroundColor: c.bg,
      flex: 1,
    },
    content: {
      gap: 12,
      paddingBottom: 32,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    listTitle: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    accordionList: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      overflow: 'hidden',
      paddingHorizontal: 12,
    },
    limitedFooter: {
      gap: 8,
      paddingTop: 4,
    },
    limitedHint: {
      color: c.textDim,
      fontSize: 12,
      textAlign: 'center',
    },
    allButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 14,
    },
    allButtonPressed: {
      opacity: 0.88,
    },
    allButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
    emptyCard: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      padding: 16,
    },
    emptyText: {
      color: c.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
    compareErrorCard: {
      backgroundColor: c.redBg,
      borderColor: c.redBorder,
      borderLeftWidth: 3,
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
    },
    compareErrorText: {
      color: c.red,
      fontSize: 13,
      lineHeight: 18,
    },
    centered: {
      backgroundColor: c.bg,
      flex: 1,
      gap: 12,
      justifyContent: 'center',
      padding: 24,
    },
    loadingText: {
      color: c.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
    errorTitle: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    errorMessage: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  });

export default EquivalentsScreen;
