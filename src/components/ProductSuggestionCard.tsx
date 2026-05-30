import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatSuggestionCardHint,
  formatSuggestionMissingStatus,
  isSeriesNameOnlySuggestion,
} from '@/domain/presentation/suggestionDisplay';
import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import type { SuggestedProduct } from '@/types/suggestion';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';

interface ProductSuggestionCardProps {
  query: string;
  suggestion: SuggestedProduct;
  onPress: () => void;
  isLast?: boolean;
}

export function ProductSuggestionCard({
  query,
  suggestion,
  onPress,
  isLast = false,
}: ProductSuggestionCardProps) {
  const styles = useHomeStyles(createStyles);
  const { homeColors } = useTheme();
  const { detectedAttributes } = suggestion;
  const isExactCodeMatch = suggestion.matchedBy === 'exact_match';
  const isSeriesFound = isSeriesNameOnlySuggestion(suggestion);
  const matchPercentage = matchPercentageFromSuggestion(query, suggestion);
  const modelCode = suggestion.exampleCodeFormat?.trim() ?? '';
  const progress = Math.max(0, Math.min(100, matchPercentage.percentage));

  const statusLine = !isExactCodeMatch ? formatSuggestionMissingStatus(suggestion) : null;
  const hasBore = detectedAttributes.boreMm !== undefined;
  const hasStroke = detectedAttributes.strokeMm !== undefined;
  const hintText = formatSuggestionCardHint(suggestion.suggestionTextTr ?? '');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.chipBox, styles.matchPill, { borderColor: matchPercentage.color }]}>
        <Text style={[styles.chipText, styles.matchText, { color: matchPercentage.color }]}>
          %{progress}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.chipBox, styles.brandChip]}>
          <Text style={[styles.chipText, styles.brandText]} numberOfLines={1}>
            {suggestion.brand}
          </Text>
        </View>
        {modelCode ? (
          <Text style={styles.code} numberOfLines={2}>
            {modelCode}
          </Text>
        ) : (
          <Text style={styles.series} numberOfLines={1}>
            {suggestion.series}
          </Text>
        )}

        <Text style={styles.productType} numberOfLines={1}>
          {suggestion.productTypeTr}
        </Text>

        <Text style={styles.standardLine} numberOfLines={1}>
          Standart: {suggestion.standardFamily}
        </Text>

        {hasBore || hasStroke ? (
          <View style={styles.attrRow}>
            {hasBore ? (
              <Text style={styles.attrText}>Çap: {detectedAttributes.boreMm} mm</Text>
            ) : null}
            {hasBore && hasStroke ? <Text style={styles.attrSep}>·</Text> : null}
            {hasStroke ? (
              <Text style={styles.attrText}>Strok: {detectedAttributes.strokeMm} mm</Text>
            ) : null}
          </View>
        ) : null}

        {statusLine ? (
          <Text
            style={[styles.statusLine, isSeriesFound && styles.statusLinePositive]}
            numberOfLines={2}
          >
            {statusLine}
          </Text>
        ) : null}

        {hintText ? (
          <Text style={styles.hintLine} numberOfLines={2}>
            {hintText}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={14} color={homeColors.border} style={styles.chevron} />
    </Pressable>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 12,
    },
    rowBorder: {
      borderBottomColor: c.borderDark,
      borderBottomWidth: 1,
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
    matchText: {},
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
    series: {
      color: c.brandBlue,
      fontSize: 13,
      fontWeight: '600',
    },
    productType: {
      color: c.textPrimary,
      fontSize: 12,
      fontWeight: '500',
    },
    standardLine: {
      color: c.textMuted,
      fontSize: 11,
    },
    attrRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    attrText: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: '600',
    },
    attrSep: {
      color: c.textDim,
      fontSize: 11,
    },
    statusLine: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
    },
    statusLinePositive: {
      color: c.accent,
    },
    hintLine: {
      color: c.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    chevron: {
      marginTop: 4,
    },
  });
