import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CompatibilityTable } from '@/components/CompatibilityTable';
import { ProductCard } from '@/components/ProductCard';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { findEquivalents } from '@/domain/resolver/findEquivalents';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

export default function ResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = typeof code === 'string' ? code : '';

  const { identification, compatibilityResults } = useMemo(() => {
    const normalizedCode = normalizeCode(inputCode);
    const identified = identifyProduct(inputCode, normalizedCode);
    const equivalents = findEquivalents(identified);
    const comparisons = equivalents.map((candidate) =>
      compareProducts(identified, candidate)
    );
    return {
      identification: identified,
      compatibilityResults: comparisons,
    };
  }, [inputCode]);

  if (!inputCode) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sorgulanacak ürün kodu bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProductCard identification={identification} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Muadil seri adayları</Text>
        <Text style={styles.sectionSubtitle}>
          Aynı standart grubundaki diğer üretici serileri
        </Text>
      </View>

      {compatibilityResults.length === 0 ? (
        <View style={styles.noEquivalentsCard}>
          <Text style={styles.noEquivalentsText}>
            Bu ürün için tanımlı muadil seri bulunamadı veya ürün tanınamadı.
          </Text>
        </View>
      ) : (
        compatibilityResults.map((result) => (
          <CompatibilityTable key={result.candidate.seriesId} result={result} />
        ))
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
  sectionHeader: {
    gap: 4,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  noEquivalentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  noEquivalentsText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
});
