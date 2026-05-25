import { StyleSheet, Text, View } from 'react-native';

import type { AttributeComparison, CompatibilityResult } from '@/types/compatibility';

import { StatusBadge } from './StatusBadge';

interface CompatibilityTableProps {
  result: CompatibilityResult;
}

function ComparisonSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: AttributeComparison[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.empty}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.label} style={styles.comparisonRow}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonLabel}>{item.label}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={styles.comparisonValues}>
            Kaynak: {item.sourceDisplay}
          </Text>
          <Text style={styles.comparisonValues}>
            Karşı: {item.targetDisplay}
          </Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function CompatibilityTable({ result }: CompatibilityTableProps) {
  const { candidate } = result;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {candidate.brand} {candidate.series}
      </Text>
      <Text style={styles.subtitle}>{candidate.productType}</Text>
      {candidate.suggestedCode ? (
        <Text style={styles.suggestedCode}>
          Önerilen kod: {candidate.suggestedCode}
        </Text>
      ) : (
        <Text style={styles.suggestedCodeWarning}>
          Önerilen kod oluşturulamadı — çap/strok kontrol edin.
        </Text>
      )}

      <ComparisonSection
        title="Uyumlu"
        items={result.compatible}
        emptyMessage="Bu bölümde uyumlu madde yok."
      />
      <ComparisonSection
        title="Farklı"
        items={result.different}
        emptyMessage="Bu bölümde farklı madde yok."
      />
      <ComparisonSection
        title="Kontrol Gerekli / Bilinmiyor"
        items={result.unknownOrCheck}
        emptyMessage="Bu bölümde kontrol gerektiren madde yok."
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uyarılar</Text>
        {result.warnings.length === 0 ? (
          <Text style={styles.empty}>Ek uyarı yok.</Text>
        ) : (
          result.warnings.map((warning) => (
            <View key={warning} style={styles.warningItem}>
              <Text style={styles.warningText}>• {warning}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  suggestedCode: {
    color: '#1E40AF',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestedCodeWarning: {
    color: '#B45309',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  empty: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  comparisonRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 6,
    padding: 12,
  },
  comparisonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonLabel: {
    color: '#0F172A',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  comparisonValues: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  note: {
    color: '#B45309',
    fontSize: 12,
    lineHeight: 16,
  },
  warningItem: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
  },
  warningText: {
    color: '#9A3412',
    fontSize: 13,
    lineHeight: 18,
  },
});
