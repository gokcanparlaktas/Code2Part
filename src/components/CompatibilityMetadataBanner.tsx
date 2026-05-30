import { StyleSheet, Text, View } from 'react-native';

import {
  buildCompatibilityMetadataFootnote,
  formatCompatibilityMetadataLines,
} from '@/domain/presentation/formatCompatibilityMetadata';
import type { CompatibilityMetadata } from '@/types/compatibility';

interface CompatibilityMetadataBannerProps {
  metadata: CompatibilityMetadata;
  compact?: boolean;
  hasCheckItems?: boolean;
}

export function CompatibilityMetadataBanner({
  metadata,
  compact = false,
  hasCheckItems = false,
}: CompatibilityMetadataBannerProps) {
  const lines = formatCompatibilityMetadataLines(metadata);
  const footnote = buildCompatibilityMetadataFootnote(metadata, { hasCheckItems });

  if (compact) {
    return (
      <Text style={styles.compactLine}>{lines.join(' • ')}</Text>
    );
  }

  return (
    <View style={styles.banner}>
      {lines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
      {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  line: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  footnote: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 4,
  },
  compactLine: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
