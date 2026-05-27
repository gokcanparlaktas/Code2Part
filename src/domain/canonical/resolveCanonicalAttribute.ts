import {
  CATALOG_CHECK_DISPLAY_MESSAGE,
  UNKNOWN_CANONICAL_KEY,
  type CanonicalMappingEntry,
  type CanonicalResolveContext,
  type CanonicalResolvedField,
} from '@/types/canonicalAttribute';

import { CANONICAL_MAPPING_ENTRIES } from './canonicalMappingRegistry';

export function compactCanonicalToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s\-_/]+/g, '');
}

export function normalizeCanonicalManufacturer(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

export function normalizeCanonicalSeries(value?: string | null): string {
  return compactCanonicalToken(value ?? '');
}

export function formatRawTokenEvidenceLabel(rawToken?: string): string | undefined {
  if (!rawToken) {
    return undefined;
  }
  return `Kod kanıtı: ${rawToken}`;
}

export function isUnknownCanonical(resolved: Pick<CanonicalResolvedField, 'canonicalKey'>): boolean {
  return resolved.canonicalKey === UNKNOWN_CANONICAL_KEY;
}

/** UI display text; unknown canonical fields use catalog-check message only here. */
export function getCanonicalDisplayValueForUi(
  resolved: Pick<CanonicalResolvedField, 'canonicalKey' | 'displayValue'>,
): string {
  if (resolved.canonicalKey === UNKNOWN_CANONICAL_KEY) {
    return CATALOG_CHECK_DISPLAY_MESSAGE;
  }
  return resolved.displayValue;
}

function resolveRawToken(context: CanonicalResolveContext): string | null {
  if (context.rawToken?.trim()) {
    return compactCanonicalToken(context.rawToken);
  }
  if (context.rawValue === null || context.rawValue === undefined) {
    return null;
  }
  return compactCanonicalToken(String(context.rawValue));
}

function mappingSpecificity(entry: CanonicalMappingEntry, context: CanonicalResolveContext): number {
  let score = 0;
  if (entry.category === context.category) {
    score += 1;
  } else {
    return -1;
  }

  const entryManufacturer = normalizeCanonicalManufacturer(entry.manufacturer);
  const contextManufacturer = normalizeCanonicalManufacturer(context.manufacturer);
  if (entry.manufacturer) {
    if (entryManufacturer !== contextManufacturer) {
      return -1;
    }
    score += 2;
  }

  const entrySeries = normalizeCanonicalSeries(entry.series);
  const contextSeries = normalizeCanonicalSeries(context.series);
  if (entry.series) {
    if (entrySeries !== contextSeries) {
      return -1;
    }
    score += 4;
  }

  if (entry.attributeKey !== context.attributeKey) {
    return -1;
  }
  score += 8;

  return score;
}

function findBestMapping(
  context: CanonicalResolveContext,
  rawToken: string,
): CanonicalMappingEntry | null {
  const compactToken = compactCanonicalToken(rawToken);
  let best: CanonicalMappingEntry | null = null;
  let bestScore = -1;

  for (const entry of CANONICAL_MAPPING_ENTRIES) {
    if (compactCanonicalToken(entry.rawToken) !== compactToken) {
      continue;
    }
    const score = mappingSpecificity(entry, context);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
}

function buildUnknownField(
  context: CanonicalResolveContext,
  rawToken: string | undefined,
): CanonicalResolvedField {
  return {
    rawAttributeKey: context.attributeKey,
    attributeKey: context.attributeKey,
    rawToken,
    rawTokenLabel: formatRawTokenEvidenceLabel(rawToken),
    canonicalKey: UNKNOWN_CANONICAL_KEY,
    canonicalValue: null,
    displayValue: '',
    evidence: context.evidence ?? 'unknown',
    confidence: context.confidence ?? 'unknown',
    requiresCatalogCheck: true,
    resolved: false,
  };
}

export function resolveCanonicalAttribute(
  context: CanonicalResolveContext,
): CanonicalResolvedField {
  const rawToken = resolveRawToken(context);
  if (!rawToken) {
    return buildUnknownField(context, undefined);
  }

  const mapping = findBestMapping(context, rawToken);
  if (!mapping) {
    return buildUnknownField(context, rawToken);
  }

  const attributeKey = mapping.resolvedAttributeKey ?? context.attributeKey;

  return {
    rawAttributeKey: context.attributeKey,
    attributeKey,
    rawToken,
    rawTokenLabel: formatRawTokenEvidenceLabel(rawToken),
    canonicalKey: mapping.canonicalKey,
    canonicalValue: mapping.canonicalValue,
    displayValue: mapping.displayValue,
    evidence: mapping.evidence,
    confidence: mapping.confidence,
    requiresCatalogCheck: mapping.requiresCatalogCheck,
    sourceDocument: mapping.sourceDocument,
    notes: mapping.notes,
    resolved: true,
  };
}
