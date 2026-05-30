import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { groupCheckItemsByImportance } from '@/domain/presentation/groupCheckItemsByImportance';
import type { AttributeComparison, CheckItem, CompatibilityResult } from '@/types/compatibility';
import { colors, radius, spacing, typography } from '@/theme';

type CheckRowVariant = 'critical' | 'important' | 'optional';
type AccordionVariant = 'default' | 'compatible' | 'different' | 'critical' | 'important';

function checkRowVariant(severity: CheckItem['severity']): CheckRowVariant {
  if (severity === 'high') {
    return 'critical';
  }
  if (severity === 'low') {
    return 'optional';
  }
  return 'important';
}

function CompatibleRow({ item }: { item: AttributeComparison }) {
  const sameDisplay = item.sourceDisplay === item.targetDisplay;
  const valueLine = sameDisplay
    ? item.sourceDisplay
    : `${item.sourceDisplay} → ${item.targetDisplay}`;

  return (
    <View style={styles.compatibleRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={[styles.rowValue, styles.compatibleValue]}>{valueLine}</Text>
    </View>
  );
}

function DifferentRow({
  item,
  targetLabel = 'Hedef',
}: {
  item: AttributeComparison;
  targetLabel?: string;
}) {
  return (
    <View style={styles.differentRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={[styles.rowValue, styles.differentValue]}>
        Kaynak: {item.sourceDisplay} → {targetLabel}: {item.targetDisplay}
      </Text>
    </View>
  );
}

function CheckRow({ item }: { item: CheckItem }) {
  const variant = checkRowVariant(item.severity);
  const palette =
    variant === 'critical'
      ? colors.compat.critical
      : variant === 'important'
        ? colors.compat.important
        : colors.compat.optional;

  return (
    <View
      style={[styles.checkRow, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      <Text style={[styles.checkField, { color: palette.text }]}>{item.field}</Text>
      <Text style={[styles.checkReason, { color: palette.text }]}>{item.reasonTr}</Text>
    </View>
  );
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  variant = 'default',
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

  const variantStyles = {
    default: {
      card: {},
      header: styles.accordionHeaderDefault,
      title: styles.accordionTitleDefault,
    },
    compatible: {
      card: styles.accordionCardCompatible,
      header: styles.accordionHeaderCompatible,
      title: styles.accordionTitleCompatible,
    },
    different: {
      card: styles.accordionCardDifferent,
      header: styles.accordionHeaderDifferent,
      title: styles.accordionTitleDifferent,
    },
    critical: {
      card: styles.accordionCardCritical,
      header: styles.accordionHeaderCritical,
      title: styles.accordionTitleCritical,
    },
    important: {
      card: styles.accordionCardImportant,
      header: styles.accordionHeaderImportant,
      title: styles.accordionTitleImportant,
    },
  }[variant];

  return (
    <View
      style={[styles.accordionCard, nested && styles.accordionCardNested, variantStyles.card]}
    >
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.accordionHeader,
          variantStyles.header,
          pressed && styles.headerPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.accordionTitle, variantStyles.title]}>{title}</Text>
        <View style={styles.accordionMeta}>
          <Text style={styles.accordionCount}>{count}</Text>
          <Text style={styles.accordionChevron}>{open ? '−' : '+'}</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={[styles.accordionBody, nested && styles.accordionBodyNested]}>
          {isEmpty ? <Text style={styles.empty}>{emptyMessage}</Text> : children}
        </View>
      ) : null}
    </View>
  );
}

interface CompatibilityComparisonSectionsProps {
  result: CompatibilityResult;
  differentTargetLabel?: string;
}

export function CompatibilityComparisonSections({
  result,
  differentTargetLabel = 'Muadil',
}: CompatibilityComparisonSectionsProps) {
  const groupedChecks = groupCheckItemsByImportance(result.checkItems);

  return (
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
            <DifferentRow
              key={item.label}
              item={item}
              targetLabel={differentTargetLabel}
            />
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection
        title="Kontrol gerekli"
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
              title="Önemli kontroller"
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
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.sm,
  },
  nestedSections: {
    gap: spacing.sm,
  },
  accordionCard: {
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionCardNested: {
    borderRadius: radius.sm,
  },
  accordionCardCompatible: {
    borderLeftColor: colors.compat.positive.border,
    borderLeftWidth: 3,
  },
  accordionCardDifferent: {
    borderLeftColor: colors.compat.negative.border,
    borderLeftWidth: 3,
  },
  accordionCardCritical: {
    borderLeftColor: colors.compat.critical.border,
    borderLeftWidth: 3,
  },
  accordionCardImportant: {
    borderLeftColor: colors.compat.important.border,
    borderLeftWidth: 3,
  },
  accordionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  accordionHeaderDefault: {
    backgroundColor: colors.background.elevated,
  },
  accordionHeaderCompatible: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  accordionHeaderDifferent: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  accordionHeaderCritical: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  accordionHeaderImportant: {
    backgroundColor: 'rgba(202, 138, 4, 0.12)',
  },
  headerPressed: {
    backgroundColor: colors.background.elevated,
  },
  accordionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  accordionTitleDefault: {
    color: colors.surface.text,
  },
  accordionTitleCompatible: {
    color: '#4ADE80',
  },
  accordionTitleDifferent: {
    color: '#F87171',
  },
  accordionTitleCritical: {
    color: '#FCA5A5',
  },
  accordionTitleImportant: {
    color: '#FCD34D',
  },
  accordionMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accordionCount: {
    ...typography.caption,
    backgroundColor: colors.navy[600],
    borderRadius: radius.xs,
    color: colors.surface.textSecondary,
    fontWeight: '700',
    minWidth: 22,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    textAlign: 'center',
  },
  accordionChevron: {
    color: colors.surface.textMuted,
    fontSize: 16,
    fontWeight: '300',
    width: 16,
  },
  accordionBody: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  accordionBodyNested: {
    backgroundColor: colors.background.elevated,
  },
  empty: {
    ...typography.bodySm,
    color: colors.surface.textMuted,
    fontStyle: 'italic',
  },
  rowGroup: {
    gap: spacing.sm,
  },
  compatibleRow: {
    backgroundColor: colors.background.elevated,
    borderLeftColor: colors.compat.positive.border,
    borderLeftWidth: 2,
    borderRadius: radius.sm,
    gap: spacing.xs,
    padding: spacing.md,
  },
  differentRow: {
    backgroundColor: colors.background.elevated,
    borderLeftColor: colors.compat.negative.border,
    borderLeftWidth: 2,
    borderRadius: radius.sm,
    gap: spacing.xs,
    padding: spacing.md,
  },
  rowLabel: {
    ...typography.label,
    color: colors.surface.textSecondary,
  },
  rowValue: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  compatibleValue: {
    color: '#4ADE80',
  },
  differentValue: {
    color: '#F87171',
  },
  checkRow: {
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  checkField: {
    ...typography.label,
  },
  checkReason: {
    ...typography.bodySm,
    lineHeight: 20,
  },
});
