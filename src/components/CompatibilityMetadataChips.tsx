import { StyleSheet, Text, View } from 'react-native';

import type {
  CompatibilityLevel,
  CompatibilityMetadata,
  ConfidenceLevel,
  DataCompletenessLevel,
} from '@/types/compatibility';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

const CONFIDENCE_SHORT: Record<ConfidenceLevel, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

const DATA_COMPLETENESS_SHORT: Record<DataCompletenessLevel, string> = {
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
};

type TriLevel = ConfidenceLevel | DataCompletenessLevel;

function triLevelColor(level: TriLevel, c: HomeColorPalette): string {
  switch (level) {
    case 'high':
      return c.green;
    case 'medium':
      return c.amber;
    case 'low':
      return c.red;
  }
}

function compatibilityLevelColor(level: CompatibilityLevel, c: HomeColorPalette): string {
  if (level === 'not_compatible') {
    return c.red;
  }
  return triLevelColor(level, c);
}

function formatCompatibilityChipValue(metadata: CompatibilityMetadata): string {
  const map: Record<CompatibilityLevel, string> = {
    high: 'Yüksek',
    medium: 'Orta',
    low: 'Düşük',
    not_compatible: 'Uyumsuz',
  };
  return map[metadata.compatibilityLevel];
}

interface CompatibilityMetadataChipsProps {
  metadata: CompatibilityMetadata;
}

export function CompatibilityMetadataChips({ metadata }: CompatibilityMetadataChipsProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const confidenceColor = triLevelColor(metadata.confidenceLevel, homeColors);
  const dataCompletenessColor = triLevelColor(metadata.dataCompleteness, homeColors);
  const compatibilityColor = compatibilityLevelColor(metadata.compatibilityLevel, homeColors);

  return (
    <View style={styles.metaChipsRow}>
      <View style={styles.metaChip}>
        <Text style={styles.metaChipLabel}>Kaynak güveni</Text>
        <Text style={[styles.metaChipValue, { color: confidenceColor }]}>
          {CONFIDENCE_SHORT[metadata.confidenceLevel]}
        </Text>
      </View>
      <View style={styles.metaChip}>
        <Text style={styles.metaChipLabel}>Veri kapsamı</Text>
        <Text style={[styles.metaChipValue, { color: dataCompletenessColor }]}>
          {DATA_COMPLETENESS_SHORT[metadata.dataCompleteness]}
        </Text>
      </View>
      <View style={styles.metaChip}>
        <Text style={styles.metaChipLabel}>Uyumluluk</Text>
        <Text style={[styles.metaChipValue, { color: compatibilityColor }]}>
          {formatCompatibilityChipValue(metadata)}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    metaChipsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    metaChip: {
      backgroundColor: c.bg,
      borderColor: c.borderSub,
      borderRadius: 6,
      borderWidth: 1,
      flex: 1,
      padding: 8,
    },
    metaChipLabel: {
      color: c.textDim,
      fontSize: 10,
    },
    metaChipValue: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 3,
    },
  });
