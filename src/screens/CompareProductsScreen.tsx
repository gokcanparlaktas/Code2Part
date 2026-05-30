import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLogo } from '@/components/AppLogo';
import { ProductCodeFieldWithSuggestions } from '@/components/ProductCodeFieldWithSuggestions';
import { ProductCompareResultView } from '@/components/ProductCompareResultView';
import type { CompatibilityResult } from '@/types/compatibility';
import {
  compareTwoProductsResolved,
  mapResolverApiErrorMessage,
} from '@/services/resolverService';
import { colors, spacing, typography, buttons } from '@/theme';

export function CompareProductsScreen() {
  const [sourceCode, setSourceCode] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [comparedSource, setComparedSource] = useState('');
  const [comparedTarget, setComparedTarget] = useState('');

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
        <View style={styles.header}>
          <AppLogo size="lg" />
          <Text style={styles.subtitle}>
            İki ürün kodunu girin; uyum yüzdesi ve farklı alanları birlikte görün.
          </Text>
        </View>

        <View style={styles.form}>
          <ProductCodeFieldWithSuggestions
            label="Kaynak ürün kodu"
            hint="Karşılaştırmanın referans alacağı ürün"
            placeholder="Örn. DSBC-63-200-PPVA"
            value={sourceCode}
            onChange={setSourceCode}
            onSelectSuggestion={() => {}}
            suggestionsTitle="Kaynak için öneriler"
          />

          <ProductCodeFieldWithSuggestions
            label="Hedef ürün kodu"
            hint="Muadil veya alternatif olarak kontrol edilecek ürün"
            placeholder="Örn. C96-40-80"
            value={targetCode}
            onChange={setTargetCode}
            onSelectSuggestion={() => {}}
            suggestionsTitle="Hedef için öneriler"
          />

          <Pressable
            style={[styles.compareButton, !canCompare && styles.compareButtonDisabled]}
            onPress={() => void handleCompare()}
            disabled={!canCompare}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.compareButtonText}>Karşılaştır</Text>
            )}
          </Pressable>

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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  form: {
    gap: spacing.xl,
  },
  compareButton: {
    ...buttons.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  compareButtonDisabled: {
    opacity: 0.5,
  },
  compareButtonText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  errorBox: {
    backgroundColor: colors.compat.negative.header,
    borderColor: colors.compat.negative.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.compat.negative.text,
  },
});
