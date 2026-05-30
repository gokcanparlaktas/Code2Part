import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import {
  getSearchHistory,
  getUnresolvedSearches,
} from '@/services/localSearchStore';
import type { SearchHistoryEntry, UnresolvedSearchEntry } from '@/types/searchHistory';
import { colors, radius, spacing, typography } from '@/theme';
import { formatConfidencePercent } from '@/utils/confidenceScore';
import { productCodeResultHref } from '@/utils/productCodeRouteParam';

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function HistoryRow({ entry }: { entry: SearchHistoryEntry }) {
  const subtitle = formatSearchHistorySubtitle(entry);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push(productCodeResultHref(entry.originalInput))}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowCode} numberOfLines={1}>
          {entry.originalInput}
        </Text>
        {subtitle ? (
          <Text style={styles.rowMeta} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.rowDate}>
          {formatDate(entry.searchedAt)}
          {entry.confidence
            ? ` · Güven ${formatConfidencePercent(entry.confidence)}`
            : ''}
        </Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          entry.identified ? styles.statusOk : styles.statusFail,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            entry.identified ? styles.statusTextOk : styles.statusTextFail,
          ]}
        >
          {entry.identified ? 'Tanımlandı' : 'Tanımsız'}
        </Text>
      </View>
    </Pressable>
  );
}

function UnresolvedRow({ entry }: { entry: UnresolvedSearchEntry }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.unresolvedRow, pressed && styles.rowPressed]}
      onPress={() => router.push(productCodeResultHref(entry.originalInput))}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowCode} numberOfLines={1}>
          {entry.originalInput}
        </Text>
        <Text style={styles.rowDate}>{formatDate(entry.savedAt)}</Text>
      </View>

      <View style={[styles.statusBadge, styles.statusFail]}>
        <Text style={[styles.statusText, styles.statusTextFail]}>Tanımsız</Text>
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [searches, setSearches] = useState<SearchHistoryEntry[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedSearchEntry[]>([]);

  const loadHistory = useCallback(() => {
    void getSearchHistory().then(setSearches);
    void getUnresolvedSearches().then(setUnresolved);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.subtitle}>Son yapılan ürün kodu aramaları</Text>

      {searches.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Henüz arama geçmişi yok.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {searches.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Tanımlanamayan Kodlar</Text>
      <Text style={styles.sectionSubtitle}>
        Daha sonra veri setine eklenebilecek kayıtlı kodlar
      </Text>

      {unresolved.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Kayıtlı tanımsız kod yok.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {unresolved.map((entry) => (
            <UnresolvedRow key={entry.id} entry={entry} />
          ))}
        </View>
      )}

      <DemoDisclaimerNote compact />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  content: {
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.inverseMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.inverse,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.bodySm,
    color: colors.text.inverseMuted,
    lineHeight: 20,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    width: '100%',
  },
  unresolvedRow: {
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderColor: colors.compat.check.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    width: '100%',
  },
  rowPressed: {
    opacity: 0.88,
  },
  rowContent: {
    flex: 1,
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  rowCode: {
    ...typography.body,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  rowMeta: {
    ...typography.bodySm,
    color: colors.text.inverseMuted,
  },
  rowDate: {
    ...typography.caption,
    color: colors.text.inverseFaint,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statusOk: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
  },
  statusFail: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 16,
    textAlignVertical: 'center',
  },
  statusTextOk: {
    color: colors.accent.greenBright,
  },
  statusTextFail: {
    color: '#FCA5A5',
  },
  emptyCard: {
    backgroundColor: colors.background.card,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.text.inverseMuted,
    textAlign: 'center',
  },
});
