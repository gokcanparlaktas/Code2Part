import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCodeSearchCard } from '@/components/ProductCodeSearchCard';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.brand}>Code2Part</Text>
          <Text style={styles.tagline}>
            Endüstriyel ürün kodunu tanıyın, muadil serileri kolayca karşılaştırın.
          </Text>
        </View>

        <ProductCodeSearchCard />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nasıl çalışır?</Text>
          <Text style={styles.step}>1. Ürün kodunu yukarıdaki alana girin</Text>
          <Text style={styles.step}>2. Uygulama kodu düzenler ve ürünü tanır</Text>
          <Text style={styles.step}>3. Muadil serileri ve uyumluluğu görün</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    gap: 10,
    padding: 22,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    color: '#DBEAFE',
    fontSize: 15,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 8,
    padding: 18,
  },
  infoTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  step: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
