import { StyleSheet, Text, View } from 'react-native';

import type { AttributeComparison, CheckItem, CompatibilityResult } from '@/types/compatibility';

import { EquivalenceSummaryCard } from './EquivalenceSummaryCard';
import { SeverityBadge } from './SeverityBadge';
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
          <Text style={styles.valueLine}>
            <Text style={styles.valueLabel}>Kaynak: </Text>
            {item.sourceDisplay}
          </Text>
          <Text style={styles.valueLine}>
            <Text style={styles.valueLabel}>Muadil: </Text>
            {item.targetDisplay}
          </Text>
        </View>
      ))}
    </View>
  );
}

function CheckItemRow({ item }: { item: CheckItem }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkHeader}>
        <Text style={styles.checkField}>{item.field}</Text>
        <SeverityBadge severity={item.severity} />
      </View>
      <View style={styles.checkValues}>
        <Text style={styles.valueLine}>
          <Text style={styles.valueLabel}>Kaynak: </Text>
          {item.sourceValue}
        </Text>
        <Text style={styles.valueLine}>
          <Text style={styles.valueLabel}>Muadil: </Text>
          {item.targetValue}
        </Text>
      </View>
      <Text style={styles.reason}>{item.reasonTr}</Text>
    </View>
  );
}

export function CompatibilityTable({ result }: CompatibilityTableProps) {
  const { candidate, summary } = result;

  return (
    <View style={styles.card}>
      <EquivalenceSummaryCard
        brand={candidate.brand}
        series={candidate.series}
        summary={summary}
        suggestedCode={candidate.suggestedCode}
      />

      <Text style={styles.productType}>{candidate.productType}</Text>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontrol Gerekli / Bilinmiyor</Text>
        {result.checkItems.length === 0 ? (
          <Text style={styles.empty}>Bu bölümde kontrol gerektiren madde yok.</Text>
        ) : (
          result.checkItems.map((item) => (
            <CheckItemRow key={`${item.field}-${item.reasonTr}`} item={item} />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uyarılar</Text>
        {result.warnings.length === 0 ? (
          <Text style={styles.empty}>Ek uyarı yok.</Text>
        ) : (
          result.warnings.map((warning) => (
            <View key={warning} style={styles.warningItem}>
              <Text style={styles.warningText}>{warning}</Text>
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
    gap: 18,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productType: {
    color: '#64748B',
    fontSize: 15,
    marginTop: -8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  empty: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  comparisonRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    gap: 8,
    padding: 14,
  },
  comparisonHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonLabel: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  checkRow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  checkHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkField: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  checkValues: {
    gap: 6,
  },
  valueLine: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 21,
  },
  valueLabel: {
    fontWeight: '700',
  },
  reason: {
    color: '#92400E',
    fontSize: 15,
    lineHeight: 22,
  },
  warningItem: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    color: '#9A3412',
    fontSize: 15,
    lineHeight: 22,
  },
});
