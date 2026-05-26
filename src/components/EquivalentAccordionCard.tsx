import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MATCH_PERCENTAGE_RING_SIZE,
  MatchPercentageRing,
} from '@/components/common/MatchPercentageRing';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { AttributeComparison, CheckItem, CompatibilityResult } from '@/types/compatibility';
import { formatCollapsedRiskHint } from '@/utils/formatRisk';

import { RiskLevelBadge } from './RiskLevelBadge';
import { SeverityBadge } from './SeverityBadge';

interface EquivalentAccordionCardProps {
  result: CompatibilityResult;
  expanded: boolean;
  onToggle: () => void;
}

function CompatibleRow({ item }: { item: AttributeComparison }) {
  return (
    <View style={styles.compatibleRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.rowValue}>{item.sourceDisplay}</Text>
    </View>
  );
}

function DifferentRow({ item }: { item: AttributeComparison }) {
  return (
    <View style={styles.differentRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.rowValue}>
        Kaynak: {item.sourceDisplay} → Muadil: {item.targetDisplay}
      </Text>
    </View>
  );
}

function CheckRow({ item }: { item: CheckItem }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkHeader}>
        <Text style={styles.checkField}>{item.field}</Text>
        <SeverityBadge severity={item.severity} />
      </View>
      <Text style={styles.checkReason}>{item.reasonTr}</Text>
    </View>
  );
}

function SectionBlock({
  title,
  children,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {isEmpty ? <Text style={styles.empty}>{emptyMessage}</Text> : children}
    </View>
  );
}

export function EquivalentAccordionCard({
  result,
  expanded,
  onToggle,
}: EquivalentAccordionCardProps) {
  const { candidate, summary } = result;
  const hasChecks = result.checkItems.length > 0;
  const modelCode = candidate.suggestedCode ?? 'Model oluşturulamadı';
  const riskHint = formatCollapsedRiskHint(summary.riskLevel, hasChecks);
  const matchPercentage = calculateMatchPercentage(result);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleBlock}>
            <Text style={styles.brandSeries}>
              {candidate.brand} {candidate.series}
            </Text>
            <Text style={styles.modelLine}>
              <Text style={styles.modelLabel}>Model: </Text>
              {modelCode}
            </Text>
            <Text style={styles.matchLevel}>{summary.matchLevelTr}</Text>
            <Text style={styles.riskHint}>{riskHint}</Text>
          </View>
          <View style={styles.headerTrailing}>
            <MatchPercentageRing match={matchPercentage} />
            <View style={styles.chevronAlign}>
              <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.riskBadgeRow}>
            <RiskLevelBadge riskLevel={summary.riskLevel} />
          </View>
          <Text style={styles.summaryText}>{summary.summaryTr}</Text>

          <SectionBlock
            title="Uyumlu"
            isEmpty={result.compatible.length === 0}
            emptyMessage="Bu bölümde uyumlu madde yok."
          >
            {result.compatible.map((item) => (
              <CompatibleRow key={item.label} item={item} />
            ))}
          </SectionBlock>

          <SectionBlock
            title="Uyumsuz"
            isEmpty={result.different.length === 0}
            emptyMessage="Bu bölümde farklı madde yok."
          >
            {result.different.map((item) => (
              <DifferentRow key={item.label} item={item} />
            ))}
          </SectionBlock>

          <SectionBlock
            title="Dikkat Edilmesi Gerekenler"
            isEmpty={result.checkItems.length === 0}
            emptyMessage="Bu bölümde kontrol gerektiren madde yok."
          >
            {result.checkItems.map((item) => (
              <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} />
            ))}
          </SectionBlock>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardExpanded: {
    borderColor: '#93C5FD',
  },
  header: {
    padding: 16,
  },
  headerPressed: {
    backgroundColor: '#F8FAFC',
  },
  headerTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  brandSeries: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  headerTrailing: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 4,
  },
  chevronAlign: {
    height: MATCH_PERCENTAGE_RING_SIZE,
    justifyContent: 'center',
  },
  chevron: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    width: 14,
  },
  modelLine: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '600',
  },
  modelLabel: {
    color: '#64748B',
    fontWeight: '600',
  },
  matchLevel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  riskHint: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    gap: 16,
    padding: 16,
    paddingTop: 14,
  },
  riskBadgeRow: {
    alignItems: 'flex-start',
  },
  summaryText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
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
  compatibleRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  differentRow: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  rowLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  rowValue: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '600',
  },
  checkRow: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  checkHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkField: {
    color: '#0F172A',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  checkReason: {
    color: '#92400E',
    fontSize: 15,
    lineHeight: 22,
  },
});
