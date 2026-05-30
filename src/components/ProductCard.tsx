import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';
import { colors, radius, shadows, spacing, typography } from '@/theme';

import { ConfidenceBadge } from './ConfidenceBadge';
import { ProductDetailsModal } from './ProductDetailsModal';

interface ProductCardProps {
  identification: ProductIdentification;
  title?: string;
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
  'Ürün kategorisi',
  'Ürün tipi',
]);

const HIGHLIGHT_KEYWORDS = [
  'MONTAJ',
  'SÜRGÜ',
  'SURG',
  'MERKEZ',
  'VOLTAJ',
  'BOBİN',
  'KONNEKTÖR',
  'FONKSİYON',
];

function isHighlightedRow(label: string): boolean {
  if (PRIMARY_LABELS.has(label)) {
    return true;
  }
  const upper = label.toUpperCase();
  return HIGHLIGHT_KEYWORDS.some((keyword) => upper.includes(keyword));
}

function DetailRow({ label, value, evidence, requiresCheck, highlighted }: DetailRowProps) {
  return (
    <View style={[styles.row, highlighted && styles.rowHighlighted]}>
      <Text style={[styles.rowLabel, highlighted && styles.rowLabelHighlighted]}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          highlighted && styles.rowValueHighlighted,
          requiresCheck && styles.uncertainValue,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.evidence}>{evidence}</Text>
    </View>
  );
}

export function ProductCard({
  identification,
  title = 'Tanımlanan ürün',
  noticeText,
  detailRows,
}: ProductCardProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const isFullMatch = identification.outcome === 'full';

  const rows: DetailRowProps[] = useMemo(
    () =>
      (detailRows && detailRows.length > 0 ? detailRows : buildProductDetailRows(identification)).map(
        (row) => ({
          ...row,
          highlighted: isHighlightedRow(row.label),
        })
      ),
    [detailRows, identification]
  );

  const primaryRows = rows.filter((row) => row.highlighted);
  const secondaryRows = rows.filter((row) => !row.highlighted);
  const technicalRows = isFullMatch ? rows : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {isFullMatch ? (
          <ConfidenceBadge confidence="high" label="Tam eşleşme" />
        ) : (
          <ConfidenceBadge confidence={identification.confidence} />
        )}
      </View>

      <View style={styles.codeBlock}>
        <Text style={styles.codeLabel}>ÜRÜN KODU</Text>
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
              <View key={row.label} style={styles.primaryCell}>
                <Text style={styles.primaryLabel}>{row.label}</Text>
                <Text
                  style={[styles.primaryValue, row.requiresCheck && styles.uncertainValue]}
                  numberOfLines={3}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {secondaryRows.length > 0 ? (
        <View style={styles.details}>
          {secondaryRows.length > 0 && primaryRows.length > 0 ? (
            <Text style={styles.sectionTitle}>Teknik detaylar</Text>
          ) : null}
          {secondaryRows.map((row) => (
            <DetailRow key={row.label} {...row} />
          ))}
        </View>
      ) : null}

      {isFullMatch && technicalRows.length > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.detailsLink, pressed && styles.detailsLinkPressed]}
          onPress={() => setDetailsVisible(true)}
          accessibilityRole="button"
        >
          <Text style={styles.detailsLinkText}>Tüm teknik özellikler</Text>
          <Text style={styles.detailsLinkChevron}>›</Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h1,
    color: colors.surface.text,
    flex: 1,
  },
  codeBlock: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.accentLight,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  codeLabel: {
    ...typography.sectionTitle,
    color: colors.text.inverseFaint,
    fontSize: 11,
  },
  code: {
    ...typography.codeLg,
    color: colors.text.inverse,
  },
  detailsLink: {
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  detailsLinkPressed: {
    backgroundColor: colors.navy[600],
  },
  detailsLinkText: {
    color: colors.surface.text,
    fontSize: 14,
    fontWeight: '700',
  },
  detailsLinkChevron: {
    color: colors.surface.textMuted,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
  alertBox: {
    backgroundColor: colors.status.warning.bg,
    borderColor: colors.status.warning.border,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertText: {
    ...typography.bodySm,
    color: colors.status.warning.text,
  },
  primarySection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.surface.textMuted,
  },
  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryCell: {
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: '46%',
    padding: spacing.md,
  },
  primaryLabel: {
    ...typography.caption,
    color: colors.surface.textMuted,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  primaryValue: {
    ...typography.h3,
    color: colors.surface.text,
  },
  details: {
    gap: spacing.sm,
  },
  row: {
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  rowHighlighted: {
    backgroundColor: colors.background.elevated,
    borderBottomWidth: 0,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  rowLabel: {
    ...typography.label,
    color: colors.surface.textMuted,
  },
  rowLabelHighlighted: {
    color: colors.surface.textSecondary,
  },
  rowValue: {
    ...typography.body,
    color: colors.surface.text,
    fontWeight: '600',
  },
  rowValueHighlighted: {
    fontWeight: '700',
  },
  uncertainValue: {
    color: colors.match.low,
  },
  evidence: {
    ...typography.caption,
    color: colors.surface.textMuted,
  },
});
