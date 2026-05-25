import { StyleSheet, Text, View } from 'react-native';

interface ReliabilityNoteProps {
  message: string;
}

export function ReliabilityNote({ message }: ReliabilityNoteProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  text: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
