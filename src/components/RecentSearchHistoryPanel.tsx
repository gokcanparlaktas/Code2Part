import { Ionicons } from '@expo/vector-icons';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getSearchHistory } from '@/services/localSearchStore';
import type { SearchHistoryEntry } from '@/types/searchHistory';
import { colors, radius, spacing, typography } from '@/theme';
import { productCodeResultHref } from '@/utils/productCodeRouteParam';

const DEFAULT_LIMIT = 3;

interface RecentSearchHistoryPanelProps {
  limit?: number;
}

function formatSearchHistorySubtitle(entry: SearchHistoryEntry): string | null {
  const brand = entry.brand?.trim();
  const productType = entry.productType?.trim() || entry.series?.trim();

  if (brand && productType) {
    return `${brand} - ${productType}`;
  }
  if (brand) {
    return brand;
  }
  if (productType) {
    return productType;
  }
  return null;
}

function RecentSearchRow({
  entry,
  isLast,
}: {
  entry: SearchHistoryEntry;
  isLast: boolean;
}) {
  const subtitle = formatSearchHistorySubtitle(entry);

  return (
    <View style={styles.rowWrapper}>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push(productCodeResultHref(entry.originalInput))}
      >
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={20} color={colors.accent.orange} />
        </View>

        <View style={styles.rowText}>
          <Text style={styles.rowCode} numberOfLines={1}>
            {entry.originalInput}
          </Text>
          {subtitle ? (
            <Text style={styles.rowMeta} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.text.inverseFaint}
          style={styles.chevron}
        />
      </Pressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );
}

export function RecentSearchHistoryPanel({
  limit = DEFAULT_LIMIT,
}: RecentSearchHistoryPanelProps) {
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son Aramalar</Text>
        <Link href="/history" asChild>
          <Pressable style={({ pressed }) => [styles.viewAllLink, pressed && styles.viewAllPressed]}>
            <Text style={styles.viewAllText}>Tümü</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.list}>
        {searches.map((entry, index) => (
          <RecentSearchRow
            key={entry.id}
            entry={entry}
            isLast={index === searches.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignSelf: 'stretch',
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    width: '100%',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  viewAllLink: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  viewAllPressed: {
    opacity: 0.75,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.accent.blueLight,
    fontWeight: '700',
  },
  list: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    width: '100%',
  },
  rowWrapper: {
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    minHeight: 64,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    borderWidth: 1,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  rowText: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    gap: 4,
    minWidth: 0,
  },
  rowCode: {
    ...typography.bodySm,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  rowMeta: {
    ...typography.caption,
    color: colors.text.inverseMuted,
  },
  chevron: {
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
  divider: {
    backgroundColor: colors.border.subtle,
    height: 1,
    marginLeft: 40 + spacing.md,
  },
});
