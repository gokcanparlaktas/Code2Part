import { StyleSheet, Text, View } from 'react-native';

export function LowConfidenceWarningCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bu sonuç düşük güvenle tahmin edildi.</Text>
      <Text style={styles.message}>
        Marka, seri veya teknik özellikler doğrulanmalıdır.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  title: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  message: {
    color: '#B45309',
    fontSize: 15,
    lineHeight: 21,
  },
});
