import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  MATCH_PERCENTAGE_RING_SIZE,
  MatchPercentageRing,
} from "@/components/common/MatchPercentageRing";
import { CompatibilityMetadataBanner } from "@/components/CompatibilityMetadataBanner";
import { buildLegacyMatchScoreFootnote } from "@/domain/presentation/formatCompatibilityMetadata";
import { formatCollapsedEquivalentCheckHint } from "@/domain/presentation/formatCollapsedEquivalentCheckHint";
import { groupCheckItemsByImportance } from "@/domain/presentation/groupCheckItemsByImportance";
import { calculateMatchPercentage } from "@/domain/scoring/calculateMatchPercentage";
import type {
  AttributeComparison,
  CheckItem,
  CompatibilityResult,
} from "@/types/compatibility";
import {
  equivalenceStatusTone,
  formatEquivalenceStatusLabel,
} from "@/domain/presentation/formatCompatibilityMetadata";
import { formatCollapsedRiskHint } from "@/utils/formatRisk";

import { RiskLevelBadge } from "./RiskLevelBadge";

type CheckRowVariant = "critical" | "important" | "optional";
type AccordionVariant = "default" | "compatible" | "different" | "critical" | "important";

function checkRowVariant(severity: CheckItem["severity"]): CheckRowVariant {
  if (severity === "high") {
    return "critical";
  }
  if (severity === "low") {
    return "optional";
  }
  return "important";
}

interface EquivalentAccordionCardProps {
  result: CompatibilityResult;
  expanded: boolean;
  loading?: boolean;
  onToggle: () => void;
}

function CompatibleRow({ item }: { item: AttributeComparison }) {
  const sameDisplay = item.sourceDisplay === item.targetDisplay;
  const valueLine = sameDisplay
    ? item.sourceDisplay
    : `${item.sourceDisplay} → ${item.targetDisplay}`;

  return (
    <View style={styles.compatibleRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.rowValue}>{valueLine}</Text>
    </View>
  );
}

function DifferentRow({ item }: { item: AttributeComparison }) {
  return (
    <View style={styles.differentRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={styles.rowValue}>
        Kaynak: {item.sourceDisplay} → Muadil: {item.targetDisplay}
      </Text>
    </View>
  );
}

function CheckRow({ item }: { item: CheckItem }) {
  const variant = checkRowVariant(item.severity);

  return (
    <View
      style={[
        styles.checkRow,
        variant === "critical" && styles.checkRowCritical,
        variant === "important" && styles.checkRowImportant,
        variant === "optional" && styles.checkRowOptional,
      ]}
    >
      <Text style={styles.checkField}>{item.field}</Text>
      <Text
        style={[
          styles.checkReason,
          variant === "critical" && styles.checkReasonCritical,
          variant === "important" && styles.checkReasonImportant,
          variant === "optional" && styles.checkReasonOptional,
        ]}
      >
        {item.reasonTr}
      </Text>
    </View>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  variant = "default",
  nested = false,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  variant?: AccordionVariant;
  nested?: boolean;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <View
      style={[
        styles.accordionCard,
        nested && styles.accordionCardNested,
        variant === "compatible" && styles.accordionCardCompatible,
        variant === "different" && styles.accordionCardDifferent,
        variant === "critical" && styles.accordionCardCritical,
        variant === "important" && styles.accordionCardImportant,
      ]}
    >
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.accordionHeader,
          variant === "compatible" && styles.accordionHeaderCompatible,
          variant === "different" && styles.accordionHeaderDifferent,
          variant === "critical" && styles.accordionHeaderCritical,
          variant === "important" && styles.accordionHeaderImportant,
          pressed && styles.headerPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text
          style={[
            styles.accordionTitle,
            variant === "compatible" && styles.accordionTitleCompatible,
            variant === "different" && styles.accordionTitleDifferent,
            variant === "critical" && styles.accordionTitleCritical,
            variant === "important" && styles.accordionTitleImportant,
          ]}
        >
          {title} ({count})
        </Text>
        <Text style={styles.accordionChevron}>{open ? "▼" : "▶"}</Text>
      </Pressable>
      {open ? (
        <View style={[styles.accordionBody, nested && styles.accordionBodyNested]}>
          {isEmpty ? <Text style={styles.empty}>{emptyMessage}</Text> : children}
        </View>
      ) : null}
    </View>
  );
}

export function EquivalentAccordionCard({
  result,
  expanded,
  loading = false,
  onToggle,
}: EquivalentAccordionCardProps) {
  const { candidate, summary } = result;
  const hasChecks = result.checkItems.length > 0;
  const modelCode = candidate.suggestedCode ?? "Model oluşturulamadı";
  const statusLabel = result.metadata
    ? formatEquivalenceStatusLabel(result.metadata, { hasCheckItems: hasChecks })
    : formatCollapsedRiskHint(summary.riskLevel, hasChecks);
  const statusTone = result.metadata
    ? equivalenceStatusTone(result.metadata)
    : undefined;
  const matchPercentage = calculateMatchPercentage(result);
  const legacyScoreFootnote = buildLegacyMatchScoreFootnote(
    result.metadata,
    matchPercentage.level
  );
  const groupedChecks = groupCheckItemsByImportance(result.checkItems);
  const collapsedCheckHint = expanded
    ? null
    : formatCollapsedEquivalentCheckHint(result.checkItems.length);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleBlock}>
            <Text style={styles.brandSeries}>{candidate.brand}</Text>
            <Text style={styles.modelLine}>
              <Text style={styles.modelLabel}>Model: </Text>
              {modelCode}
            </Text>
            {!expanded && collapsedCheckHint ? (
              <Text style={styles.riskHint}>{collapsedCheckHint}</Text>
            ) : null}
          </View>
          <View style={styles.headerTrailing}>
            <View style={styles.ringColumn}>
              <MatchPercentageRing match={matchPercentage} />
              {legacyScoreFootnote ? (
                <Text style={styles.legacyScoreFootnote}>{legacyScoreFootnote}</Text>
              ) : null}
            </View>
            <View style={styles.chevronAlign}>
              <Text style={styles.chevron}>{expanded ? "▼" : "▶"}</Text>
            </View>
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {loading ? (
            <Text style={styles.loadingText}>Detaylı karşılaştırma yükleniyor…</Text>
          ) : null}
          <View style={styles.riskBadgeRow}>
            <RiskLevelBadge
              riskLevel={result.metadata ? undefined : summary.riskLevel}
              label={result.metadata ? statusLabel : undefined}
              tone={statusTone}
            />
          </View>
          <Text style={styles.summaryText}>{summary.summaryTr}</Text>

          {result.metadata ? (
            <CompatibilityMetadataBanner
              metadata={result.metadata}
              hasCheckItems={hasChecks}
            />
          ) : null}

          <View style={styles.sections}>
            <CollapsibleSection
              title="Uyumlu"
              count={result.compatible.length}
              variant="compatible"
              isEmpty={result.compatible.length === 0}
              emptyMessage="Bu bölümde uyumlu madde yok."
            >
              <View style={styles.rowGroup}>
                {result.compatible.map((item) => (
                  <CompatibleRow key={item.label} item={item} />
                ))}
              </View>
            </CollapsibleSection>

            <CollapsibleSection
              title="Uyumsuz"
              count={result.different.length}
              variant="different"
              isEmpty={result.different.length === 0}
              emptyMessage="Bu bölümde farklı madde yok."
            >
              <View style={styles.rowGroup}>
                {result.different.map((item) => (
                  <DifferentRow key={item.label} item={item} />
                ))}
              </View>
            </CollapsibleSection>

            <CollapsibleSection
              title="Dikkat Edilmesi Gerekenler"
              count={result.checkItems.length}
              isEmpty={result.checkItems.length === 0}
              emptyMessage="Bu bölümde kontrol gerektiren madde yok."
            >
              <View style={styles.nestedSections}>
                {groupedChecks.critical.length > 0 ? (
                  <CollapsibleSection
                    title="Kritik kontroller"
                    count={groupedChecks.critical.length}
                    variant="critical"
                    nested
                    isEmpty={false}
                    emptyMessage=""
                  >
                    <View style={styles.rowGroup}>
                      {groupedChecks.critical.map((item) => (
                        <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} />
                      ))}
                    </View>
                  </CollapsibleSection>
                ) : null}

                {groupedChecks.important.length > 0 ? (
                  <CollapsibleSection
                    title="Kontrol gerekli"
                    count={groupedChecks.important.length}
                    variant="important"
                    nested
                    isEmpty={false}
                    emptyMessage=""
                  >
                    <View style={styles.rowGroup}>
                      {groupedChecks.important.map((item) => (
                        <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} />
                      ))}
                    </View>
                  </CollapsibleSection>
                ) : null}

                {groupedChecks.optional.length > 0 ? (
                  <View style={styles.rowGroup}>
                    {groupedChecks.optional.map((item) => (
                      <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} />
                    ))}
                  </View>
                ) : null}
              </View>
            </CollapsibleSection>
          </View>
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
  cardExpanded: {
    borderColor: "#93C5FD",
  },
  header: {
    padding: 16,
  },
  headerPressed: {
    backgroundColor: "#F8FAFC",
  },
  headerTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  brandSeries: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  headerTrailing: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 4,
  },
  ringColumn: {
    alignItems: "center",
    maxWidth: 112,
  },
  legacyScoreFootnote: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 12,
    marginTop: 4,
    textAlign: "center",
  },
  chevronAlign: {
    height: MATCH_PERCENTAGE_RING_SIZE,
    justifyContent: "center",
  },
  chevron: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    width: 14,
  },
  modelLine: {
    color: "#1E40AF",
    fontSize: 15,
    fontWeight: "600",
  },
  modelLabel: {
    color: "#64748B",
    fontWeight: "600",
  },
  riskHint: {
    color: "#B45309",
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 16,
    padding: 16,
    paddingTop: 14,
  },
  riskBadgeRow: {
    alignItems: "flex-start",
  },
  summaryText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 22,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    fontStyle: "italic",
  },
  sections: {
    gap: 10,
  },
  nestedSections: {
    gap: 10,
  },
  accordionCard: {
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  accordionCardNested: {
    borderRadius: 10,
  },
  accordionCardCompatible: {
    borderColor: "#BBF7D0",
  },
  accordionCardDifferent: {
    borderColor: "#FECACA",
  },
  accordionCardCritical: {
    borderColor: "#FECACA",
  },
  accordionCardImportant: {
    borderColor: "#FDE68A",
  },
  accordionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordionHeaderCompatible: {
    backgroundColor: "#F0FDF4",
  },
  accordionHeaderDifferent: {
    backgroundColor: "#FEF2F2",
  },
  accordionHeaderCritical: {
    backgroundColor: "#FEE2E2",
  },
  accordionHeaderImportant: {
    backgroundColor: "#FEF3C7",
  },
  accordionTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  accordionTitleCompatible: {
    color: "#166534",
  },
  accordionTitleDifferent: {
    color: "#991B1B",
  },
  accordionTitleCritical: {
    color: "#991B1B",
  },
  accordionTitleImportant: {
    color: "#92400E",
  },
  accordionChevron: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    width: 14,
  },
  accordionBody: {
    borderTopColor: "#E2E8F0",
    borderTopWidth: 1,
    gap: 10,
    padding: 12,
  },
  accordionBodyNested: {
    backgroundColor: "#FAFAFA",
  },
  empty: {
    color: "#94A3B8",
    fontSize: 14,
    fontStyle: "italic",
  },
  rowGroup: {
    gap: 10,
  },
  compatibleRow: {
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  differentRow: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    gap: 4,
    padding: 12,
  },
  rowLabel: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  rowValue: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "600",
  },
  checkRow: {
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  checkRowCritical: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  checkRowImportant: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  checkRowOptional: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  checkField: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  checkReason: {
    fontSize: 15,
    lineHeight: 22,
  },
  checkReasonCritical: {
    color: "#991B1B",
  },
  checkReasonImportant: {
    color: "#92400E",
  },
  checkReasonOptional: {
    color: "#475569",
  },
});
