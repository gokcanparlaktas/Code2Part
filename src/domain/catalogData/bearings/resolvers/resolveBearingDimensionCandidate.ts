import {
  getDefaultCatalogDataProvider,
  type CatalogDataProvider,
} from '@/domain/catalogData/CatalogDataProvider';
import { getBearingDimensionIndex } from '@/domain/catalogData/bearings/bearingDimensionIndex';
import { extractBearingBaseCode } from '@/domain/catalogData/bearings/extractBearingBaseCode';
import type { CatalogResolvedCandidate } from '@/domain/catalogData/types';

export interface BearingDimensionResolved extends CatalogResolvedCandidate {
  baseCode?: string;
  seriesGroup?: string;
  bearingType?: string;
  boreDiameterMm?: number;
  outsideDiameterMm?: number;
  widthMm?: number;
}

function notFound(baseCode: string): BearingDimensionResolved {
  return {
    found: false,
    attributeKey: 'bearing_dimensions',
    rawToken: baseCode,
    confidence: 'unknown',
    needsReview: true,
    evidence: 'catalog_data',
    reviewReason: 'dimension_row_not_in_catalog',
  };
}

export function resolveBearingDimensionByBaseCode(
  baseCode: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): BearingDimensionResolved {
  const normalizedBase = baseCode.trim().toUpperCase();
  const index = getBearingDimensionIndex();
  const row = index.get(normalizedBase);
  if (!row) {
    return notFound(normalizedBase);
  }

  void catalogProvider;

  return {
    found: true,
    attributeKey: 'bearing_dimensions',
    rawToken: normalizedBase,
    displayCandidate: `d=${row.boreDiameter.value} D=${row.outsideDiameter.value} B=${row.width.value} mm`,
    confidence: row.confidence ?? 'medium',
    needsReview: row.needsReview ?? true,
    evidence: 'catalog_data',
    sourceStatus: row.sourceStatus,
    baseCode: row.baseCode,
    seriesGroup: row.seriesGroup,
    bearingType: row.bearingType,
    boreDiameterMm: row.boreDiameter.value,
    outsideDiameterMm: row.outsideDiameter.value,
    widthMm: row.width.value,
  };
}

export function resolveBearingDimensionFromCode(
  productCode: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): BearingDimensionResolved {
  const normalized = productCode.replace(/\s+/g, '').toUpperCase();
  const baseCode = extractBearingBaseCode(normalized);
  if (!baseCode) {
    return {
      found: false,
      attributeKey: 'bearing_dimensions',
      rawToken: productCode,
      confidence: 'unknown',
      needsReview: true,
      evidence: 'catalog_data',
      reviewReason: 'bearing_base_code_not_extracted',
    };
  }
  return resolveBearingDimensionByBaseCode(baseCode, catalogProvider);
}
