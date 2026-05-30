import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheetModal } from '@/components/common/BottomSheetModal';
import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import { buildSuggestionDetailRows } from '@/domain/presentation/buildSuggestionDetailRows';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface ProductSuggestionDetailsModalProps {
  visible: boolean;
  suggestion: SuggestedProduct | null;
  query: string;
  onClose: () => void;
  onTry?: (suggestion: SuggestedProduct) => void;
}

export function ProductSuggestionDetailsModal({
  visible,
  suggestion,
  query,
  onClose,
  onTry,
}: ProductSuggestionDetailsModalProps) {
  const styles = useHomeStyles(createStyles);

  if (!suggestion) {
    return null;
  }

  const rows = buildSuggestionDetailRows(suggestion);
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);
  const canTry = Boolean(onTry && suggestion.exampleCodeFormat.trim());

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <View style={styles.titleBar}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{suggestion.brand}</Text>
          <Text style={styles.subtitle}>{suggestion.series}</Text>
        </View>
        <MatchPercentageRing match={matchPercentage} size={56} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        {canTry ? (
          <Pressable
            style={({ pressed }) => [styles.tryButton, pressed && styles.tryButtonPressed]}
            onPress={() => onTry?.(suggestion)}
            accessibilityRole="button"
          >
            <Text style={styles.tryButtonText}>Bu kodu dene</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          onPress={onClose}
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>Kapat</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    sheet: {
      paddingBottom: 24,
    },
    titleBar: {
      alignItems: 'center',
      borderBottomColor: c.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    titleBlock: {
      flex: 1,
      gap: 4,
    },
    title: {
      color: c.brandBlue,
      fontSize: 18,
      fontWeight: '600',
    },
    subtitle: {
      color: c.brandBlue,
      fontFamily: homeMonoFont,
      fontSize: 14,
      fontWeight: '500',
    },
    scroll: {
      maxHeight: 420,
    },
    scrollContent: {
      gap: 8,
      padding: 16,
      paddingBottom: 8,
    },
    row: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 4,
      padding: 12,
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
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 19,
    },
    actions: {
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    tryButton: {
      alignItems: 'center',
      backgroundColor: c.accent,
      borderRadius: 8,
      paddingVertical: 14,
    },
    tryButtonPressed: {
      opacity: 0.88,
    },
    tryButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '500',
    },
    closeButton: {
      alignItems: 'center',
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingVertical: 14,
    },
    closeButtonPressed: {
      opacity: 0.88,
    },
    closeButtonText: {
      color: c.textMuted,
      fontSize: 15,
      fontWeight: '500',
    },
  });
