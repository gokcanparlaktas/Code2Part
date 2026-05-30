import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCodeFieldWithSuggestions } from '@/components/ProductCodeFieldWithSuggestions';
import { ProductCompareResultView } from '@/components/ProductCompareResultView';
import { ThemeModeToggle } from '@/components/ThemeModeToggle';
import { usePendingProductCodeScan } from '@/hooks/usePendingProductCodeScan';
import type { CompatibilityResult } from '@/types/compatibility';
import {
  compareTwoProductsResolved,
  mapResolverApiErrorMessage,
} from '@/services/resolverService';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

const ICON = require('../../assets/images/icon.png');

export function CompareProductsScreen() {
  const styles = useHomeStyles(createStyles);
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [comparedSource, setComparedSource] = useState('');
  const [comparedTarget, setComparedTarget] = useState('');

  usePendingProductCodeScan('compare-source', useCallback((code) => setSourceCode(code), []));
  usePendingProductCodeScan('compare-target', useCallback((code) => setTargetCode(code), []));

  const canCompare =
    sourceCode.trim().length > 0 && targetCode.trim().length > 0 && !loading;

  const handleCompare = async () => {
    const source = sourceCode.trim();
    const target = targetCode.trim();
    if (!source || !target || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const comparison = await compareTwoProductsResolved(source, target);
      setComparedSource(source);
      setComparedTarget(target);
      setResult(comparison);
    } catch (compareError) {
      setError(mapResolverApiErrorMessage(compareError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.root}>
          <View style={styles.headerRow}>
            <View style={styles.headerSide}>
              <Image source={ICON} style={styles.logoIcon} accessibilityLabel="Code2Part logo" />
            </View>
            <Text style={styles.brandName}>
              <Text style={styles.brandNamePrimary}>Code</Text>
              <Text style={styles.brandNameBlue}>2</Text>
              <Text style={styles.brandNameOrange}>Part</Text>
            </Text>
            <View style={styles.headerSideRight}>
              <ThemeModeToggle compact />
            </View>
          </View>

          <Text style={styles.description}>
            İki ürün kodunu girin; uyum yüzdesi ve farklı alanları birlikte görün.
          </Text>

          <ProductCodeFieldWithSuggestions
            variant="compare"
            label="Kaynak ürün kodu"
            hint="Referans alınan ürün"
            placeholder="DSBC-63-200-PPVA"
            value={sourceCode}
            onChange={setSourceCode}
            onSelectSuggestion={() => {}}
            suggestionsTitle="Kaynak için öneriler"
            scanTarget="compare-source"
          />

          <ProductCodeFieldWithSuggestions
            variant="compare"
            label="Hedef ürün kodu"
            hint="Muadil veya alternatif ürün"
            placeholder="C96-40-80"
            value={targetCode}
            onChange={setTargetCode}
            onSelectSuggestion={() => {}}
            suggestionsTitle="Hedef için öneriler"
            scanTarget="compare-target"
          />

          <Pressable
            style={({ pressed }) => [
              styles.compareButton,
              !canCompare && styles.compareButtonDisabled,
              pressed && canCompare ? styles.compareButtonPressed : null,
            ]}
            onPress={() => void handleCompare()}
            disabled={!canCompare}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.compareButtonText}>Karşılaştır</Text>
            )}
          </Pressable>

          <View style={styles.footerNoteWrap}>
            <View style={styles.divider} />
            <Text style={styles.footerNote}>Her iki kod da tanımlanabilir olmalıdır</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {result ? (
            <ProductCompareResultView
              sourceCode={comparedSource}
              targetCode={comparedTarget}
              result={result}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    root: {
      flex: 1,
      gap: 16,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: 16,
    },
    headerSide: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 44,
    },
    headerSideRight: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      minWidth: 44,
      width: 44,
    },
    logoIcon: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 10,
      borderWidth: 1,
      height: 44,
      resizeMode: 'cover',
      width: 44,
    },
    brandName: {
      flex: 1,
      fontSize: 20,
      fontWeight: '500',
      textAlign: 'center',
    },
    brandNamePrimary: {
      color: c.headerTitle,
    },
    brandNameBlue: {
      color: c.brandAccentBlue,
    },
    brandNameOrange: {
      color: c.accent,
    },
    description: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 16,
      textAlign: 'center',
    },
    compareButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      marginBottom: 14,
      marginTop: 10,
      paddingVertical: 14,
    },
    compareButtonDisabled: {
      opacity: 0.45,
    },
    compareButtonPressed: {
      opacity: 0.88,
    },
    compareButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
    footerNoteWrap: {
      gap: 8,
      marginTop: 4,
    },
    divider: {
      borderTopColor: c.border,
      borderTopWidth: 1,
    },
    footerNote: {
      color: c.footerText,
      fontSize: 11,
      textAlign: 'center',
    },
    errorBox: {
      backgroundColor: c.redBg,
      borderColor: c.redBorder,
      borderRadius: 8,
      borderWidth: 1,
      marginTop: 12,
      padding: 12,
    },
    errorText: {
      color: c.red,
      fontSize: 13,
      lineHeight: 18,
    },
  });
