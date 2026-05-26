import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import type { ProductIdentification } from '@/types/product';
import type { AttributeEvidenceSource, TechnicalAttribute } from '@/types/technicalAttribute';

interface TechnicalAttributesCardProps {
  identification: ProductIdentification;
}

const EVIDENCE_LABELS: Record<AttributeEvidenceSource, string> = {
  code: 'Koddan alındı',
  series_table: 'Seri bilgisinden',
  standard: 'Standart bilgisinden',
  inferred: 'Tahmini',
  unknown: 'Doğrulanamadı',
};

const CONFIDENCE_LABELS: Record<TechnicalAttribute['confidence'], string> = {
  high: 'Yüksek güven',
  medium: 'Orta güven',
  low: 'Düşük güven',
  unknown: 'Belirsiz',
};

function formatValue(value: TechnicalAttribute['value'], unit?: string): string {
  if (value === null) {
    return 'Doğrulanamadı';
  }
  if (typeof value === 'boolean') {
    return value ? 'Evet' : 'Hayır';
  }
  return unit ? `${value} ${unit}` : String(value);
}

function AttributeRow({ attribute }: { attribute: TechnicalAttribute }) {
  return (
    <View style={styles.row}>
      <Text style={styles.fieldLabel}>{attribute.label}</Text>
      <Text style={styles.fieldValue}>{formatValue(attribute.value, attribute.unit)}</Text>
      <Text style={styles.meta}>
        {EVIDENCE_LABELS[attribute.evidence]} • {CONFIDENCE_LABELS[attribute.confidence]}
      </Text>
      {attribute.note ? <Text style={styles.note}>{attribute.note}</Text> : null}
    </View>
  );
}

export function TechnicalAttributesCard({ identification }: TechnicalAttributesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const attributes = useMemo(
    () => getTechnicalAttributes(identification),
    [identification]
  );

  if (attributes.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.title}>Teknik özellikler</Text>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {attributes.map((attribute) => (
            <AttributeRow key={attribute.key} attribute={attribute} />
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
    gap: 10,
    padding: 16,
    paddingTop: 12,
  },
  row: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    gap: 4,
    padding: 11,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  fieldValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  note: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
});

