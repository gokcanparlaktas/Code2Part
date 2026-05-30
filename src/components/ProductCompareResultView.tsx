import { StyleSheet, Text, View } from 'react-native';

import { MatchPercentageRing } from '@/components/common/MatchPercentageRing';
import { CompatibilityComparisonSections } from '@/components/CompatibilityComparisonSections';
import { CompatibilityMetadataBanner } from '@/components/CompatibilityMetadataBanner';
import { RiskLevelBadge } from '@/components/RiskLevelBadge';
import {
  equivalenceStatusTone,
  formatEquivalenceStatusLabel,
} from '@/domain/presentation/formatCompatibilityMetadata';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';
import { formatCollapsedRiskHint } from '@/utils/formatRisk';
import { colors, radius, spacing, typography } from '@/theme';

interface ProductCompareResultViewProps {
  sourceCode: string;
  targetCode: string;
  result: CompatibilityResult;
}

export function ProductCompareResultView({
  sourceCode,
  targetCode,
  result,
}: ProductCompareResultViewProps) {
  const matchPercentage = calculateMatchPercentage(result);
  const hasChecks = result.checkItems.length > 0;
  const statusLabel = result.metadata
    ? formatEquivalenceStatusLabel(result.metadata, { hasCheckItems: hasChecks })
    : formatCollapsedRiskHint(result.summary.riskLevel, hasChecks);
  const statusTone = result.metadata ? equivalenceStatusTone(result.metadata) : undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Karşılaştırma sonucu</Text>

      <View style={styles.codesRow}>
        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>Kaynak</Text>
          <Text style={styles.codeValue}>{sourceCode}</Text>
        </View>
        <Text style={styles.vs}>↔</Text>
        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>Hedef</Text>
          <Text style={styles.codeValue}>{targetCode}</Text>
        </View>
      </View>

      <View style={styles.matchRow}>
        <MatchPercentageRing match={matchPercentage} size={72} />
      </View>

      <View style={styles.badgeRow}>
        <RiskLevelBadge
          riskLevel={result.metadata ? undefined : result.summary.riskLevel}
          label={result.metadata ? statusLabel : undefined}
          tone={statusTone}
        />
      </View>

      <Text style={styles.summary}>{result.summary.summaryTr}</Text>

      {result.metadata ? (
        <CompatibilityMetadataBanner metadata={result.metadata} hasCheckItems={hasChecks} />
      ) : null}

      <CompatibilityComparisonSections result={result} differentTargetLabel="Hedef" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.surface.text,
  },
  codesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  codeBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  codeLabel: {
    ...typography.caption,
    color: colors.surface.textMuted,
    fontWeight: '700',
  },
  codeValue: {
    ...typography.code,
    color: colors.accent.blueLight,
    fontSize: 12,
  },
  vs: {
    color: colors.surface.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  matchRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  badgeRow: {
    alignItems: 'flex-start',
  },
  summary: {
    ...typography.bodySm,
    color: colors.surface.textSecondary,
    lineHeight: 20,
  },
});
