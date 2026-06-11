import { CONNECTOR_CANONICAL_MAPPING_ENTRIES } from '@/domain/canonical/connector/connectorCanonicalMappings';
import {
  normalizeCanonicalManufacturer,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import {
  mapUnifiedCoilToRexroth,
  mapUnifiedCoilToVickers,
  mapUnifiedCoilToYuken,
  unifiedKeyFromOrderingToken,
  type UnifiedCoilVoltageKey,
} from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

export type HydraulicTargetBrand = 'rexroth' | 'yuken' | 'vickers';

const CANONICAL_COIL_TO_UNIFIED: Partial<Record<string, UnifiedCoilVoltageKey>> = {
  DC_12V: 'dc_12v',
  DC_24V: 'dc_24v',
  DC_48V: 'dc_48v',
  DC_96V: 'dc_96v',
  DC_110V: 'dc_110v',
  DC_125V: 'dc_125v',
  DC_205V: 'dc_205v',
  DC_220V: 'dc_220v',
};

function resolveUnifiedCoilKeyFromToken(
  coilToken: string,
  manufacturer: string,
  series: string
): UnifiedCoilVoltageKey | null {
  const resolved = resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    attributeKey: 'coil_rating',
    rawToken: coilToken,
    manufacturer,
    series,
  });

  if (resolved.resolved && resolved.canonicalKey in CANONICAL_COIL_TO_UNIFIED) {
    return CANONICAL_COIL_TO_UNIFIED[resolved.canonicalKey] ?? null;
  }

  return unifiedKeyFromOrderingToken(coilToken);
}

/** Maps any supported coil ordering token to the target brand via canonical voltage class. */
export function resolveTargetCoilToken(
  coilToken: string | null,
  sourceBrand: HydraulicTargetBrand,
  targetBrand: HydraulicTargetBrand,
  options?: { sourceSeries?: string; targetSeries?: string }
): string | null {
  if (!coilToken?.trim()) {
    return null;
  }

  const unified = resolveUnifiedCoilKeyFromToken(
    coilToken,
    brandLabel(sourceBrand),
    options?.sourceSeries ??
      (sourceBrand === 'rexroth' ? '4WE6' : sourceBrand === 'yuken' ? 'DSG-01' : 'DG4V-3')
  );
  if (!unified) {
    return null;
  }

  switch (targetBrand) {
    case 'rexroth':
      return mapUnifiedCoilToRexroth(unified);
    case 'yuken':
      return mapUnifiedCoilToYuken(unified);
    case 'vickers':
      return mapUnifiedCoilToVickers(unified);
    default:
      return null;
  }
}

function brandLabel(brand: HydraulicTargetBrand): string {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function seriesLabelForBrand(brand: HydraulicTargetBrand, series?: string): string {
  if (series) {
    return series;
  }
  if (brand === 'rexroth') {
    return '4WE6';
  }
  if (brand === 'yuken') {
    return 'DSG-01';
  }
  return 'DG4V-3';
}

/** Maps connector token to target brand via canonical connector family. */
export function resolveTargetConnectorToken(
  connectorToken: string | null,
  sourceBrand: HydraulicTargetBrand,
  targetBrand: HydraulicTargetBrand,
  options?: { sourceSeries?: string; targetSeries?: string }
): string | null {
  if (!connectorToken?.trim()) {
    return null;
  }

  const targetSeries = seriesLabelForBrand(targetBrand, options?.targetSeries);
  const sourceResolved = resolveCanonicalAttribute({
    category: HYDRAULIC_VALVE_CATEGORY,
    attributeKey: 'connector_type',
    rawToken: connectorToken,
    manufacturer: brandLabel(sourceBrand),
    series: seriesLabelForBrand(sourceBrand, options?.sourceSeries),
  });

  if (!sourceResolved.resolved || sourceResolved.canonicalKey === 'unknown') {
    return null;
  }

  const targetManufacturer = targetBrand.charAt(0).toUpperCase() + targetBrand.slice(1);
  const candidates = CONNECTOR_CANONICAL_MAPPING_ENTRIES.filter(
    (entry) =>
      entry.canonicalKey === sourceResolved.canonicalKey &&
      normalizeCanonicalManufacturer(entry.manufacturer) === normalizeCanonicalManufacturer(targetManufacturer)
  );

  const seriesMatch = candidates.find(
    (entry) =>
      !entry.series ||
      entry.series.trim().toUpperCase() === targetSeries.trim().toUpperCase()
  );
  if (seriesMatch) {
    return seriesMatch.rawToken;
  }

  return candidates[0]?.rawToken ?? null;
}
