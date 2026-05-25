import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { validateCatalog } from '@/domain/validation/validateCatalog';
import type { ValidationIssue } from '@/types/validation';

function IssueList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: ValidationIssue[];
  emptyText: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyText}</Text>
      ) : (
        items.map((item, index) => (
          <View
            key={`${item.code}-${item.relatedId ?? index}`}
            style={[
              styles.issueCard,
              item.level === 'error' ? styles.issueError : styles.issueWarning,
            ]}
          >
            <Text style={styles.issueCode}>{item.code}</Text>
            <Text style={styles.issueMessage}>{item.messageTr}</Text>
            {item.relatedId ? (
              <Text style={styles.issueRelated}>İlgili: {item.relatedId}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

export default function DiagnosticsScreen() {
  const validation = useMemo(() => validateCatalog(), []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.statusCard,
          validation.isValid ? styles.statusOk : styles.statusError,
        ]}
      >
        <Text style={styles.statusTitle}>Katalog doğrulama durumu</Text>
        <Text style={styles.statusValue}>
          {validation.isValid ? 'Geçerli' : 'Hatalar var'}
        </Text>
        {validation.warnings.length > 0 ? (
          <Text style={styles.statusHint}>
            {validation.warnings.length} uyarı mevcut — uygulama çalışmaya devam eder.
          </Text>
        ) : null}
      </View>

      <View style={styles.countsCard}>
        <Text style={styles.countsTitle}>Kayıt sayıları</Text>
        <Text style={styles.countRow}>
          Ürün serisi: {validation.summary.productSeriesCount}
        </Text>
        <Text style={styles.countRow}>
          Parser kuralı: {validation.summary.parsingRulesCount}
        </Text>
        <Text style={styles.countRow}>
          Muadil grubu: {validation.summary.equivalenceGroupCount}
        </Text>
        <Text style={styles.countRow}>
          Muadil bağlantısı: {validation.summary.equivalentLinksCount}
        </Text>
      </View>

      <IssueList
        title={`Hatalar (${validation.errors.length})`}
        items={validation.errors}
        emptyText="Hata bulunamadı."
      />

      <IssueList
        title={`Uyarılar (${validation.warnings.length})`}
        items={validation.warnings}
        emptyText="Uyarı bulunamadı."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 14,
    gap: 6,
    padding: 18,
  },
  statusOk: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
  },
  statusError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  statusTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statusHint: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  countsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    gap: 8,
    padding: 18,
  },
  countsTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  countRow: {
    color: '#334155',
    fontSize: 15,
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
  issueCard: {
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  issueError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  issueWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  issueCode: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  issueMessage: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 21,
  },
  issueRelated: {
    color: '#64748B',
    fontSize: 13,
  },
});
