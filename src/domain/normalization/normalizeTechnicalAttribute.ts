import { canonicalResolvedToProfileAttribute } from '@/domain/canonical/canonicalToCompatibilityAttribute';
import {
  formatRawTokenEvidenceLabel,
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';

import {
  getCanonicalCushioningDisplay,
  getCanonicalStandardFamilyDisplay,
  normalizeCushioningToken,
  normalizeStandardFamilyToken,
  type CanonicalCushioningType,
  type CanonicalStandardFamily,
} from './canonicalTechnicalMeanings';

type ProfileAttribute = ProductCompatibilityProfile['attributes'][string];

type EvidenceLevel = ProfileAttribute['evidence'];
type ConfidenceLevel = ProfileAttribute['confidence'];

export type NormalizedTechnicalAttribute = ProfileAttribute & {
  canonicalValue?: string | null;
  rawValue?: string | number | boolean | null;
  rawToken?: string;
  manufacturer?: string;
  sourceDocument?: string;
};

export function normalizeStandardFamilyAttribute(options: {
  rawValue: string | null;
  manufacturer?: string;
  evidence?: EvidenceLevel;
  confidence?: ConfidenceLevel;
  sourceDocument?: string;
}): NormalizedTechnicalAttribute {
  const canonical = normalizeStandardFamilyToken(options.rawValue);
  const evidence = options.evidence ?? (options.rawValue ? 'series_table' : 'unknown');
  const confidence = options.confidence ?? (options.rawValue ? 'medium' : 'unknown');

  if (!canonical) {
    return {
      label: 'Standart ailesi',
      value: options.rawValue,
      rawValue: options.rawValue,
      rawToken: options.rawValue ?? undefined,
      manufacturer: options.manufacturer,
      importance: 'critical',
      compareMode: 'same_or_check',
      evidence,
      confidence,
      requiresCatalogCheck: options.rawValue ? true : undefined,
      sourceDocument: options.sourceDocument,
    };
  }

  return {
    label: 'Standart ailesi',
    value: getCanonicalStandardFamilyDisplay(canonical),
    displayValue: getCanonicalStandardFamilyDisplay(canonical),
    canonicalValue: canonical,
    rawValue: options.rawValue,
    rawToken: options.rawValue ?? undefined,
    rawTokenLabel: options.rawValue
      ? formatRawTokenEvidenceLabel(String(options.rawValue))
      : undefined,
    manufacturer: options.manufacturer,
    importance: 'critical',
    compareMode: 'same_or_check',
    evidence: evidence === 'unknown' ? 'standard' : evidence,
    confidence: 'high',
    requiresCatalogCheck: false,
    sourceDocument: options.sourceDocument ?? 'ISO 15552',
  };
}

export function normalizeCushioningAttribute(options: {
  rawToken: string | null;
  manufacturer?: string;
  series?: string;
  evidence?: EvidenceLevel;
  confidence?: ConfidenceLevel;
  sourceDocument?: string;
}): NormalizedTechnicalAttribute {
  const evidence = options.evidence ?? (options.rawToken ? 'code' : 'unknown');
  const confidence = options.confidence ?? (options.rawToken ? 'medium' : 'unknown');

  if (!options.rawToken) {
    return {
      label: 'Sönümleme tipi',
      value: null,
      importance: 'important',
      compareMode: 'same_or_check',
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
      sourceDocument: options.sourceDocument,
    };
  }

  const resolved = resolveCanonicalAttribute({
    category: PNEUMATIC_CYLINDER_CATEGORY,
    manufacturer: options.manufacturer,
    series: options.series,
    attributeKey: 'cushioning_type',
    rawToken: options.rawToken,
    evidence,
    confidence,
  });

  if (!isUnknownCanonical(resolved)) {
    return canonicalResolvedToProfileAttribute(resolved, {
      label: 'Sönümleme tipi',
      importance: 'important',
      compareMode: 'same_or_check',
      sourceDocument: options.sourceDocument,
    });
  }

  const legacyCanonical = normalizeCushioningToken(options.rawToken);
  if (!legacyCanonical) {
    return {
      label: 'Sönümleme tipi',
      value: options.rawToken,
      canonicalKey: resolved.canonicalKey,
      rawValue: options.rawToken,
      rawToken: options.rawToken,
      rawTokenLabel: formatRawTokenEvidenceLabel(options.rawToken),
      manufacturer: options.manufacturer,
      importance: 'important',
      compareMode: 'same_or_check',
      evidence,
      confidence,
      requiresCatalogCheck: true,
      sourceDocument: options.sourceDocument,
    };
  }

  const display = getCanonicalCushioningDisplay(legacyCanonical);
  return {
    label: 'Sönümleme tipi',
    value: display,
    displayValue: display,
    canonicalValue: legacyCanonical,
    rawValue: options.rawToken,
    rawToken: options.rawToken,
    rawTokenLabel: formatRawTokenEvidenceLabel(options.rawToken),
    manufacturer: options.manufacturer,
    importance: 'important',
    compareMode: 'same_or_check',
    evidence,
    confidence: 'high',
    requiresCatalogCheck: false,
    sourceDocument: options.sourceDocument,
  };
}

export function formatNormalizedAttributeForDisplay(
  attribute: Pick<
    NormalizedTechnicalAttribute,
    'value' | 'displayValue' | 'rawToken' | 'rawTokenLabel' | 'canonicalValue' | 'canonicalKey'
  >
): string {
  const primary =
    attribute.displayValue ??
    (attribute.value === null || attribute.value === undefined
      ? 'Bilinmiyor — kontrol gerekli'
      : String(attribute.value));

  if (attribute.canonicalKey === 'unknown' || !attribute.canonicalValue) {
    if (attribute.rawTokenLabel) {
      return `${primary}\n${attribute.rawTokenLabel}`;
    }
    return primary;
  }

  if (attribute.rawTokenLabel) {
    return `${primary}\n${attribute.rawTokenLabel}`;
  }

  return primary;
}

export type { CanonicalCushioningType, CanonicalStandardFamily };
