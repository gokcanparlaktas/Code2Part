import { StyleSheet, Text, View } from 'react-native';

import {
  buildCompatibilityMetadataFootnote,
  formatCompatibilityMetadataLines,
} from '@/domain/presentation/formatCompatibilityMetadata';
import type { CompatibilityMetadata } from '@/types/compatibility';
import { colors, radius, spacing, typography } from '@/theme';

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
    return <Text style={styles.compactLine}>{lines.join(' · ')}</Text>;
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
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderLeftColor: colors.accent.blue,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  line: {
    ...typography.bodySm,
    color: colors.surface.text,
    fontWeight: '700',
  },
  footnote: {
    ...typography.bodySm,
    color: colors.surface.textMuted,
    marginTop: spacing.xs,
  },
  compactLine: {
    ...typography.caption,
    color: colors.surface.textSecondary,
    fontWeight: '600',
  },
});
