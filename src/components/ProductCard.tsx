import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ROLLING_BEARING_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

import { ProductDetailsModal } from './ProductDetailsModal';

interface ProductCardProps {
  identification: ProductIdentification;
  noticeText?: string;
  detailRows?: ProductDetailRowView[];
}

interface DetailRowProps {
  label: string;
  value: string;
  evidence: string;
  requiresCheck: boolean;
  highlighted?: boolean;
}

const PRIMARY_LABELS = new Set([
  'Marka',
  'Seri',
  'Seri kodu',
  'Ürün kategorisi',
  'Ürün tipi',
  'İç çap',
  'Dış çap',
  'Kalınlık',
  'Sızdırmazlık',
]);

function isHiddenBearingDetailRow(row: { label: string; evidence: string }): boolean {
  if (row.label === 'Not') {
    return true;
  }
  return row.evidence.toLowerCase().includes('katalog verisi');
}

const HIGHLIGHT_KEYWORDS = [
  'MONTAJ',
  'SÜRGÜ',
  'SURG',
  'MERKEZ',
  'VOLTAJ',
  'BOBİN',
  'KONNEKTÖR',
  'FONKSİYON',
  'TASARIM',
  'STANDART',
];

function isHighlightedRow(label: string): boolean {
  if (PRIMARY_LABELS.has(label)) {
    return true;
  }
  const upper = label.toUpperCase();
  return HIGHLIGHT_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function primaryValueLine(value: string): string {
  return value.split('\n')[0]?.trim() || value;
}

type CardStyles = ReturnType<typeof createStyles>;

function TechnicalDetailsSection({
  rows,
  styles,
}: {
  rows: DetailRowProps[];
  styles: CardStyles;
}) {
  const { homeColors } = useTheme();
  const [open, setOpen] = useState(false);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.techSection}>
      <Pressable
        style={({ pressed }) => [styles.techHeader, pressed && styles.pressed]}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.sectionTitle}>Teknik detaylar</Text>
        <View style={styles.techHeaderMeta}>
          <View style={styles.techCountBadge}>
            <Text style={styles.techCountText}>{rows.length}</Text>
          </View>
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={homeColors.textMuted}
          />
        </View>
      </Pressable>

      {open ? (
        <View style={styles.techBody}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[styles.techRow, index < rows.length - 1 && styles.techRowBorder]}
            >
              <Ionicons name="ellipse" size={6} color={homeColors.textDim} style={styles.techDot} />
              <View style={styles.techRowContent}>
                <View style={styles.techRowTop}>
                  <Text style={styles.techLabel}>{row.label}</Text>
                  <Text
                    style={[styles.techValue, row.requiresCheck && styles.uncertainValue]}
                    numberOfLines={2}
                  >
                    {primaryValueLine(row.value)}
                  </Text>
                </View>
                <Text style={styles.techEvidence}>{row.evidence}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function ProductCard({
  identification,
  noticeText,
  detailRows,
}: ProductCardProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const isFullMatch = identification.outcome === 'full';
  const isRollingBearing = identification.resolverCategoryKey === ROLLING_BEARING_CATEGORY;

  const rows: DetailRowProps[] = useMemo(() => {
    const built =
      detailRows && detailRows.length > 0
        ? detailRows
        : buildProductDetailRows(identification);
    const visible = isRollingBearing
      ? built.filter((row) => !isHiddenBearingDetailRow(row))
      : built;
    return visible.map((row) => ({
      ...row,
      highlighted: isHighlightedRow(row.label),
    }));
  }, [detailRows, identification, isRollingBearing]);

  const primaryRows = rows.filter((row) => row.highlighted);
  const secondaryRows = rows.filter((row) => !row.highlighted);
  const modalRows = isRollingBearing ? secondaryRows : rows;
  const showTechnicalDetailsModal =
    modalRows.length > 0 &&
    (isFullMatch || (isRollingBearing && identification.outcome !== 'not_found'));
  const technicalRows = showTechnicalDetailsModal ? modalRows : [];

  return (
    <View style={styles.root}>
      <View style={styles.codeBlock}>
        <Text style={styles.codeLabel}>Ürün kodu</Text>
        <Text style={styles.code}>{identification.normalizedCode}</Text>
      </View>

      {identification.outcome === 'series_only' && noticeText ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>{noticeText}</Text>
        </View>
      ) : null}

      {primaryRows.length > 0 ? (
        <View style={styles.primarySection}>
          <Text style={styles.sectionTitle}>Temel bilgiler</Text>
          <View style={styles.primaryGrid}>
            {primaryRows.map((row) => (
              <View
                key={row.label}
                style={[
                  styles.primaryCell,
                  row.label === 'Ürün kategorisi' || row.label === 'Ürün tipi'
                    ? styles.primaryCellWide
                    : null,
                ]}
              >
                <Text style={styles.primaryLabel}>{row.label}</Text>
                <Text
                  style={[styles.primaryValue, row.requiresCheck && styles.uncertainValue]}
                  numberOfLines={3}
                >
                  {primaryValueLine(row.value)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {secondaryRows.length > 0 ? (
        <TechnicalDetailsSection rows={secondaryRows} styles={styles} />
      ) : null}

      {showTechnicalDetailsModal ? (
        <Pressable
          style={({ pressed }) => [styles.allDetailsLink, pressed && styles.pressed]}
          onPress={() => setDetailsVisible(true)}
          accessibilityRole="button"
        >
          <Text style={styles.detailsLinkText}>Tüm teknik özellikler</Text>
          <Ionicons name="chevron-forward" size={16} color={homeColors.textMuted} />
        </Pressable>
      ) : null}

      <ProductDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        rows={technicalRows}
      />
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      gap: 16,
    },
    codeBlock: {
      backgroundColor: c.cardBg,
    borderColor: c.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  alertBox: {
    backgroundColor: c.amberBg,
    borderColor: c.amberBorder,
    borderLeftWidth: 3,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  alertText: {
    color: c.amber,
    fontSize: 12,
    lineHeight: 17,
  },
  primarySection: {
    gap: 10,
  },
  sectionTitle: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryCell: {
    backgroundColor: c.cardBg,
    borderColor: c.border,
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: 4,
    minWidth: '46%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryCellWide: {
    minWidth: '100%',
  },
  primaryLabel: {
    color: c.textMuted,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  primaryValue: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  techSection: {
    backgroundColor: c.cardBg,
    borderColor: c.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  techHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  techHeaderMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  techCountBadge: {
    backgroundColor: c.bg,
    borderColor: c.borderSub,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  techCountText: {
    color: c.textPrimary,
    fontSize: 11,
    fontWeight: '500',
  },
  techBody: {
    borderTopColor: c.borderSub,
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 4,
  },
  techRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  techRowBorder: {
    borderBottomColor: c.borderSub,
    borderBottomWidth: 1,
  },
  techDot: {
    marginTop: 6,
  },
  techRowContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  techRowTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  techLabel: {
    color: c.textPrimary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  techValue: {
    color: c.textMuted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '500',
    maxWidth: '42%',
    textAlign: 'right',
  },
  techEvidence: {
    color: c.textDim,
    fontSize: 10,
    lineHeight: 14,
  },
  detailsLinkText: {
    color: c.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  allDetailsLink: {
    alignItems: 'center',
    backgroundColor: c.cardBg,
    borderColor: c.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  uncertainValue: {
    color: c.checkBlue,
  },
});
