import { canonicalResolvedToProfileAttribute } from '@/domain/canonical/canonicalToCompatibilityAttribute';
import {
  formatCanonicalDetailValue,
  formatCanonicalDetailLines,
} from '@/domain/presentation/formatCanonicalDetailValue';
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import type { ProductCompatibilityProfile } from '@/domain/compatibilityProfiles/compatibilityProfile';
import {
  normalizeCushioningAttribute,
  normalizeStandardFamilyAttribute,
} from '@/domain/normalization/normalizeTechnicalAttribute';
import { PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import type { AttributeEvidenceSource } from '@/types/technicalAttribute';

type ProfileAttribute = ProductCompatibilityProfile['attributes'][string];

export type PneumaticVariantTokenInput = {
  token: string;
  evidence?: AttributeEvidenceSource;
  confidence?: ProfileAttribute['confidence'];
};

export type PneumaticCanonicalAttributeContext = {
  manufacturer?: string;
  series?: string;
};

function pickIso15552VariantEvidence(
  variantCodes: PneumaticVariantTokenInput[],
  context: PneumaticCanonicalAttributeContext,
) {
  for (const variant of variantCodes) {
    const resolved = resolveCanonicalAttribute({
      category: PNEUMATIC_CYLINDER_CATEGORY,
      manufacturer: context.manufacturer,
      series: context.series,
      attributeKey: 'variant_code',
      rawToken: variant.token,
      evidence: variant.evidence ?? 'code',
      confidence: variant.confidence,
    });
    if (!isUnknownCanonical(resolved) && resolved.canonicalKey === 'ISO_15552') {
      return resolved;
    }
  }
  return null;
}

/**
 * Standart ailesi: birincil değer seri/katalogdan; N3 gibi variant_code yalnızca Kod kanıtı.
 */
export function buildPneumaticStandardFamilyAttribute(options: {
  seriesStandardLabel: string | null;
  variantCodes?: PneumaticVariantTokenInput[];
  manufacturer?: string;
  series?: string;
  evidence?: ProfileAttribute['evidence'];
  confidence?: ProfileAttribute['confidence'];
}): ProfileAttribute {
  const context: PneumaticCanonicalAttributeContext = {
    manufacturer: options.manufacturer,
    series: options.series,
  };

  const base = normalizeStandardFamilyAttribute({
    rawValue: options.seriesStandardLabel,
    manufacturer: options.manufacturer,
    evidence: options.evidence ?? (options.seriesStandardLabel ? 'series_table' : 'unknown'),
    confidence: options.confidence ?? (options.seriesStandardLabel ? 'medium' : 'unknown'),
  });

  const variantEvidence = pickIso15552VariantEvidence(options.variantCodes ?? [], context);
  if (!variantEvidence) {
    return base;
  }

  return {
    ...base,
    label: 'Standart ailesi',
    value: variantEvidence.displayValue,
    displayValue: formatCanonicalDetailValue(variantEvidence),
    canonicalValue: variantEvidence.canonicalValue,
    canonicalKey: variantEvidence.canonicalKey,
    rawValue: options.seriesStandardLabel,
    rawToken: variantEvidence.rawToken,
    rawTokenLabel: variantEvidence.rawTokenLabel,
    importance: 'critical',
    compareMode: 'same_or_check',
    evidence: base.evidence === 'unknown' ? variantEvidence.evidence : 'standard',
    confidence: 'high',
    requiresCatalogCheck: false,
    sourceDocument: variantEvidence.sourceDocument ?? base.sourceDocument,
  };
}

export function buildPneumaticCushioningAttribute(options: {
  rawToken: string | null;
  manufacturer?: string;
  series?: string;
  evidence?: ProfileAttribute['evidence'];
  confidence?: ProfileAttribute['confidence'];
}): ProfileAttribute {
  if (!options.rawToken) {
    return {
      label: 'Sönümleme tipi',
      value: null,
      importance: 'important',
      compareMode: 'same_or_check',
      evidence: 'unknown',
      confidence: 'unknown',
      requiresCatalogCheck: true,
    };
  }

  const resolved = resolveCanonicalAttribute({
    category: PNEUMATIC_CYLINDER_CATEGORY,
    manufacturer: options.manufacturer,
    series: options.series,
    attributeKey: 'cushioning_type',
    rawToken: options.rawToken,
    evidence: options.evidence ?? 'code',
    confidence: options.confidence,
  });

  if (!isUnknownCanonical(resolved)) {
    const profileAttr = canonicalResolvedToProfileAttribute(resolved, {
      label: 'Sönümleme tipi',
      importance: 'important',
      compareMode: 'same_or_check',
    });
    return {
      ...profileAttr,
      displayValue: formatCanonicalDetailValue(resolved),
    };
  }

  return normalizeCushioningAttribute({
    rawToken: options.rawToken,
    manufacturer: options.manufacturer,
    series: options.series,
    evidence: options.evidence,
    confidence: options.confidence,
  });
}

/** UI metni: standart ailesi + isteğe bağlı variant kanıtları. */
export function buildPneumaticStandardFamilyDisplayValue(options: {
  seriesStandardLabel: string | null;
  variantCodes?: PneumaticVariantTokenInput[];
  manufacturer?: string;
  series?: string;
}): string {
  const attr = buildPneumaticStandardFamilyAttribute({
    seriesStandardLabel: options.seriesStandardLabel,
    variantCodes: options.variantCodes,
    manufacturer: options.manufacturer,
    series: options.series,
    evidence: options.seriesStandardLabel ? 'series_table' : 'unknown',
    confidence: options.seriesStandardLabel ? 'medium' : 'unknown',
  });

  if (attr.displayValue) {
    return attr.displayValue;
  }
  if (attr.value === null || attr.value === undefined) {
    return 'Bilinmiyor — kontrol gerekli';
  }
  return String(attr.value);
}

export { formatCanonicalDetailLines };
