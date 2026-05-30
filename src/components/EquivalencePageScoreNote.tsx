import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface EquivalencePageScoreNoteProps {
  note: string | null;
}

export function EquivalencePageScoreNote({ note }: EquivalencePageScoreNoteProps) {
  if (!note) {
    return null;
  }

  return (
    <View style={styles.noteCard}>
      <Text style={styles.noteTitle}>Skor notu</Text>
      <Text style={styles.noteText}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: 'rgba(202, 138, 4, 0.12)',
    borderColor: 'rgba(202, 138, 4, 0.45)',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  noteTitle: {
    ...typography.sectionTitle,
    color: colors.match.medium,
    fontSize: 11,
  },
  noteText: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
    lineHeight: 20,
  },
});
