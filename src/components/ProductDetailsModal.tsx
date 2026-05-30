import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/common/BottomSheetModal';
import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  rows: ProductDetailRowView[];
}

export function ProductDetailsModal({ visible, onClose, rows }: ProductDetailsModalProps) {
  const styles = useHomeStyles(createStyles);

  if (rows.length === 0) {
    return null;
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>Teknik özellikler</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.valueBlock}>
              <Text style={styles.rowValue}>{row.value.split('\n')[0]?.trim() || row.value}</Text>
              {row.value.includes('\n')
                ? row.value
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
            <Text style={styles.evidence}>{row.evidence}</Text>
          </View>
        ))}
      </ScrollView>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={onClose}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Kapat</Text>
      </Pressable>
    </BottomSheetModal>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    sheet: {
      paddingBottom: 24,
    },
    titleBar: {
      borderBottomColor: c.border,
      borderBottomWidth: 1,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    title: {
      color: c.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    scroll: {
      maxHeight: 480,
    },
    scrollContent: {
      gap: 8,
      padding: 16,
      paddingBottom: 8,
    },
    row: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 4,
      padding: 12,
    },
    valueBlock: {
      gap: 3,
    },
    rowLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    rowValue: {
      color: c.textPrimary,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    secondaryValue: {
      color: c.textMuted,
      fontSize: 12,
      lineHeight: 17,
    },
    evidence: {
      color: c.textDim,
      fontSize: 10,
      marginTop: 2,
    },
    button: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      marginHorizontal: 16,
      marginTop: 8,
      paddingVertical: 14,
    },
    buttonPressed: {
      opacity: 0.88,
    },
    buttonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
  });
