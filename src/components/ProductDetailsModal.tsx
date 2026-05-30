import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  rows: ProductDetailRowView[];
}

function DetailValueBlock({ value }: { value: string }) {
  const primary = value.split('\n')[0]?.trim() || value;

  return (
    <View style={styles.valueBlock}>
      <Text style={styles.rowValue}>{primary}</Text>
      {value.includes('\n')
        ? value
            .split('\n')
            .slice(1)
            .map((line) => line.trim())
            .filter(Boolean)
            .filter((line) => !line.startsWith('Kod kanıtı:'))
            .map((line) => (
              <Text key={line} style={styles.secondaryValue}>
                {line}
              </Text>
            ))
        : null}
    </View>
  );
}

function DetailRow({ row }: { row: ProductDetailRowView }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{row.label}</Text>
      <DetailValueBlock value={row.value} />
      <Text style={styles.evidence}>{row.evidence}</Text>
    </View>
  );
}

export function ProductDetailsModal({ visible, onClose, rows }: ProductDetailsModalProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Teknik özellikler</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {rows.map((row) => (
              <DetailRow key={row.label} row={row} />
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
    paddingBottom: 28,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 480,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 8,
  },
  row: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    gap: 4,
    padding: 14,
  },
  valueBlock: {
    gap: 3,
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  secondaryValue: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  evidence: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
