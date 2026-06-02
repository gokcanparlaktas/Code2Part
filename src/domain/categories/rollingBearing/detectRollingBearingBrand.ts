import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

import type { BearingBrandDetection, BearingSuffixResolution } from './types';

const EXPLICIT_BRAND_PATTERN =
  /^(SKF|FAG|SCHAEFFLER|INA|TIMKEN|NSK|NTN|KOYO|JTEKT)(?=\d)/i;

export function extractExplicitBrandToken(
  normalizedCode: string
): { brandToken: string; remainder: string } | null {
  const match = normalizedCode.match(EXPLICIT_BRAND_PATTERN);
  if (!match) {
    return null;
  }
  const brandToken = match[1].toUpperCase();
  const remainder = normalizedCode.slice(match[0].length).replace(/^[\s\-/]+/, '');
  return { brandToken, remainder };
}

function resolveExplicitManufacturer(
  brandToken: string,
  catalogProvider: CatalogDataProvider
): { manufacturer: string; brandAlias?: string } | null {
  const catalog = catalogProvider.getRollingBearingBrandDetectionCatalog();
  const upper = brandToken.toUpperCase();

  for (const entry of catalog.explicitBrandTokens) {
    const examples = entry.rawTokenExamples.map((t) => t.toUpperCase());
    if (examples.includes(upper)) {
      return {
        manufacturer: entry.manufacturer,
        brandAlias: entry.brandAliases?.find((a) => a.toUpperCase() === upper),
      };
    }
  }
  return null;
}

function isAmbiguousSuffix(
  rawToken: string,
  catalogProvider: CatalogDataProvider
): boolean {
  const catalog = catalogProvider.getRollingBearingBrandDetectionCatalog();
  return catalog.ambiguousCommonSuffixes.some(
    (entry) => entry.rawToken.toUpperCase() === rawToken.toUpperCase()
  );
}

export function detectRollingBearingBrand(input: {
  normalizedCode: string;
  suffixResolutions: BearingSuffixResolution[];
  catalogProvider?: CatalogDataProvider;
}): BearingBrandDetection {
  const catalogProvider = input.catalogProvider ?? getDefaultCatalogDataProvider();
  const explicit = extractExplicitBrandToken(input.normalizedCode);

  if (explicit) {
    const resolved = resolveExplicitManufacturer(explicit.brandToken, catalogProvider);
    if (resolved) {
      return {
        manufacturer: resolved.manufacturer,
        brandAlias: resolved.brandAlias ?? null,
        detectionType: 'explicit_brand_token',
        confidence: 'high',
        needsReview: true,
        hintManufacturers: [],
        notesTr: [],
      };
    }
  }

  const catalog = catalogProvider.getRollingBearingBrandDetectionCatalog();
  const hintSets: string[][] = [];
  const notesTr: string[] = [];
  let hasAmbiguous = false;

  for (const suffix of input.suffixResolutions) {
    const token = suffix.rawToken.toUpperCase();
    if (isAmbiguousSuffix(token, catalogProvider)) {
      hasAmbiguous = true;
      continue;
    }

    const hint = catalog.suffixBrandHints.find(
      (entry) => entry.rawToken.toUpperCase() === token
    );
    if (hint) {
      hintSets.push(hint.manufacturerCandidates);
      if (hint.notes?.length) {
        notesTr.push(...hint.notes);
      }
    }
  }

  if (hintSets.length === 1 && hintSets[0].length === 1) {
    return {
      manufacturer: hintSets[0][0],
      brandAlias: null,
      detectionType: 'suffix_hint',
      confidence: 'medium',
      needsReview: true,
      hintManufacturers: hintSets[0],
      notesTr: ['Marka tahmini (suffix ipucu). Kesin marka kanıtı değildir.', ...notesTr],
    };
  }

  if (hintSets.length > 0) {
    const merged = [...new Set(hintSets.flat())];
    return {
      manufacturer: merged.length === 1 ? merged[0] : null,
      brandAlias: null,
      detectionType: merged.length === 1 ? 'suffix_hint' : 'unknown',
      confidence: 'low',
      needsReview: true,
      hintManufacturers: merged,
      notesTr:
        merged.length > 1
          ? ['Birden fazla marka ipucu; marka belirsiz.', ...notesTr]
          : ['Marka tahmini (suffix ipucu).', ...notesTr],
    };
  }

  if (hasAmbiguous) {
    return {
      manufacturer: null,
      brandAlias: null,
      detectionType: 'ambiguous_common_suffix',
      confidence: 'low',
      needsReview: true,
      hintManufacturers: [],
      notesTr: ['Ortak suffix nedeniyle marka belirsiz (ör. ZZ, 2Z, 2RS, C3).'],
    };
  }

  return {
    manufacturer: null,
    brandAlias: null,
    detectionType: 'unknown',
    confidence: 'unknown',
    needsReview: true,
    hintManufacturers: [],
    notesTr: ['Marka belirsiz.'],
  };
}
