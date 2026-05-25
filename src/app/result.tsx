import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NotFoundCard } from '@/components/NotFoundCard';
import { ProductCard } from '@/components/ProductCard';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

export default function ResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const inputCode = typeof code === 'string' ? code : '';

  const { identification, hasEquivalents, showNotFound } = useMemo(() => {
    const resolved = resolveProductSearch(inputCode);
    return {
      identification: resolved.identification,
      hasEquivalents: resolved.hasEquivalents,
      showNotFound:
        resolved.identification.outcome === 'not_found' ||
        resolved.identification.outcome === 'series_only',
    };
  }, [inputCode]);

  const openEquivalents = () => {
    router.push({
      pathname: '/equivalents',
      params: { code: inputCode },
    });
  };

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
      {showNotFound ? (
        <NotFoundCard
          normalizedCode={identification.normalizedCode}
          variant={
            identification.outcome === 'series_only' ? 'series_only' : 'not_found'
          }
        />
      ) : null}

      {identification.outcome === 'full' ? (
        <ProductCard identification={identification} />
      ) : identification.outcome === 'series_only' ? (
        <ProductCard identification={identification} title="Kısmen tanınan seri" />
      ) : null}

      {!showNotFound && hasEquivalents ? (
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          onPress={openEquivalents}
        >
          <Text style={styles.primaryButtonText}>Muadilleri Gör</Text>
        </Pressable>
      ) : null}

      {!showNotFound && !hasEquivalents ? (
        <View style={styles.noEquivalentsCard}>
          <Text style={styles.noEquivalentsText}>
            Bu ürün için henüz muadil aday eklenmemiş.
          </Text>
        </View>
      ) : null}
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  noEquivalentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  noEquivalentsText: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
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
