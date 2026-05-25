import { StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import { formatSourceSummary } from '@/utils/formatSourceSummary';

interface SourceProductSummaryProps {
  identification: ProductIdentification;
}

export function SourceProductSummary({ identification }: SourceProductSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Kaynak ürün</Text>
      <Text style={styles.summary}>{formatSourceSummary(identification)}</Text>
      <Text style={styles.code}>{identification.normalizedCode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  label: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  summary: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  code: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
});
