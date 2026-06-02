/**
 * Read-only loaders for data/catalog-data/bearings (staging / prep).
 * Do not mutate returned objects.
 */

/** Relative paths — Metro does not resolve tsconfig @catalog-data alias reliably in Expo. */
import rollingBearingFamilyIndex from '../../../../data/catalog-data/bearings/rolling-bearings/family-index.json';
import rollingBearingManufacturerIndex from '../../../../data/catalog-data/bearings/rolling-bearings/manufacturers/manufacturer-index.json';
import rollingBearingBrandDetection from '../../../../data/catalog-data/bearings/rolling-bearings/shared/brand-detection-candidates.json';
import rollingBearingBoreCode from '../../../../data/catalog-data/bearings/rolling-bearings/shared/bore-code-candidates.json';
import rollingBearingDimensions from '../../../../data/catalog-data/bearings/rolling-bearings/shared/dimension-candidates.json';
import rollingBearingSeries from '../../../../data/catalog-data/bearings/rolling-bearings/shared/series-candidates.json';
import rollingBearingSuffix from '../../../../data/catalog-data/bearings/rolling-bearings/shared/suffix-candidates.json';
import rollingBearingGenerationSpec from '../../../../data/catalog-data/bearings/rolling-bearings/standard-series/generation-spec-candidate.json';
import rollingBearingMapping from '../../../../data/catalog-data/bearings/rolling-bearings/standard-series/mapping-candidates.json';
import rollingBearingParserSpec from '../../../../data/catalog-data/bearings/rolling-bearings/standard-series/parser-spec-candidate.json';
import rollingBearingUnknownOrReview from '../../../../data/catalog-data/bearings/rolling-bearings/standard-series/unknown-or-review.json';

export type RollingBearingFamilyIndexCatalog = typeof rollingBearingFamilyIndex;
export type RollingBearingManufacturerIndexCatalog = typeof rollingBearingManufacturerIndex;
export type RollingBearingBrandDetectionCatalog = typeof rollingBearingBrandDetection;
export type RollingBearingBoreCodeCatalog = typeof rollingBearingBoreCode;
export type RollingBearingDimensionCatalog = typeof rollingBearingDimensions;
export type RollingBearingSeriesCatalog = typeof rollingBearingSeries;
export type RollingBearingSuffixCatalog = typeof rollingBearingSuffix;
export type RollingBearingGenerationSpecCatalog = typeof rollingBearingGenerationSpec;
export type RollingBearingMappingCatalog = typeof rollingBearingMapping;
export type RollingBearingParserSpecCatalog = typeof rollingBearingParserSpec;
export type RollingBearingUnknownOrReviewCatalog = typeof rollingBearingUnknownOrReview;

export type RollingBearingDimensionRow =
  RollingBearingDimensionCatalog['dimensionRows'][number];

export function getRollingBearingFamilyIndexCatalog(): RollingBearingFamilyIndexCatalog {
  return rollingBearingFamilyIndex;
}

export function getRollingBearingManufacturerIndexCatalog(): RollingBearingManufacturerIndexCatalog {
  return rollingBearingManufacturerIndex;
}

export function getRollingBearingBrandDetectionCatalog(): RollingBearingBrandDetectionCatalog {
  return rollingBearingBrandDetection;
}

export function getRollingBearingBoreCodeCatalog(): RollingBearingBoreCodeCatalog {
  return rollingBearingBoreCode;
}

export function getRollingBearingDimensionCatalog(): RollingBearingDimensionCatalog {
  return rollingBearingDimensions;
}

export function getRollingBearingSeriesCatalog(): RollingBearingSeriesCatalog {
  return rollingBearingSeries;
}

export function getRollingBearingSuffixCatalog(): RollingBearingSuffixCatalog {
  return rollingBearingSuffix;
}

/** Catalog prep spec only — no production bearing parser in app resolver yet. */
export function getRollingBearingParserSpecCatalog(): RollingBearingParserSpecCatalog {
  return rollingBearingParserSpec;
}

/** Catalog prep spec only — generation templates are staging candidates. */
export function getRollingBearingGenerationSpecCatalog(): RollingBearingGenerationSpecCatalog {
  return rollingBearingGenerationSpec;
}

export function getRollingBearingMappingCatalog(): RollingBearingMappingCatalog {
  return rollingBearingMapping;
}

export function getRollingBearingUnknownOrReviewCatalog(): RollingBearingUnknownOrReviewCatalog {
  return rollingBearingUnknownOrReview;
}
