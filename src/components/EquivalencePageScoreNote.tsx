import { StyleSheet, Text, View } from 'react-native';

import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface EquivalencePageScoreNoteProps {
  note: string | null;
}

export function EquivalencePageScoreNote({ note }: EquivalencePageScoreNoteProps) {
  const styles = useHomeStyles(createStyles);

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

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    noteCard: {
      backgroundColor: c.amberBg,
      borderColor: c.amberBorder,
      borderLeftWidth: 3,
      borderRadius: 8,
      borderWidth: 1,
      gap: 4,
      padding: 12,
    },
    noteTitle: {
      color: c.amber,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    noteText: {
      color: c.amber,
      fontSize: 12,
      lineHeight: 18,
    },
  });
