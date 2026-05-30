import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';
import { colors, radius, spacing, typography, buttons } from '@/theme';

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
          <View style={styles.titleBar}>
            <Text style={styles.title}>Teknik özellikler</Text>
          </View>
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
    backgroundColor: 'rgba(10, 22, 40, 0.72)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
    paddingBottom: spacing.xxl,
  },
  titleBar: {
    backgroundColor: colors.navy[900],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
  },
  scroll: {
    maxHeight: 480,
  },
  scrollContent: {
    gap: spacing.sm,
    padding: spacing.xl,
    paddingBottom: spacing.sm,
  },
  row: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  valueBlock: {
    gap: 3,
  },
  rowLabel: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
    fontSize: 11,
  },
  rowValue: {
    ...typography.h3,
    color: colors.surface.text,
    lineHeight: 22,
  },
  secondaryValue: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
  },
  evidence: {
    ...typography.caption,
    color: colors.surface.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  button: {
    ...buttons.primary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  buttonPressed: buttons.primaryPressed,
  buttonText: buttons.primaryText,
});
