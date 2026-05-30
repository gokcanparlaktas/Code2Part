import type { CheckItem } from '@/types/compatibility';

/** Normalizes check field labels so duplicates (e.g. base vs canonical) collapse. */
export function normalizeCheckFieldKey(field: string): string {
  const text = field.trim().toLowerCase();
  if (text.includes('manuel')) {
    return 'manuel kumanda';
  }
  if (text.includes('basınç') || text.includes('basinc')) {
    return 'basınç';
  }
  if (text.includes('debi') || text.includes('flow')) {
    return 'debi';
  }
  if (text.includes('conta') || text.includes('keçe') || text.includes('kece')) {
    return 'conta';
  }
  if (text.includes('montaj arayüz') || text.includes('montaj arayuz')) {
    return 'montaj arayüzü';
  }
  if (text.includes('merkez tipi')) {
    return 'merkez tipi';
  }
  if (
    text.includes('sürgü davranış') ||
    text.includes('sürgü sembol') ||
    text.includes('spool')
  ) {
    return 'spool_center_behavior';
  }
  return text;
}

export function profileHasCatalogPressureEvidence(
  field?: { catalogEvidence?: { numericValueBar?: number; displayCandidate?: string } }
): boolean {
  return (
    field?.catalogEvidence?.numericValueBar != null ||
    Boolean(field?.catalogEvidence?.displayCandidate?.trim())
  );
}

export function profileHasCatalogFlowEvidence(
  field?: { catalogEvidence?: { numericValueLpm?: number; displayCandidate?: string } }
): boolean {
  return (
    field?.catalogEvidence?.numericValueLpm != null ||
    Boolean(field?.catalogEvidence?.displayCandidate?.trim())
  );
}

export function dedupeCheckItemsByField(items: CheckItem[]): CheckItem[] {
  const seen = new Set<string>();
  const result: CheckItem[] = [];

  for (const item of items) {
    const key = normalizeCheckFieldKey(item.field);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

/**
 * Drops generic base checklist rows when a canonical comparison already produced
 * a check item for the same topic.
 */
export function filterBaseCheckItemsCoveredByCanonical(
  baseItems: CheckItem[],
  canonicalItems: CheckItem[]
): CheckItem[] {
  const covered = new Set(canonicalItems.map((item) => normalizeCheckFieldKey(item.field)));
  return baseItems.filter((item) => !covered.has(normalizeCheckFieldKey(item.field)));
}
