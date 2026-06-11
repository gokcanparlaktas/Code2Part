import { CONNECTOR_CANONICAL_MAPPING_ENTRIES } from '@/domain/canonical/connector/connectorCanonicalMappings';
import {
  normalizeCanonicalManufacturer,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import {
  mapUnifiedCoilToRexroth,
  mapUnifiedCoilToYuken,
  type UnifiedCoilVoltageKey,
} from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

export type HydraulicTargetBrand = 'rexroth' | 'yuken' | 'vickers';

const VICKERS_COIL_BY_UNIFIED: Partial<Record<UnifiedCoilVoltageKey, string>> = {
  dc_12v: 'D12',
  dc_24v: 'H7',
  dc_48v: 'D48',
};

function parseVoltsFromOrderingToken(token: string): number | null {
  const upper = token.trim().toUpperCase();
  if (upper === 'H' || upper === 'H7') {
    return 24;
  }
  const match = upper.match(/(\d{2,3})/);
  if (!match) {
    return null;
  }
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

function unifiedKeyFromVolts(volts: number): UnifiedCoilVoltageKey | null {
  const map: Record<number, UnifiedCoilVoltageKey> = {
    12: 'dc_12v',
    24: 'dc_24v',
    48: 'dc_48v',
    96: 'dc_96v',
    110: 'dc_110v',
    125: 'dc_125v',
    205: 'dc_205v',
    220: 'dc_220v',
  };
  return map[volts] ?? null;
}

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

  if (resolved.resolved && resolved.canonicalKey === 'DC_24V') {
    return 'dc_24v';
  }
  if (resolved.resolved && resolved.canonicalKey === 'DC_12V') {
    return 'dc_12v';
  }

  const volts = parseVoltsFromOrderingToken(coilToken);
  if (volts !== null) {
    return unifiedKeyFromVolts(volts);
  }

  return null;
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
      return VICKERS_COIL_BY_UNIFIED[unified] ?? null;
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

  const sourceSeries = seriesLabelForBrand(sourceBrand, options?.sourceSeries);
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
