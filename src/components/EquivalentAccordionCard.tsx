import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MATCH_PERCENTAGE_RING_SIZE,
  MatchPercentageRing,
} from '@/components/common/MatchPercentageRing';
import { CompatibilityComparisonSections } from '@/components/CompatibilityComparisonSections';
import { CompatibilityMetadataBanner } from '@/components/CompatibilityMetadataBanner';
import { formatCollapsedEquivalentCheckHint } from '@/domain/presentation/formatCollapsedEquivalentCheckHint';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';
import {
  equivalenceStatusTone,
  formatEquivalenceStatusLabel,
} from '@/domain/presentation/formatCompatibilityMetadata';
import { formatCollapsedRiskHint } from '@/utils/formatRisk';
import { colors, radius, shadows, spacing, typography } from '@/theme';

import { RiskLevelBadge } from './RiskLevelBadge';

interface EquivalentAccordionCardProps {
  result: CompatibilityResult;
  expanded: boolean;
  loading?: boolean;
  onToggle: () => void;
}

export function EquivalentAccordionCard({
  result,
  expanded,
  loading = false,
  onToggle,
}: EquivalentAccordionCardProps) {
  const { candidate, summary } = result;
  const hasChecks = result.checkItems.length > 0;
  const modelCode = candidate.suggestedCode ?? 'Model oluşturulamadı';
  const statusLabel = result.metadata
    ? formatEquivalenceStatusLabel(result.metadata, { hasCheckItems: hasChecks })
    : formatCollapsedRiskHint(summary.riskLevel, hasChecks);
  const statusTone = result.metadata
    ? equivalenceStatusTone(result.metadata)
    : undefined;
  const matchPercentage = calculateMatchPercentage(result);
  const collapsedCheckHint = formatCollapsedEquivalentCheckHint(result.checkItems.length);

  return (
    <View style={styles.cardShell}>
      <View style={[styles.card, expanded && styles.cardExpanded]}>
        <Pressable
          style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <View style={styles.headerTop}>
            <View style={styles.titleBlock}>
              <Text style={styles.brandSeries}>{candidate.brand}</Text>
              <Text style={styles.modelLine}>
                <Text style={styles.modelLabel}>Model </Text>
                {modelCode}
              </Text>
              {collapsedCheckHint ? (
                <View style={styles.riskHintSlot} pointerEvents="none">
                  <Text
                    style={[styles.riskHint, expanded && styles.riskHintHidden]}
                    numberOfLines={1}
                  >
                    {collapsedCheckHint}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.headerTrailing}>
              <View style={styles.ringColumn}>
                <MatchPercentageRing match={matchPercentage} />
              </View>
              <View style={styles.chevronAlign}>
                <Text style={styles.chevron}>{expanded ? '−' : '+'}</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.body}>
            {loading ? (
              <Text style={styles.loadingText}>Detaylı karşılaştırma yükleniyor…</Text>
            ) : null}
            <View style={styles.riskBadgeRow}>
              <RiskLevelBadge
                riskLevel={result.metadata ? undefined : summary.riskLevel}
                label={result.metadata ? statusLabel : undefined}
                tone={statusTone}
              />
            </View>
            <Text style={styles.summaryText}>{summary.summaryTr}</Text>

            {result.metadata ? (
              <CompatibilityMetadataBanner
                metadata={result.metadata}
                hasCheckItems={hasChecks}
              />
            ) : null}

            <CompatibilityComparisonSections result={result} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: radius.lg,
    ...shadows.subtle,
  },
  card: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.accentLight,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  cardExpanded: {
    borderColor: colors.accent.orange,
  },
  header: {
    minHeight: MATCH_PERCENTAGE_RING_SIZE + spacing.lg * 2,
    padding: spacing.lg,
  },
  headerPressed: {
    backgroundColor: colors.background.elevated,
  },
  headerTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    gap: 3,
    paddingRight: spacing.sm,
  },
  brandSeries: {
    ...typography.h2,
    color: colors.surface.text,
  },
  headerTrailing: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ringColumn: {
    alignItems: 'center',
  },
  chevronAlign: {
    height: MATCH_PERCENTAGE_RING_SIZE,
    justifyContent: 'center',
  },
  chevron: {
    color: colors.surface.textMuted,
    fontSize: 18,
    fontWeight: '300',
    width: 18,
  },
  modelLine: {
    ...typography.code,
    color: colors.accent.blueLight,
    fontSize: 14,
  },
  modelLabel: {
    color: colors.surface.textMuted,
    fontFamily: undefined,
    fontWeight: '600',
  },
  riskHintSlot: {
    justifyContent: 'center',
    minHeight: 20,
  },
  riskHint: {
    ...typography.bodySm,
    color: colors.match.medium,
    fontWeight: '600',
  },
  riskHintHidden: {
    opacity: 0,
  },
  body: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  riskBadgeRow: {
    alignItems: 'flex-start',
  },
  summaryText: {
    ...typography.body,
    color: colors.surface.textSecondary,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.surface.textMuted,
    fontStyle: 'italic',
  },
});
