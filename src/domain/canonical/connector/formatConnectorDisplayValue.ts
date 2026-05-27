import { getCanonicalDisplayValueForUi } from '@/domain/canonical/resolveCanonicalAttribute';
import type { CanonicalResolvedField } from '@/types/canonicalAttribute';

/** Primary UI label; optional non-critical detail in parentheses. */
export function formatConnectorDisplayValue(
  resolved: Pick<CanonicalResolvedField, 'displayValue' | 'displayDetail' | 'canonicalKey'>,
): string {
  const base = getCanonicalDisplayValueForUi(resolved);
  if (resolved.displayDetail?.trim()) {
    return `${base} (${resolved.displayDetail.trim()})`;
  }
  return base;
}
