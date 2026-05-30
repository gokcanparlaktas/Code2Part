import { StyleSheet, Text, View } from 'react-native';

import {
  buildCompatibilityMetadataFootnote,
  formatCompatibilityMetadataLines,
} from '@/domain/presentation/formatCompatibilityMetadata';
import type { CompatibilityMetadata } from '@/types/compatibility';
import { colors, radius, spacing, typography } from '@/theme';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface CompatibilityMetadataBannerProps {
  metadata: CompatibilityMetadata;
  compact?: boolean;
  hasCheckItems?: boolean;
  variant?: 'default' | 'dark';
}

export function CompatibilityMetadataBanner({
  metadata,
  compact = false,
  hasCheckItems = false,
  variant = 'default',
}: CompatibilityMetadataBannerProps) {
  const styles = useHomeStyles(createStyles);
  const lines = formatCompatibilityMetadataLines(metadata);
  const footnote = buildCompatibilityMetadataFootnote(metadata, { hasCheckItems });
  const isDark = variant === 'dark';

  if (compact) {
    return (
      <Text style={[styles.compactLine, isDark && styles.compactLineDark]}>
        {lines.join(' · ')}
      </Text>
    );
  }

  return (
    <View style={[styles.banner, isDark && styles.bannerDark]}>
      {lines.map((line) => (
        <Text key={line} style={[styles.line, isDark && styles.lineDark]}>
          {line}
        </Text>
      ))}
      {footnote ? (
        <Text style={[styles.footnote, isDark && styles.footnoteDark]}>{footnote}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
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
    compactLineDark: {
      color: c.textMuted,
    },
    bannerDark: {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      borderLeftColor: c.brandBlue,
    },
    lineDark: {
      color: c.textPrimary,
    },
    footnoteDark: {
      color: c.textMuted,
    },
  });
