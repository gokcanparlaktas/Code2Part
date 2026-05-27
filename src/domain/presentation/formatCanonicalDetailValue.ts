import {
  formatRawTokenEvidenceLabel,
  getCanonicalDisplayValueForUi,
} from '@/domain/canonical/resolveCanonicalAttribute';
import type { CanonicalResolvedField } from '@/types/canonicalAttribute';

/** Primary = displayValue; raw token only as Kod kanıtı line (never primary). */
export function formatCanonicalDetailValue(resolved: CanonicalResolvedField): string {
  const primary = getCanonicalDisplayValueForUi(resolved);
  const evidence = resolved.rawTokenLabel ?? formatRawTokenEvidenceLabel(resolved.rawToken);
  if (!evidence || evidence === primary) {
    return primary;
  }
  return `${primary}\n${evidence}`;
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
