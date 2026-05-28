import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
  type ProductResolverCategory,
} from '@/types/category';
import type { ProductIdentification, ProductSeriesRecord } from '@/types/product';

export type HydraulicMountingBucket = 'cetop03_ng6' | 'cetop05_ng10' | 'unknown';

const NG6_EQUIVALENCE_GROUP_ID = 'hydraulic_cetop_03_ng6_valve';
const NG10_EQUIVALENCE_GROUP_ID = 'hydraulic_cetop_05_ng10_valve';

const NG10_SERIES_HINTS = ['4WE10', 'DSG-03', 'DG4V-5', 'DHU', 'D3W'] as const;
const NG6_SERIES_HINTS = ['4WE6', 'DSG-01', 'DG4V-3', 'DHI', 'D1VW'] as const;

function compactUpper(value: string): string {
  return value.trim().toUpperCase();
}

function labelToMountingBucket(label: string): HydraulicMountingBucket {
  const compact = compactUpper(label);
  if (
    compact.includes('NG6') ||
    compact.includes('CETOP 03') ||
    compact.includes('CETOP03') ||
    compact.includes('4401-03') ||
    compact.includes('440103')
  ) {
    return 'cetop03_ng6';
  }
  if (
    compact.includes('NG10') ||
    compact.includes('CETOP 05') ||
    compact.includes('CETOP05') ||
    compact.includes('4401-05') ||
    compact.includes('440105')
  ) {
    return 'cetop05_ng10';
  }
  return 'unknown';
}

function seriesHintBucket(series: ProductSeriesRecord): HydraulicMountingBucket {
  const seriesLabel = compactUpper(series.series);
  if (NG10_SERIES_HINTS.some((hint) => seriesLabel.includes(compactUpper(hint)))) {
    return 'cetop05_ng10';
  }
  if (NG6_SERIES_HINTS.some((hint) => seriesLabel.includes(compactUpper(hint)))) {
    return 'cetop03_ng6';
  }
  return 'unknown';
}

export function resolveHydraulicMountingBucket(
  identification: ProductIdentification | null,
  series?: ProductSeriesRecord | null,
): HydraulicMountingBucket {
  const fromId = identification?.cetopNgSize?.value;
  if (fromId) {
    const bucket = labelToMountingBucket(String(fromId));
    if (bucket !== 'unknown') {
      return bucket;
    }
  }

  const groupId = series?.equivalenceGroupId ?? series?.equivalenceGroup;
  if (groupId === NG6_EQUIVALENCE_GROUP_ID) {
    return 'cetop03_ng6';
  }
  if (groupId === NG10_EQUIVALENCE_GROUP_ID) {
    return 'cetop05_ng10';
  }

  if (series?.cetopNgLabel) {
    const bucket = labelToMountingBucket(series.cetopNgLabel);
    if (bucket !== 'unknown') {
      return bucket;
    }
  }

  if (series) {
    return seriesHintBucket(series);
  }

  return 'unknown';
}

export function hydraulicMountingRelation(
  source: ProductIdentification,
  sourceSeries: ProductSeriesRecord,
  targetSeries: ProductSeriesRecord,
): 'same' | 'different' | 'unknown' {
  const sourceBucket = resolveHydraulicMountingBucket(source, sourceSeries);
  const targetBucket = resolveHydraulicMountingBucket(null, targetSeries);
  if (sourceBucket === 'unknown' || targetBucket === 'unknown') {
    return 'unknown';
  }
  return sourceBucket === targetBucket ? 'same' : 'different';
}

function normalizeStandardFamily(value: string | null | undefined): string {
  return compactUpper(value ?? '').replace(/\s+/g, ' ');
}

export function isIso15552StandardFamily(value: string | null | undefined): boolean {
  const normalized = normalizeStandardFamily(value);
  return normalized.includes('15552') || normalized.includes('ISO 15552');
}

export function pneumaticDimensionsMatch(
  source: ProductIdentification,
  target: ProductIdentification,
): boolean {
  if (
    source.bore.value === null ||
    source.stroke.value === null ||
    target.bore.value === null ||
    target.stroke.value === null
  ) {
    return false;
  }

  if (source.bore.value !== target.bore.value || source.stroke.value !== target.stroke.value) {
    return false;
  }

  const sourceStd = normalizeStandardFamily(source.standardFamily.value);
  const targetStd = normalizeStandardFamily(target.standardFamily.value);
  if (!sourceStd || !targetStd) {
    return isIso15552StandardFamily(sourceStd) || isIso15552StandardFamily(targetStd);
  }

  return sourceStd === targetStd || (isIso15552StandardFamily(sourceStd) && isIso15552StandardFamily(targetStd));
}

export function resolverCategoriesMatch(
  sourceCategory: ProductResolverCategory | null,
  targetCategory: ProductResolverCategory | null,
): boolean {
  if (!sourceCategory || !targetCategory) {
    return false;
  }
  return sourceCategory === targetCategory;
}

export function isHydraulicValveCategory(
  category: ProductResolverCategory | null,
): category is typeof HYDRAULIC_VALVE_CATEGORY {
  return category === HYDRAULIC_VALVE_CATEGORY;
}

export function isPneumaticCylinderCategory(
  category: ProductResolverCategory | null,
): category is typeof PNEUMATIC_CYLINDER_CATEGORY {
  return category === PNEUMATIC_CYLINDER_CATEGORY;
}
