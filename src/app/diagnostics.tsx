import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DemoDisclaimerNote } from '@/components/DemoDisclaimerNote';
import { validateCatalogV2 } from '@/domain/catalog/validateCatalogV2';
import { buildCanonicalCoverageDiagnostics } from '@/domain/diagnostics/canonicalCoverageDiagnostics';
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
  const validationV2 = useMemo(() => validateCatalogV2(), []);
  const canonicalCoverage = useMemo(() => buildCanonicalCoverageDiagnostics(), []);
  const topMissingMappings = canonicalCoverage.missingMappings.slice(0, 10);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DemoDisclaimerNote compact />

      <View
        style={[
          styles.statusCard,
          validationV2.isValid ? styles.statusOk : styles.statusError,
        ]}
      >
        <Text style={styles.statusTitle}>Çalışma kataloğu (v2)</Text>
        <Text style={styles.statusValue}>
          {validationV2.isValid ? 'Geçerli' : 'Hatalar var'}
        </Text>
        <Text style={styles.statusHint}>
          Uygulama tanımlama ve muadil aramada bu veri setini kullanır.
        </Text>
      </View>

      <View
        style={[
          styles.statusCard,
          validation.isValid ? styles.statusOk : styles.statusError,
        ]}
      >
        <Text style={styles.statusTitle}>Eski düz JSON (v1) — tanılama</Text>
        <Text style={styles.statusValue}>
          {validation.isValid ? 'Geçerli' : 'Hatalar var'}
        </Text>
        {validation.warnings.length > 0 ? (
          <Text style={styles.statusHint}>
            {validation.warnings.length} uyarı — yalnızca geliştirici kontrolü içindir.
          </Text>
        ) : null}
      </View>

      <View style={styles.countsCard}>
        <Text style={styles.countsTitle}>Katalog v2 kayıt sayıları</Text>
        <Text style={styles.countRow}>
          Ürün serisi: {validationV2.summary.productSeriesCount}
        </Text>
        <Text style={styles.countRow}>
          Parser kuralı: {validationV2.summary.parsingRulesCount}
        </Text>
        <Text style={styles.countRow}>
          Muadil grubu: {validationV2.summary.equivalenceGroupCount}
        </Text>
        <Text style={styles.countRow}>
          Fonksiyon eşlemesi: {validationV2.summary.functionMappingsCount}
        </Text>
        <Text style={styles.countRow}>
          Kontrol kuralı: {validationV2.summary.checkRulesCount}
        </Text>
      </View>

      <View style={styles.countsCard}>
        <Text style={styles.countsTitle}>Canonical sözlük kapsaması</Text>
        <Text style={styles.countRow}>
          Kapsama: %{canonicalCoverage.coveragePercent}
        </Text>
        <Text style={styles.countRow}>
          Çözülen alan: {canonicalCoverage.resolvedAttributes} /{' '}
          {canonicalCoverage.totalParsedAttributes}
        </Text>
        <Text style={styles.countRow}>
          Eksik mapping: {canonicalCoverage.unresolvedAttributes}
        </Text>
        <Text style={styles.countRow}>
          Katalog kontrolü gereken alan: {canonicalCoverage.requiresCatalogCheckCount}
        </Text>
        <Text style={styles.countRow}>
          Kontrol edilen kod: {canonicalCoverage.totalCheckedCodes}
        </Text>
        {canonicalCoverage.byCategory.map((row) => (
          <Text key={row.category} style={styles.countSubRow}>
            {row.category}: %{row.coveragePercent} ({row.resolved}/{row.total})
          </Text>
        ))}
        {topMissingMappings.length > 0 ? (
          <>
            <Text style={[styles.countsTitle, styles.subsectionTitle]}>
              En sık eksik mapping (ilk 10)
            </Text>
            {topMissingMappings.map((entry, index) => (
              <Text
                key={`${entry.attributeKey}-${entry.rawToken}-${entry.exampleCode}-${index}`}
                style={styles.countSubRow}
              >
                {entry.attributeKey}
                {entry.rawToken ? ` · ${entry.rawToken}` : ''}
                {entry.manufacturer ? ` · ${entry.manufacturer}` : ''}
              </Text>
            ))}
          </>
        ) : null}
      </View>

      <View style={styles.countsCard}>
        <Text style={styles.countsTitle}>Veri güvenilirliği özeti (v2)</Text>
        <Text style={styles.countRow}>
          Toplam kayıt: {validationV2.summary.reliability.totalRecords}
        </Text>
        <Text style={styles.countRow}>
          Kaynak doğrulanmış: {validationV2.summary.reliability.sourceVerifiedCount}
        </Text>
        <Text style={styles.countRow}>
          Manuel doğrulanmış: {validationV2.summary.reliability.manualVerifiedCount}
        </Text>
        <Text style={styles.countRow}>
          Manuel doğrulanmamış: {validationV2.summary.reliability.manualUnverifiedCount}
        </Text>
        <Text style={styles.countRow}>
          Mock: {validationV2.summary.reliability.mockCount}
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
  countSubRow: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  subsectionTitle: {
    fontSize: 14,
    marginBottom: 0,
    marginTop: 8,
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
