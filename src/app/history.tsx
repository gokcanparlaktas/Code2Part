import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import {
  getSearchHistory,
  getUnresolvedSearches,
} from '@/services/localSearchStore';
import type { SearchHistoryEntry, UnresolvedSearchEntry } from '@/types/searchHistory';
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

function HistoryRow({ entry }: { entry: SearchHistoryEntry }) {
  return (
    <Link href={productCodeResultHref(entry.originalInput)} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
        <View style={styles.rowHeader}>
          <Text style={styles.rowCode}>{entry.normalizedCode}</Text>
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
        </View>
        {entry.brand || entry.series ? (
          <Text style={styles.rowMeta}>
            {[entry.brand, entry.series].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text style={styles.rowDate}>
          {formatDate(entry.searchedAt)}
          {entry.confidence
            ? ` · Güven ${formatConfidencePercent(entry.confidence)}`
            : ''}
        </Text>
      </Pressable>
    </Link>
  );
}

function UnresolvedRow({ entry }: { entry: UnresolvedSearchEntry }) {
  return (
    <Link href={productCodeResultHref(entry.originalInput)} asChild>
      <Pressable style={({ pressed }) => [styles.unresolvedRow, pressed && styles.rowPressed]}>
        <Text style={styles.rowCode}>{entry.normalizedCode}</Text>
        <Text style={styles.rowDate}>{formatDate(entry.savedAt)}</Text>
      </Pressable>
    </Link>
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
      <Link href="/diagnostics" asChild>
        <Pressable style={({ pressed }) => [styles.diagnosticsLink, pressed && styles.rowPressed]}>
          <Text style={styles.diagnosticsLinkText}>Veri Kontrolü</Text>
        </Pressable>
      </Link>

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
  },
  content: {
    gap: 14,
    padding: 20,
    paddingBottom: 40,
  },
  diagnosticsLink: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  diagnosticsLinkText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    gap: 10,
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    gap: 6,
    padding: 14,
  },
  unresolvedRow: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCode: {
    color: '#0F172A',
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#475569',
    fontSize: 14,
  },
  rowDate: {
    color: '#94A3B8',
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusOk: {
    backgroundColor: '#DCFCE7',
  },
  statusFail: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextOk: {
    color: '#166534',
  },
  statusTextFail: {
    color: '#991B1B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
});
