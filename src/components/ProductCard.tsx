import { StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import {
  formatAttributeValue,
  formatEvidence,
} from '@/utils/formatConfidence';

import { ConfidenceBadge } from './ConfidenceBadge';

interface ProductCardProps {
  identification: ProductIdentification;
  title?: string;
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
      <Text style={styles.evidence}>
        {requiresCheck ? 'Kontrol gerekli' : evidence}
      </Text>
    </View>
  );
}

export function ProductCard({ identification, title = 'Tanımlanan ürün' }: ProductCardProps) {
  const rows: DetailRowProps[] = [
    {
      label: 'Marka',
      value: formatAttributeValue(identification.brand.value),
      evidence: formatEvidence(identification.brand.evidence),
      requiresCheck: identification.brand.requiresCheck,
    },
    {
      label: 'Seri',
      value: formatAttributeValue(identification.series.value),
      evidence: formatEvidence(identification.series.evidence),
      requiresCheck: identification.series.requiresCheck,
    },
    {
      label: 'Ürün tipi',
      value: formatAttributeValue(identification.productType.value),
      evidence: formatEvidence(identification.productType.evidence),
      requiresCheck: identification.productType.requiresCheck,
    },
    {
      label: 'Standart ailesi',
      value: formatAttributeValue(identification.standardFamily.value),
      evidence: formatEvidence(identification.standardFamily.evidence),
      requiresCheck: identification.standardFamily.requiresCheck,
    },
    {
      label: 'Çap',
      value: formatAttributeValue(identification.bore.value, identification.bore.unit),
      evidence: formatEvidence(identification.bore.evidence),
      requiresCheck: identification.bore.requiresCheck,
    },
    {
      label: 'Strok',
      value: formatAttributeValue(identification.stroke.value, identification.stroke.unit),
      evidence: formatEvidence(identification.stroke.evidence),
      requiresCheck: identification.stroke.requiresCheck,
    },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.codeLabel}>Normalize kod</Text>
      <Text style={styles.code}>{identification.normalizedCode}</Text>

      {identification.outcome === 'series_only' && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            Seri tanındı; çap ve strok kod formatından okunamadı. Değerler kesin
            değildir.
          </Text>
        </View>
      )}

      <ConfidenceBadge confidence={identification.confidence} />

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
