import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { ROLLING_BEARING_CATEGORY } from '@/types/category';
import type {
  ConfidenceLevel,
  IdentificationOutcome,
  ProductIdentification,
  TechnicalAttribute,
} from '@/types/product';

import {
  formatBearingBrandLabel,
  formatSealFromResolution,
} from './bearingDisplayLabels';
import {
  attributeFromBearingCode,
  attributeFromBearingStandard,
} from './bearingAttributePolicy';
import { bearingTypeNameTrForSeriesGroup } from './bearingTypeLabels';
import { parseRollingBearingCode } from './parseRollingBearingCode';
import type { BearingDecodedProfile } from './types';

export const ROLLING_BEARING_SERIES_ID = 'rolling_bearing_metric';

function attributeUnknown<T extends string | number>(): TechnicalAttribute<T> {
  return { value: null, evidence: 'unknown', requiresCheck: true };
}

function resolveBrandAttribute(profile: BearingDecodedProfile): TechnicalAttribute<string> {
  const display = formatBearingBrandLabel(profile.brand);
  if (display) {
    return profile.brand.detectionType === 'explicit_brand_token'
      ? attributeFromBearingCode(display)
      : attributeFromBearingStandard(display);
  }
  return attributeUnknown();
}

function resolveOutcome(profile: BearingDecodedProfile): IdentificationOutcome {
  if (!profile.baseCode || !profile.series) {
    return 'not_found';
  }
  if (profile.dimensions.status === 'complete') {
    return 'full';
  }
  return 'series_only';
}

function resolveConfidence(profile: BearingDecodedProfile, outcome: IdentificationOutcome): ConfidenceLevel {
  if (outcome === 'not_found') {
    return 'unknown';
  }
  if (profile.dimensions.status !== 'complete') {
    return 'medium';
  }
  return 'high';
}

function primarySealDisplay(profile: BearingDecodedProfile): string | null {
  const seal = profile.suffixResolutions.find((s) => s.attributeKey === 'seal_or_shield');
  return seal ? formatSealFromResolution(seal) : null;
}

export function identifyRollingBearingProduct(
  inputCode: string,
  normalizedCode: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): ProductIdentification {
  const profile = parseRollingBearingCode(inputCode, catalogProvider);
  const outcome = resolveOutcome(profile);
  const matched = outcome !== 'not_found';

  const bore =
    profile.dimensions.boreDiameterMm !== null
      ? attributeFromBearingCode(profile.dimensions.boreDiameterMm, 'mm')
      : attributeUnknown();

  const outsideDiameter =
    profile.dimensions.outsideDiameterMm !== null
      ? attributeFromBearingStandard(profile.dimensions.outsideDiameterMm, 'mm')
      : attributeUnknown();

  const bearingWidth =
    profile.dimensions.widthMm !== null
      ? attributeFromBearingStandard(profile.dimensions.widthMm, 'mm')
      : attributeUnknown();

  const sealLabel = primarySealDisplay(profile);
  const sealOrShield = sealLabel
    ? attributeFromBearingStandard(sealLabel)
    : attributeUnknown();

  const internalClearance = profile.internalClearance
    ? attributeFromBearingCode(profile.internalClearance)
    : undefined;

  return {
    inputCode,
    normalizedCode,
    seriesId: matched ? ROLLING_BEARING_SERIES_ID : null,
    resolverCategoryKey: matched ? ROLLING_BEARING_CATEGORY : null,
    matched,
    outcome,
    brand: resolveBrandAttribute(profile),
    series: profile.baseCode
      ? attributeFromBearingCode(profile.baseCode)
      : attributeUnknown(),
    productType: profile.series
      ? attributeFromBearingStandard(
          profile.series.bearingTypeNameTr ||
            bearingTypeNameTrForSeriesGroup(profile.series.seriesGroup)
        )
      : attributeUnknown(),
    productCategory: attributeFromBearingStandard('Rulman'),
    standardFamily: attributeFromBearingStandard('Metrik rulman'),
    bore,
    stroke: bearingWidth,
    outsideDiameter,
    bearingWidth,
    sealOrShield,
    internalClearance,
    bearingBaseCode: profile.baseCode
      ? attributeFromBearingCode(profile.baseCode)
      : attributeUnknown(),
    bearingDecode: profile,
    confidence: resolveConfidence(profile, outcome),
  };
}
