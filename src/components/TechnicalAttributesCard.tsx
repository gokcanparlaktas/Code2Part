import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCanonicalDetailLines } from "@/domain/presentation/formatCanonicalDetailValue";
import { buildProductDetailRows } from "@/domain/presentation/buildProductDetailRows";
import type { ProductIdentification } from "@/types/product";

interface TechnicalAttributesCardProps {
  identification: ProductIdentification;
}

function DetailValueBlock({ value }: { value: string }) {
  const { primary, evidenceLines } = formatCanonicalDetailLines(value);

  return (
    <View style={styles.valueBlock}>
      <Text style={styles.fieldValue}>{primary}</Text>
      {evidenceLines.map((line) => (
        <Text key={line} style={styles.codeEvidence}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export function TechnicalAttributesCard({
  identification,
}: TechnicalAttributesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = useMemo(() => buildProductDetailRows(identification), [identification]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        onPress={() => setExpanded((current) => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.title}>Teknik özellikler</Text>
        <Text style={styles.chevron}>{expanded ? "▼" : "▶"}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.fieldLabel}>{row.label}</Text>
              <DetailValueBlock value={row.value} />
              <Text style={styles.meta}>
                {row.evidence}
                {row.requiresCheck ? " • Kontrol gerekli" : ""}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  headerPressed: {
    backgroundColor: "#F8FAFC",
  },
  title: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "700",
  },
  chevron: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 10,
    padding: 16,
    paddingTop: 12,
  },
  row: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    gap: 4,
    padding: 11,
  },
  valueBlock: {
    gap: 3,
  },
  fieldLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
  fieldValue: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  codeEvidence: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  meta: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
