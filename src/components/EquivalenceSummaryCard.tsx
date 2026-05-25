import { StyleSheet, Text, View } from 'react-native';

import type { EquivalenceSummary } from '@/types/compatibility';

import { RiskLevelBadge } from './RiskLevelBadge';

interface EquivalenceSummaryCardProps {
  brand: string;
  series: string;
  summary: EquivalenceSummary;
  suggestedCode: string | null;
}

export function EquivalenceSummaryCard({
  brand,
  series,
  summary,
  suggestedCode,
}: EquivalenceSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.candidateName}>
            {brand} {series}
          </Text>
          <Text style={styles.matchLevel}>{summary.matchLevelTr}</Text>
        </View>
        <RiskLevelBadge riskLevel={summary.riskLevel} />
      </View>

      <Text style={styles.summary}>{summary.summaryTr}</Text>

      {suggestedCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Önerilen muadil kod</Text>
          <Text style={styles.codeValue}>{suggestedCode}</Text>
        </View>
      ) : (
        <Text style={styles.codeWarning}>
          Önerilen kod oluşturulamadı. Çap ve strok kodda net olmalıdır.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  candidateName: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  matchLevel: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
  },
  codeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  codeLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  codeValue: {
    color: '#1E40AF',
    fontSize: 17,
    fontWeight: '700',
  },
  codeWarning: {
    color: '#B45309',
    fontSize: 14,
    lineHeight: 20,
  },
});
