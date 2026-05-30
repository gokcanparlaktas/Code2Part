import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { CompareMatchDonut } from '@/components/CompareMatchDonut';
import { CompatibilityComparisonSections } from '@/components/CompatibilityComparisonSections';
import { CompatibilityMetadataChips } from '@/components/CompatibilityMetadataChips';
import { formatEquivalenceStatusLabel } from '@/domain/presentation/formatCompatibilityMetadata';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';
import { formatCollapsedRiskHint } from '@/utils/formatRisk';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface ProductCompareResultViewProps {
  sourceCode: string;
  targetCode: string;
  result: CompatibilityResult;
}

type VerdictKind = 'compatible' | 'incompatible' | 'check';

function resolveVerdict(
  result: CompatibilityResult,
  hasChecks: boolean
): { kind: VerdictKind; label: string } {
  if (result.metadata) {
    const label = formatEquivalenceStatusLabel(result.metadata, { hasCheckItems: hasChecks });
    if (
      result.metadata.compatibilityLevel === 'not_compatible' ||
      label.toLowerCase().includes('uyumsuz')
    ) {
      return { kind: 'incompatible', label: 'Uyumsuz' };
    }
    if (
      result.metadata.compatibilityLevel === 'high' &&
      result.metadata.confidenceLevel === 'high' &&
      result.metadata.dataCompleteness === 'high' &&
      !hasChecks &&
      !label.toLowerCase().includes('kontrol')
    ) {
      return { kind: 'compatible', label: 'Uyumlu' };
    }
    return { kind: 'check', label: 'Kontrol gerekli' };
  }

  const legacyLabel = formatCollapsedRiskHint(result.summary.riskLevel, hasChecks);
  if (result.summary.riskLevel === 'high') {
    return { kind: 'incompatible', label: 'Uyumsuz' };
  }
  if (result.summary.riskLevel === 'low' && !hasChecks) {
    return { kind: 'compatible', label: legacyLabel.includes('Yüksek') ? 'Uyumlu' : legacyLabel };
  }
  return { kind: 'check', label: 'Kontrol gerekli' };
}

export function ProductCompareResultView({
  sourceCode,
  targetCode,
  result,
}: ProductCompareResultViewProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const matchPercentage = calculateMatchPercentage(result);
  const hasChecks = result.checkItems.length > 0;
  const verdict = resolveVerdict(result, hasChecks);

  const verdictStyle =
    verdict.kind === 'compatible'
      ? { badge: styles.verdictCompatible, text: styles.verdictCompatibleText }
      : verdict.kind === 'incompatible'
        ? { badge: styles.verdictIncompatible, text: styles.verdictIncompatibleText }
        : { badge: styles.verdictCheck, text: styles.verdictCheckText };

  return (
    <View style={styles.root}>
      <View style={styles.codesSection}>
        <View style={styles.codesRow}>
          <View style={styles.codeBlock}>
            <Text style={styles.codeRole}>Kaynak</Text>
            <Text style={styles.codeValue} numberOfLines={2}>
              {sourceCode}
            </Text>
          </View>

          <Ionicons name="swap-horizontal-outline" size={18} color={homeColors.textDim} />

          <View style={[styles.codeBlock, styles.codeBlockTarget]}>
            <Text style={[styles.codeRole, styles.codeRoleTarget]}>Hedef</Text>
            <Text style={[styles.codeValue, styles.codeValueTarget]} numberOfLines={2}>
              {targetCode}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.scoreRow}>
          <CompareMatchDonut percentage={matchPercentage.percentage} />

          <View style={styles.scoreMeta}>
            <View style={[styles.verdictBadge, verdictStyle.badge]}>
              <Text style={[styles.verdictText, verdictStyle.text]}>{verdict.label}</Text>
            </View>
            <Text style={styles.summary}>{result.summary.summaryTr}</Text>
          </View>
        </View>
      </View>

      {result.metadata ? <CompatibilityMetadataChips metadata={result.metadata} /> : null}

      <View style={styles.compatSection}>
        <CompatibilityComparisonSections
          result={result}
          differentTargetLabel="Hedef"
          variant="compare"
        />
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    root: {
      gap: 12,
    },
    codesSection: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    codesRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    codeBlock: {
      flex: 1,
      gap: 4,
    },
    codeBlockTarget: {
      alignItems: 'flex-end',
    },
    codeRole: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.05,
      textTransform: 'uppercase',
    },
    codeRoleTarget: {
      textAlign: 'right',
    },
    codeValue: {
      color: c.brandBlue,
      fontFamily: homeMonoFont,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    codeValueTarget: {
      textAlign: 'right',
    },
    scoreSection: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    scoreRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
    },
    scoreMeta: {
      flex: 1,
      gap: 6,
    },
    verdictBadge: {
      alignSelf: 'flex-start',
      borderRadius: 5,
      borderWidth: 1,
      marginBottom: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    verdictCompatible: {
      backgroundColor: c.greenBg,
      borderColor: c.greenBorder,
    },
    verdictCompatibleText: {
      color: c.green,
    },
    verdictIncompatible: {
      backgroundColor: c.redBg,
      borderColor: c.redBorder,
    },
    verdictIncompatibleText: {
      color: c.red,
    },
    verdictCheck: {
      backgroundColor: c.checkBlueBg,
      borderColor: c.checkBlueBorder,
    },
    verdictCheckText: {
      color: c.checkBlue,
    },
    verdictText: {
      fontSize: 11,
      fontWeight: '500',
      letterSpacing: 0.05,
    },
    summary: {
      color: c.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    compatSection: {
      backgroundColor: c.cardBg,
      borderColor: c.border,
      borderRadius: 8,
      borderWidth: 1,
      overflow: 'hidden',
      paddingHorizontal: 14,
    },
  });
