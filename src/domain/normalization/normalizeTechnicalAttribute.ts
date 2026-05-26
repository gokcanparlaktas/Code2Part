import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';

import {
  formatCanonicalDisplayValue,
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
    rawTokenLabel: options.rawValue ? `Kod: ${options.rawValue}` : undefined,
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
  evidence?: EvidenceLevel;
  confidence?: ConfidenceLevel;
  sourceDocument?: string;
}): NormalizedTechnicalAttribute {
  const canonical = normalizeCushioningToken(options.rawToken);
  const evidence = options.evidence ?? (options.rawToken ? 'code' : 'unknown');
  const confidence = options.confidence ?? (options.rawToken ? 'medium' : 'unknown');

  if (!canonical) {
    return {
      label: 'Sönümleme tipi',
      value: options.rawToken,
      rawValue: options.rawToken,
      rawToken: options.rawToken ?? undefined,
      manufacturer: options.manufacturer,
      importance: 'important',
      compareMode: 'same_or_check',
      evidence,
      confidence,
      requiresCatalogCheck: options.rawToken ? true : undefined,
      sourceDocument: options.sourceDocument,
    };
  }

  return {
    label: 'Sönümleme tipi',
    value: getCanonicalCushioningDisplay(canonical),
    displayValue: getCanonicalCushioningDisplay(canonical),
    canonicalValue: canonical,
    rawValue: options.rawToken,
    rawToken: options.rawToken ?? undefined,
    rawTokenLabel: options.rawToken ? `Kod: ${options.rawToken}` : undefined,
    manufacturer: options.manufacturer,
    importance: 'important',
    compareMode: 'same_or_check',
    evidence,
    confidence: canonical ? 'high' : confidence,
    requiresCatalogCheck: false,
    sourceDocument: options.sourceDocument,
  };
}

export function formatNormalizedAttributeForDisplay(
  attribute: Pick<
    NormalizedTechnicalAttribute,
    'value' | 'rawToken' | 'rawTokenLabel' | 'manufacturer' | 'canonicalValue'
  >
): string {
  const displayValue =
    attribute.value === null || attribute.value === undefined
      ? 'Bilinmiyor — kontrol gerekli'
      : String(attribute.value);

  if (!attribute.canonicalValue) {
    return displayValue;
  }

  if (attribute.rawTokenLabel) {
    return `${displayValue}\n${attribute.rawTokenLabel}`;
  }

  return formatCanonicalDisplayValue({
    displayValue,
    rawToken: attribute.rawToken,
    manufacturer: attribute.manufacturer,
  });
}

export type { CanonicalCushioningType, CanonicalStandardFamily };
