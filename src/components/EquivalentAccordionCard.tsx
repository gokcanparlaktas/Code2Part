import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompatibilityComparisonSections } from '@/components/CompatibilityComparisonSections';
import { CompatibilityMetadataChips } from '@/components/CompatibilityMetadataChips';
import { formatCollapsedEquivalentCheckHint } from '@/domain/presentation/formatCollapsedEquivalentCheckHint';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';
import {
  equivalenceStatusTone,
  formatEquivalenceStatusLabel,
} from '@/domain/presentation/formatCompatibilityMetadata';
import { formatProductCategoryDisplayValue } from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { formatCollapsedRiskHint } from '@/utils/formatRisk';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

import { RiskLevelBadge } from './RiskLevelBadge';

interface EquivalentAccordionCardProps {
  result: CompatibilityResult;
  expanded: boolean;
  isLast?: boolean;
  onToggle: () => void;
}

export function EquivalentAccordionCard({
  result,
  expanded,
  isLast = false,
  onToggle,
}: EquivalentAccordionCardProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
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
  const progress = Math.max(0, Math.min(100, matchPercentage.percentage));
  const collapsedCheckHint = formatCollapsedEquivalentCheckHint(result.checkItems.length);
  const standardDisplay =
    candidate.standardFamily.trim() ||
    candidate.targetIdentification?.standardFamily?.value?.trim() ||
    '';
  const productTypeDisplay =
    formatProductCategoryDisplayValue(candidate.productCategory, candidate.productType) ||
    candidate.productType.trim();

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View
          style={[
            styles.chipBox,
            styles.matchPill,
            { borderColor: matchPercentage.color },
          ]}
        >
          <Text style={[styles.chipText, { color: matchPercentage.color }]}>
            %{progress}
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.chipBox, styles.brandChip]}>
            <Text style={[styles.chipText, styles.brandText]} numberOfLines={1}>
              {candidate.brand}
            </Text>
          </View>
          <Text style={styles.code} numberOfLines={2}>
            {modelCode}
          </Text>

          {productTypeDisplay ? (
            <Text style={styles.productType} numberOfLines={1}>
              {productTypeDisplay}
            </Text>
          ) : null}

          {standardDisplay ? (
            <Text style={styles.standardLine} numberOfLines={1}>
              Standart: {standardDisplay}
            </Text>
          ) : null}

          {collapsedCheckHint ? (
            <Text style={styles.statusLine} numberOfLines={1}>
              {collapsedCheckHint}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={14}
          color={homeColors.border}
          style={styles.chevron}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <View style={styles.riskBadgeRow}>
            <RiskLevelBadge
              riskLevel={result.metadata ? undefined : summary.riskLevel}
              label={result.metadata ? statusLabel : undefined}
              tone={statusTone}
              variant="dark"
            />
          </View>

          <Text style={styles.summaryText}>{summary.summaryTr}</Text>

          {result.metadata ? (
            <CompatibilityMetadataChips metadata={result.metadata} />
          ) : null}

          <CompatibilityComparisonSections result={result} variant="compare" />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    item: {
      backgroundColor: c.cardBg,
    },
    itemBorder: {
      borderBottomColor: c.borderDark,
      borderBottomWidth: 1,
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 10,
    },
    rowPressed: {
      opacity: 0.85,
    },
    chipBox: {
      alignItems: 'center',
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 5,
      borderWidth: 1,
      flexShrink: 0,
      height: 28,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 56,
    },
    matchPill: {
      alignSelf: 'flex-start',
    },
    chipText: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
    content: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    brandChip: {
      alignSelf: 'flex-start',
      backgroundColor: c.checkBlueBg,
      borderColor: c.checkBlueBorder,
      height: undefined,
      minHeight: 28,
      paddingHorizontal: 8,
      width: undefined,
    },
    brandText: {
      color: c.brandBlue,
      fontWeight: '700',
      paddingHorizontal: 4,
    },
    code: {
      color: c.brandBlue,
      fontFamily: homeMonoFont,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    productType: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: '500',
    },
    standardLine: {
      color: c.textMuted,
      fontSize: 11,
    },
    statusLine: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
    },
    chevron: {
      marginTop: 2,
    },
    body: {
      gap: 12,
      paddingBottom: 12,
    },
    riskBadgeRow: {
      alignItems: 'flex-start',
    },
    summaryText: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
  });
