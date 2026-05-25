import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProductIdentification } from '@/types/product';
import { buildEvidenceDetailRows } from '@/utils/formatEvidence';

interface EvidenceDetailsProps {
  identification: ProductIdentification;
}

function EvidenceRow({
  label,
  value,
  evidenceLabel,
  explanation,
}: {
  label: string;
  value: string;
  evidenceLabel: string;
  explanation: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
      <Text style={styles.evidenceLabel}>{evidenceLabel}</Text>
      <Text style={styles.explanation}>{explanation}</Text>
    </View>
  );
}

export function EvidenceDetails({ identification }: EvidenceDetailsProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = buildEvidenceDetailRows(identification);

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.title}>Tespit Detayları</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {rows.map((row) => (
            <EvidenceRow key={row.label} {...row} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerPressed: {
    backgroundColor: '#F8FAFC',
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  chevron: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    gap: 14,
    padding: 16,
    paddingTop: 14,
  },
  row: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldValue: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
  },
  evidenceLabel: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  explanation: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});
