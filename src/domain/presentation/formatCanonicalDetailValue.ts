import { formatConnectorDisplayValue } from '@/domain/canonical/connector/formatConnectorDisplayValue';
import { getCanonicalDisplayValueForUi } from '@/domain/canonical/resolveCanonicalAttribute';
import type { CanonicalResolvedField } from '@/types/canonicalAttribute';

/** Primary translated meaning only (raw tokens stay in data, not main UI). */
export function formatCanonicalDetailValue(resolved: CanonicalResolvedField): string {
  if (resolved.rawAttributeKey === 'connector_type' || resolved.attributeKey === 'connector_type') {
    return formatConnectorDisplayValue(resolved);
  }
  return getCanonicalDisplayValueForUi(resolved);
}

export type CanonicalDetailLines = {
  primary: string;
  evidenceLines: string[];
};

/** Splits a formatted detail value into primary display and Kod kanıtı lines. */
export function formatCanonicalDetailLines(value: string): CanonicalDetailLines {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { primary: value, evidenceLines: [] };
  }
  const [primary, ...rest] = lines;
  const evidenceLines = rest.filter((line) => line.startsWith('Kod kanıtı:'));
  return { primary, evidenceLines };
}
