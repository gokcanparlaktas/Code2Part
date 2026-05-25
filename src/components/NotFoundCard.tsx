import { StyleSheet, Text, View } from 'react-native';

interface NotFoundCardProps {
  normalizedCode: string;
  variant: 'not_found' | 'series_only';
}

export function NotFoundCard({ normalizedCode, variant }: NotFoundCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Ürün kodu tanınamadı</Text>
      <Text style={styles.message}>Kod formatı henüz desteklenmiyor olabilir.</Text>
      <Text style={styles.message}>
        Bu arama daha sonra veri setine eklenebilir.
      </Text>

      {variant === 'series_only' ? (
        <Text style={styles.hint}>
          Seri tanındı ancak kod yapısından çap/strok okunamadı. Kodu kontrol edin
          veya tam formatı deneyin.
        </Text>
      ) : null}

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>Girilen kod</Text>
        <Text style={styles.codeValue}>{normalizedCode}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 20,
  },
  title: {
    color: '#9A3412',
    fontSize: 20,
    fontWeight: '800',
  },
  message: {
    color: '#7C2D12',
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: '#B45309',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  codeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 6,
    padding: 12,
  },
  codeLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  codeValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
