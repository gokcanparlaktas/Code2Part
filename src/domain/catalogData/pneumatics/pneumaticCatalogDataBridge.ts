import type { TechnicalAttributeResult } from '@/types/technicalAttributeResult';

import { parsePneumaticCylinderRawAttributes } from './parsePneumaticCylinderRawAttributes';
import { resolveComparableOptionCandidate } from './resolveComparableOptionCandidate';
import type { PneumaticComparableOptionResolved } from './types';

const PARSER_KEY_MAP: Record<string, string> = {
  cushioning: 'cushioning_type',
  magnet_sensor_capability: 'magnet_sensor_capability',
  mounting_style: 'mounting_style',
  action: 'action',
  series_model_variant: 'variant_code',
  series_family_line: 'variant_code',
  rod_non_rotating: 'variant_code',
  rod_boot: 'variant_code',
  rod_configuration: 'variant_code',
  auto_switch_block: 'variant_code',
  version_token: 'variant_code',
  construction_token: 'variant_code',
  operation_token: 'action',
  cushioning_token: 'cushioning_type',
  constructive_type_token: 'variant_code',
  option_token_1: 'variant_code',
  option_token_2: 'variant_code',
  option_token_3: 'variant_code',
  suffix_optional_token: 'variant_code',
};

function toResultKey(attributeKey: string): string {
  return PARSER_KEY_MAP[attributeKey] ?? attributeKey;
}

export function resolvePneumaticCatalogOption(
  options: {
    brand?: string;
    series?: string;
    attributeKey: string;
    rawToken: string;
    tokenPosition?: string;
  }
): PneumaticComparableOptionResolved | null {
  if (!options.brand || !options.series || !options.rawToken) {
    return null;
  }

  const resolved = resolveComparableOptionCandidate({
    brand: options.brand,
    series: options.series,
    attributeKey: options.attributeKey,
    rawToken: options.rawToken,
    tokenPosition: options.tokenPosition,
  });

  return resolved.found ? resolved : null;
}

/**
 * Enriches pneumatic extractor output with catalog-data parser raw fields.
 * Does not add canonical/display/UI fields.
 */
export function enrichPneumaticAttributesFromCatalogData(options: {
  inputCode: string;
  brand?: string;
  series?: string;
  existing: TechnicalAttributeResult[];
}): TechnicalAttributeResult[] {
  const parsed = parsePneumaticCylinderRawAttributes(options.inputCode);
  if (!parsed) {
    return options.existing;
  }

  const brand = options.brand ?? parsed.brand;
  const series = options.series ?? parsed.series;
  const existingKeys = new Set(options.existing.map((a) => `${a.key}:${a.value}`));
  const additions: TechnicalAttributeResult[] = [];

  for (const field of parsed.fields) {
    if (field.attributeKey === 'bore_mm' || field.attributeKey === 'stroke_mm') {
      continue;
    }

    if (field.attributeKey.startsWith('option_token_')) {
      continue;
    }

    const resultKey = toResultKey(field.attributeKey);
    const value = field.rawToken ?? field.rawValue ?? null;
    if (value === null) {
      continue;
    }

    const dedupeKey = `${resultKey}:${value}`;
    if (existingKeys.has(dedupeKey)) {
      continue;
    }

    const catalogOption =
      field.rawToken && brand && series
        ? resolvePneumaticCatalogOption({
            brand,
            series,
            attributeKey: field.attributeKey,
            rawToken: field.rawToken,
            tokenPosition: field.position,
          })
        : null;

    additions.push({
      key: resultKey,
      label: catalogOption?.comparisonAttributeKey ?? field.attributeKey,
      value,
      evidence: field.evidence,
      confidence: field.confidence,
      requiresCatalogCheck: field.requiresCatalogCheck || (catalogOption?.needsReview ?? true),
      sourceToken: typeof value === 'string' ? value : undefined,
      category: 'pneumatic_cylinder',
      note: catalogOption?.candidateMeaning,
    });

    existingKeys.add(dedupeKey);
  }

  return [...options.existing, ...additions];
}

export function getCatalogCushioningCandidateMeaning(options: {
  brand?: string;
  series?: string;
  rawToken: string | null;
}): PneumaticComparableOptionResolved | null {
  if (!options.rawToken || !options.brand || !options.series) {
    return null;
  }

  return resolvePneumaticCatalogOption({
    brand: options.brand,
    series: options.series,
    attributeKey: 'cushioning',
    rawToken: options.rawToken,
  });
}
