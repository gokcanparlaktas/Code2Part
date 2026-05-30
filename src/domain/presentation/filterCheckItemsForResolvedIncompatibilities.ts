import type { AttributeComparison, CheckItem } from '@/types/compatibility';

import { normalizeCheckFieldKey } from '@/domain/presentation/dedupeCheckItems';

const MOUNTING_STANDARD_LABEL = 'Montaj standardı';

/** Drops redundant checklist rows when the comparison already resolved a hard mismatch. */
export function filterCheckItemsForResolvedIncompatibilities(
  checkItems: CheckItem[],
  comparisons: AttributeComparison[]
): CheckItem[] {
  const mountingDifferent = comparisons.some(
    (comparison) =>
      comparison.label === MOUNTING_STANDARD_LABEL && comparison.status === 'different'
  );

  if (!mountingDifferent) {
    return checkItems;
  }

  return checkItems.filter(
    (item) => normalizeCheckFieldKey(item.field) !== 'montaj arayüzü'
  );
}
