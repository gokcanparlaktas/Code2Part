import { StyleSheet, Text, View } from 'react-native';

import { DEMO_DISCLAIMER_LINES } from '@/utils/demoDisclaimer';

interface DemoDisclaimerNoteProps {
  compact?: boolean;
}

export function DemoDisclaimerNote({ compact = false }: DemoDisclaimerNoteProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {DEMO_DISCLAIMER_LINES.map((line) => (
        <Text key={line} style={[styles.line, compact && styles.lineCompact]}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  cardCompact: {
    padding: 10,
  },
  line: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  lineCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
});
