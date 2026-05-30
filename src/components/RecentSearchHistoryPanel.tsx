import { Ionicons } from '@expo/vector-icons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getSearchHistory } from '@/services/localSearchStore';
import type { SearchHistoryEntry } from '@/types/searchHistory';
import { homeMonoFont } from '@/theme/homePalettes';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useTheme } from '@/theme/ThemeProvider';
import { useHomeStyles } from '@/theme/useHomeStyles';
import { productCodeResultHref } from '@/utils/productCodeRouteParam';

const DEFAULT_LIMIT = 3;

interface RecentSearchHistoryPanelProps {
  limit?: number;
  showDivider?: boolean;
}

type PanelStyles = ReturnType<typeof createStyles>;

function RecentSearchRow({
  entry,
  isLast,
  isLatest,
  styles,
}: {
  entry: SearchHistoryEntry;
  isLast: boolean;
  isLatest: boolean;
  styles: PanelStyles;
}) {
  const { homeColors } = useTheme();
  const brand = entry.brand?.trim();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowBorder,
        pressed && styles.rowPressed,
      ]}
      onPress={() => router.push(productCodeResultHref(entry.originalInput))}
    >
      <View style={[styles.dot, isLatest && styles.dotLatest]} />

      <Text style={styles.rowCode} numberOfLines={1}>
        {entry.originalInput}
      </Text>

      {brand ? (
        <View style={styles.brandBadge}>
          <Text style={styles.brandText} numberOfLines={1}>
            {brand}
          </Text>
        </View>
      ) : null}

      <Ionicons name="chevron-forward" size={14} color={homeColors.border} />
    </Pressable>
  );
}

export function RecentSearchHistoryPanel({
  limit = DEFAULT_LIMIT,
  showDivider = false,
}: RecentSearchHistoryPanelProps) {
  const styles = useHomeStyles(createStyles);
  const [searches, setSearches] = useState<SearchHistoryEntry[]>([]);

  const loadRecentSearches = useCallback(() => {
    void getSearchHistory().then((entries) => setSearches(entries.slice(0, limit)));
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
    }, [loadRecentSearches])
  );

  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {showDivider ? <View style={styles.divider} /> : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son aramalar</Text>
        <Link href="/history" asChild>
          <Pressable style={({ pressed }) => [styles.viewAllLink, pressed && styles.viewAllPressed]}>
            <Text style={styles.viewAllText}>Tümünü gör</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.list}>
        {searches.map((entry, index) => (
          <RecentSearchRow
            key={entry.id}
            entry={entry}
            isLast={index === searches.length - 1}
            isLatest={index === 0}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
    section: {
      alignSelf: 'stretch',
      gap: 10,
      width: '100%',
    },
    divider: {
      borderTopColor: c.border,
      borderTopWidth: 1,
      marginBottom: 18,
      marginTop: 18,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sectionTitle: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    viewAllLink: {
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    viewAllPressed: {
      opacity: 0.75,
    },
    viewAllText: {
      color: c.accent,
      fontSize: 12,
    },
    list: {
      alignSelf: 'stretch',
      width: '100%',
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 11,
    },
    rowBorder: {
      borderBottomColor: c.borderDark,
      borderBottomWidth: 1,
    },
    rowPressed: {
      opacity: 0.85,
    },
    dot: {
      backgroundColor: c.border,
      borderRadius: 4,
      flexShrink: 0,
      height: 8,
      width: 8,
    },
    dotLatest: {
      backgroundColor: c.accent,
    },
    rowCode: {
      color: c.brandBlue,
      flex: 1,
      fontFamily: homeMonoFont,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.3,
      minWidth: 0,
    },
    brandBadge: {
      backgroundColor: c.checkBlueBg,
      borderColor: c.checkBlueBorder,
      borderRadius: 5,
      borderWidth: 1,
      flexShrink: 0,
      maxWidth: 96,
      overflow: 'hidden',
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    brandText: {
      color: c.brandBlue,
      fontSize: 11,
      fontWeight: '600',
    },
  });
