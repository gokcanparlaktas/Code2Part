import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import type { ProductDetailRowView } from '@/services/mapBackendResolverDtos';

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
}

function DetailRow({ label, value, evidence, requiresCheck }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, requiresCheck && styles.uncertainValue]}>
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
      detailRows && detailRows.length > 0
        ? detailRows
        : buildProductDetailRows(identification),
    [detailRows, identification]
  );

  const technicalRows = isFullMatch ? rows : [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.codeLabel}>Ürün kodu</Text>
      <Text style={styles.code}>{identification.normalizedCode}</Text>

      {isFullMatch && technicalRows.length > 0 ? (
        <>
          <Pressable
            style={({ pressed }) => [
              styles.detailsLink,
              pressed && styles.detailsLinkPressed,
            ]}
            onPress={() => setDetailsVisible(true)}
            accessibilityRole="button"
          >
            <Text style={styles.detailsLinkText}>Ürün detayları</Text>
            <Text style={styles.detailsLinkChevron}>›</Text>
          </Pressable>
          <ProductDetailsModal
            visible={detailsVisible}
            onClose={() => setDetailsVisible(false)}
            rows={technicalRows}
          />
        </>
      ) : null}

      {identification.outcome === 'series_only' && noticeText ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>{noticeText}</Text>
        </View>
      ) : null}

      {isFullMatch ? (
        <ConfidenceBadge confidence="high" label="Tam eşleşme" />
      ) : (
        <ConfidenceBadge confidence={identification.confidence} />
      )}

      <View style={styles.details}>
        {rows.map((row) => (
          <DetailRow key={row.label} {...row} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 12,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  codeLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  code: {
    color: '#1E40AF',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '600',
  },
  detailsLink: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailsLinkPressed: {
    opacity: 0.92,
  },
  detailsLinkText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailsLinkChevron: {
    color: '#1E40AF',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 22,
  },
  alertBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  alertText: {
    color: '#92400E',
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    gap: 12,
    marginTop: 4,
  },
  row: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    gap: 4,
    paddingBottom: 10,
  },
  rowLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  uncertainValue: {
    color: '#B45309',
  },
  evidence: {
    color: '#94A3B8',
    fontSize: 12,
  },
});
