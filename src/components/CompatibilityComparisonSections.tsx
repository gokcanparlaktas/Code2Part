import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { groupCheckItemsByImportance } from '@/domain/presentation/groupCheckItemsByImportance';
import type { AttributeComparison, CheckItem, CompatibilityResult } from '@/types/compatibility';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeColorPalette } from '@/theme/homePalettes';
import { useHomeStyles } from '@/theme/useHomeStyles';
import { colors, radius, spacing, typography } from '@/theme';

type SectionStyles = ReturnType<typeof createStyles>;

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

function CompatibleRow({
  item,
  variant = 'default',
  styles,
}: {
  item: AttributeComparison;
  variant?: 'default' | 'compare';
  styles: SectionStyles;
}) {
  const sameDisplay = item.sourceDisplay === item.targetDisplay;
  const valueLine = sameDisplay
    ? item.sourceDisplay
    : `${item.sourceDisplay} → ${item.targetDisplay}`;

  if (variant === 'compare') {
    return (
      <View style={styles.compareDetailRow}>
        <Text style={styles.compareDetailLabel}>{item.label}</Text>
        <Text style={[styles.compareDetailValue, styles.compareDetailValuePositive]}>
          {valueLine}
        </Text>
      </View>
    );
  }

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
  variant = 'default',
  styles,
}: {
  item: AttributeComparison;
  targetLabel?: string;
  variant?: 'default' | 'compare';
  styles: SectionStyles;
}) {
  if (variant === 'compare') {
    return (
      <View style={styles.compareDetailRow}>
        <Text style={styles.compareDetailLabel}>{item.label}</Text>
        <Text style={[styles.compareDetailValue, styles.compareDetailValueNegative]}>
          Kaynak: {item.sourceDisplay} → {targetLabel}: {item.targetDisplay}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.differentRow}>
      <Text style={styles.rowLabel}>{item.label}</Text>
      <Text style={[styles.rowValue, styles.differentValue]}>
        Kaynak: {item.sourceDisplay} → {targetLabel}: {item.targetDisplay}
      </Text>
    </View>
  );
}

function CheckRow({
  item,
  variant = 'default',
  styles,
}: {
  item: CheckItem;
  variant?: 'default' | 'compare';
  styles: SectionStyles;
}) {
  const rowVariant = checkRowVariant(item.severity);
  const palette =
    rowVariant === 'critical'
      ? colors.compat.critical
      : rowVariant === 'important'
        ? colors.compat.important
        : colors.compat.optional;

  if (variant === 'compare') {
    return (
      <View style={styles.compareDetailRow}>
        <Text style={styles.compareDetailLabel}>{item.field}</Text>
        <Text style={[styles.compareDetailValue, styles.compareDetailValueCheck]}>{item.reasonTr}</Text>
      </View>
    );
  }

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
  presentation = 'default',
  isLast = false,
  styles,
}: {
  title: string;
  count: number;
  defaultExpanded?: boolean;
  variant?: AccordionVariant;
  nested?: boolean;
  emptyMessage: string;
  isEmpty: boolean;
  children: ReactNode;
  presentation?: 'default' | 'compare';
  isLast?: boolean;
  styles: SectionStyles;
}) {
  const { homeColors } = useTheme();
  const [open, setOpen] = useState(defaultExpanded);
  const isCompare = presentation === 'compare';

  if (isCompare && !nested) {
    const compareVariant =
      variant === 'compatible' ? 'compatible' : variant === 'different' ? 'different' : 'check';

    return (
      <View>
        <Pressable
          onPress={() => setOpen((current) => !current)}
          style={({ pressed }) => [
            styles.compareRow,
            styles.compareRowBorder,
            pressed && styles.compareRowPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
        >
          <View
            style={[
              styles.compareAccentBar,
              compareVariant === 'compatible' && styles.compareAccentCompatible,
              compareVariant === 'different' && styles.compareAccentDifferent,
              compareVariant === 'check' && styles.compareAccentCheck,
            ]}
          />
          <Text
            style={[
              styles.compareRowTitle,
              compareVariant === 'compatible' && styles.compareTitleCompatible,
              compareVariant === 'different' && styles.compareTitleDifferent,
              compareVariant === 'check' && styles.compareTitleCheck,
            ]}
          >
            {title}
          </Text>
          <View style={styles.compareCountBadge}>
            <Text style={styles.compareCountText}>{count}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={homeColors.textDim} />
        </Pressable>
        {open ? (
          <View style={styles.compareBody}>
            {isEmpty ? <Text style={styles.compareEmpty}>{emptyMessage}</Text> : children}
          </View>
        ) : null}
      </View>
    );
  }

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
  variant?: 'default' | 'compare';
}

export function CompatibilityComparisonSections({
  result,
  differentTargetLabel = 'Muadil',
  variant = 'default',
}: CompatibilityComparisonSectionsProps) {
  const styles = useHomeStyles(createStyles);
  const groupedChecks = groupCheckItemsByImportance(result.checkItems);
  const isCompare = variant === 'compare';

  return (
    <View style={isCompare ? styles.compareSections : styles.sections}>
      {(result.infoNotes ?? []).length > 0 ? (
        <View style={styles.infoNotesBlock}>
          {(result.infoNotes ?? []).map((note) => (
            <Text key={note} style={styles.infoNoteText}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}

      <CollapsibleSection
        title="Uyumlu"
        count={result.compatible.length}
        variant="compatible"
        presentation={variant}
        isEmpty={result.compatible.length === 0}
        emptyMessage="Bu bölümde uyumlu madde yok."
        styles={styles}
      >
        <View style={isCompare ? styles.compareRowGroup : styles.rowGroup}>
          {result.compatible.map((item) => (
            <CompatibleRow key={item.label} item={item} variant={variant} styles={styles} />
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection
        title="Uyumsuz"
        count={result.different.length}
        variant="different"
        presentation={variant}
        isEmpty={result.different.length === 0}
        emptyMessage="Bu bölümde farklı madde yok."
        styles={styles}
      >
        <View style={isCompare ? styles.compareRowGroup : styles.rowGroup}>
          {result.different.map((item) => (
            <DifferentRow
              key={item.label}
              item={item}
              targetLabel={differentTargetLabel}
              variant={variant}
              styles={styles}
            />
          ))}
        </View>
      </CollapsibleSection>

      <CollapsibleSection
        title="Kontrol gerekli"
        count={result.checkItems.length}
        presentation={variant}
        isLast
        isEmpty={result.checkItems.length === 0}
        emptyMessage="Bu bölümde kontrol gerektiren madde yok."
        styles={styles}
      >
        {isCompare ? (
          <View style={styles.compareRowGroup}>
            {result.checkItems.map((item) => (
              <CheckRow
                key={`${item.field}-${item.reasonTr}`}
                item={item}
                variant="compare"
                styles={styles}
              />
            ))}
          </View>
        ) : (
          <View style={styles.nestedSections}>
            {groupedChecks.critical.length > 0 ? (
              <CollapsibleSection
                title="Kritik kontroller"
                count={groupedChecks.critical.length}
                variant="critical"
                nested
                presentation={variant}
                isEmpty={false}
                emptyMessage=""
                styles={styles}
              >
                <View style={styles.rowGroup}>
                  {groupedChecks.critical.map((item) => (
                    <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} styles={styles} />
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
                presentation={variant}
                isEmpty={false}
                emptyMessage=""
                styles={styles}
              >
                <View style={styles.rowGroup}>
                  {groupedChecks.important.map((item) => (
                    <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} styles={styles} />
                  ))}
                </View>
              </CollapsibleSection>
            ) : null}

            {groupedChecks.optional.length > 0 ? (
              <View style={styles.rowGroup}>
                {groupedChecks.optional.map((item) => (
                  <CheckRow key={`${item.field}-${item.reasonTr}`} item={item} styles={styles} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </CollapsibleSection>
    </View>
  );
}

const createStyles = (c: HomeColorPalette) =>
  StyleSheet.create({
  sections: {
    gap: spacing.sm,
  },
  infoNotesBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoNoteText: {
    color: c.textMuted,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
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
  compareSections: {
    gap: 0,
  },
  compareRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  compareRowBorder: {
    borderBottomColor: c.borderSub,
    borderBottomWidth: 1,
  },
  compareRowPressed: {
    opacity: 0.85,
  },
  compareAccentBar: {
    alignSelf: 'stretch',
    borderRadius: 2,
    width: 4,
  },
  compareAccentCompatible: {
    backgroundColor: '#2a7a4a',
  },
  compareAccentDifferent: {
    backgroundColor: '#7a2a2a',
  },
  compareAccentCheck: {
    backgroundColor: c.checkBlue,
  },
  compareRowTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.04,
    textTransform: 'uppercase',
  },
  compareTitleCompatible: {
    color: c.green,
  },
  compareTitleDifferent: {
    color: c.red,
  },
  compareTitleCheck: {
    color: c.checkBlue,
  },
  compareCountBadge: {
    backgroundColor: c.cardBg,
    borderColor: c.borderSub,
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  compareCountText: {
    color: c.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  compareBody: {
    gap: 8,
    marginTop: 8,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 4,
  },
  compareEmpty: {
    color: c.textDim,
    fontSize: 12,
    fontStyle: 'italic',
  },
  compareRowGroup: {
    gap: 8,
  },
  compareDetailRow: {
    backgroundColor: c.cardBg,
    borderColor: c.borderSub,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compareDetailLabel: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  compareDetailValue: {
    color: c.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  compareDetailValuePositive: {
    color: c.green,
  },
  compareDetailValueNegative: {
    color: c.red,
  },
  compareDetailValueCheck: {
    color: c.checkBlue,
  },
});
