import { StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface SourceProductSummaryProps {
  identification: ProductIdentification;
}

export function SourceProductSummary({
  identification,
}: SourceProductSummaryProps) {
  const styles = useHomeStyles(createStyles);
  const brand = identification.brand.value ?? 'Bilinmiyor';

  return (
    <View style={styles.root}>
      <Text style={styles.sectionTitle}>Kaynak ürün</Text>

      <View style={styles.codeBlock}>
        <View style={styles.brandChip}>
          <Text style={styles.brandText} numberOfLines={1}>
            {brand}
          </Text>
        </View>
        <Text style={styles.codeLabel}>Ürün kodu</Text>
        <Text style={styles.code}>{identification.normalizedCode}</Text>
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      gap: 10,
    },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    codeBlock: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    brandChip: {
      alignSelf: 'flex-start',
      backgroundColor: c.checkBlueBg,
      borderColor: c.checkBlueBorder,
      borderRadius: 5,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    brandText: {
      color: c.brandBlue,
      fontSize: 12,
      fontWeight: '600',
    },
    codeLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    code: {
      color: c.brandBlue,
      fontFamily: homeMonoFont,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
  });
