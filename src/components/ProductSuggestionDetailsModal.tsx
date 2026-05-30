import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import { buildSuggestionDetailRows } from '@/domain/presentation/buildSuggestionDetailRows';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';
import { colors, radius, spacing, typography, buttons } from '@/theme';

interface ProductSuggestionDetailsModalProps {
  visible: boolean;
  suggestion: SuggestedProduct | null;
  query: string;
  onClose: () => void;
  onTry?: (suggestion: SuggestedProduct) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ProductSuggestionDetailsModal({
  visible,
  suggestion,
  query,
  onClose,
  onTry,
}: ProductSuggestionDetailsModalProps) {
  if (!suggestion) {
    return null;
  }

  const rows = buildSuggestionDetailRows(suggestion);
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);
  const canTry = Boolean(onTry && suggestion.exampleCodeFormat.trim());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
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
              <DetailRow key={row.label} label={row.label} value={row.value} />
            ))}
          </ScrollView>

          <View style={styles.actions}>
            {canTry ? (
              <Pressable
                style={({ pressed }) => [styles.tryButton, pressed && buttons.primaryPressed]}
                onPress={() => onTry?.(suggestion)}
                accessibilityRole="button"
              >
                <Text style={styles.tryButtonText}>Bu kodu dene</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </Pressable>
          </View>
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
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderBottomColor: colors.border.default,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h1,
    color: colors.surface.text,
  },
  subtitle: {
    ...typography.code,
    color: colors.accent.blueLight,
    fontSize: 14,
  },
  scroll: {
    maxHeight: 420,
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
  rowLabel: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
    fontSize: 11,
  },
  rowValue: {
    ...typography.bodySm,
    color: colors.surface.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  tryButton: {
    ...buttons.primary,
    paddingVertical: spacing.md,
  },
  tryButtonText: buttons.primaryText,
  closeButton: {
    alignItems: 'center',
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  closeButtonPressed: {
    backgroundColor: colors.background.elevated,
  },
  closeButtonText: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
    fontWeight: '700',
  },
});
