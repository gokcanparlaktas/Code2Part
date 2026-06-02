import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { resolveBoreCodeCandidate } from '@/domain/catalogData/bearings/resolvers/resolveBoreCodeCandidate';
import { resolveBearingDimensionByBaseCode } from '@/domain/catalogData/bearings/resolvers/resolveBearingDimensionCandidate';

import { detectRollingBearingBrand, extractExplicitBrandToken } from './detectRollingBearingBrand';
import { detectRollingBearingSeries } from './detectRollingBearingSeries';
import {
  resolveRollingBearingSuffixes,
  tokenizeSuffixBlock,
} from './resolveRollingBearingSuffixes';
import { splitBearingDesignation } from './splitBearingDesignation';
import type { BearingDecodedDimensions, BearingDecodedProfile, BearingRawToken } from './types';

function buildDimensions(
  baseCode: string,
  boreCode: string,
  catalogProvider: CatalogDataProvider
): BearingDecodedDimensions {
  const boreResolved = resolveBoreCodeCandidate(boreCode, catalogProvider);
  const dimensionResolved = resolveBearingDimensionByBaseCode(baseCode, catalogProvider);

  let boreMm: number | null = null;
  if (boreResolved.found) {
    const numeric = Number.parseInt(boreCode, 10);
    if (numeric <= 3) {
      const fixed = catalogProvider.getRollingBearingBoreCodeCatalog().boreCodeRules.find(
        (rule) => rule.rawToken === boreCode
      );
      boreMm = fixed?.boreDiameter?.value ?? null;
    } else if (numeric >= 4) {
      boreMm = numeric * 5;
    }
  }
  const outsideMm = dimensionResolved.found ? dimensionResolved.outsideDiameterMm ?? null : null;
  const widthMm = dimensionResolved.found ? dimensionResolved.widthMm ?? null : null;

  if (dimensionResolved.found && boreMm !== null && outsideMm !== null && widthMm !== null) {
    return {
      status: 'complete',
      boreDiameterMm: boreMm,
      outsideDiameterMm: outsideMm,
      widthMm,
      boreEvidence: 'code',
      outsideDiameterEvidence: 'series_table',
      widthEvidence: 'series_table',
    };
  }

  if (boreResolved.found && boreMm !== null) {
    return {
      status: 'dimensions_unknown_or_check',
      boreDiameterMm: boreMm,
      outsideDiameterMm: null,
      widthMm: null,
      boreEvidence: 'code',
      outsideDiameterEvidence: 'unknown',
      widthEvidence: 'unknown',
    };
  }

  return {
    status: 'bore_only',
    boreDiameterMm: null,
    outsideDiameterMm: null,
    widthMm: null,
    boreEvidence: 'unknown',
    outsideDiameterEvidence: 'unknown',
    widthEvidence: 'unknown',
  };
}

export function parseRollingBearingCode(
  inputCode: string,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): BearingDecodedProfile {
  const normalizedCode = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const decodeNotesTr: string[] = [];

  const explicitBrand = extractExplicitBrandToken(normalizedCode);
  const remainder = explicitBrand?.remainder ?? normalizedCode;
  const { baseCode, suffixBlock, suffixTokens: peeledSuffixTokens } =
    splitBearingDesignation(remainder);

  if (!baseCode) {
    return {
      inputCode,
      normalizedCode,
      baseCode: null,
      seriesPrefix: null,
      boreCode: null,
      suffixBlock: null,
      rawTokens: [],
      suffixResolutions: [],
      series: null,
      brand: detectRollingBearingBrand({
        normalizedCode,
        suffixResolutions: [],
        catalogProvider,
      }),
      dimensions: {
        status: 'bore_only',
        boreDiameterMm: null,
        outsideDiameterMm: null,
        widthMm: null,
        boreEvidence: 'unknown',
        outsideDiameterEvidence: 'unknown',
        widthEvidence: 'unknown',
      },
      internalClearance: null,
      decodeNotesTr: [...decodeNotesTr, 'Taban kod çıkarılamadı.'],
    };
  }

  const boreCode = baseCode.slice(-2);
  const suffixTokens =
    peeledSuffixTokens.length > 0
      ? peeledSuffixTokens
      : suffixBlock
        ? tokenizeSuffixBlock(suffixBlock)
        : [];
  const suffixResolutions = resolveRollingBearingSuffixes(suffixTokens, catalogProvider);
  const series = detectRollingBearingSeries(baseCode, catalogProvider);
  const dimensions = buildDimensions(baseCode, boreCode, catalogProvider);

  if (dimensions.status === 'dimensions_unknown_or_check') {
    decodeNotesTr.push('d/D/B boyutları bu taban kod için henüz tanımlı değil.');
  }

  const rawTokens: BearingRawToken[] = [];
  let position = 0;
  if (explicitBrand) {
    rawTokens.push({
      attributeKey: 'manufacturer',
      rawToken: explicitBrand.brandToken,
      position: position++,
    });
  }
  rawTokens.push({ attributeKey: 'base_code', rawToken: baseCode, position: position++ });
  rawTokens.push({ attributeKey: 'bore_code', rawToken: boreCode, position: position++ });
  for (const suffix of suffixResolutions) {
    rawTokens.push({
      attributeKey: suffix.attributeKey,
      rawToken: suffix.rawToken,
      position: position++,
    });
  }

  const internalClearance =
    suffixResolutions.find((s) => s.rawToken === 'C3' || s.rawToken === 'C4')?.rawToken ?? null;

  const brand = detectRollingBearingBrand({
    normalizedCode,
    suffixResolutions,
    catalogProvider,
  });


  return {
    inputCode,
    normalizedCode,
    baseCode,
    seriesPrefix: series?.seriesPrefix ?? null,
    boreCode,
    suffixBlock,
    rawTokens,
    suffixResolutions,
    series,
    brand,
    dimensions,
    internalClearance,
    decodeNotesTr,
  };
}
