import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { ROLLING_BEARING_CATEGORY } from '@/types/category';
import type { ProductIdentification } from '@/types/product';
import type { SuggestedProduct, SuggestedProductDetectedAttributes } from '@/types/suggestion';

import {
  METAL_COVER_VARIANT_DESCRIPTION_TR,
  MULTI_BRAND_LABEL_TR,
  RUBBER_SEAL_DESCRIPTION_TR,
} from './bearingDisplayLabels';
import { ROLLING_BEARING_SERIES_ID } from './rollingBearingIdentify';
import type { BearingDecodedProfile } from './types';

const BEARING_BASE_CODE_SUFFIX_VARIANTS = [
  { codeSuffix: '', descriptionTr: 'Açık tip (suffix yok)' },
  { codeSuffix: '2RS', descriptionTr: `${RUBBER_SEAL_DESCRIPTION_TR} (2RS)` },
  { codeSuffix: 'ZZ', descriptionTr: METAL_COVER_VARIANT_DESCRIPTION_TR },
  { codeSuffix: '2Z', descriptionTr: METAL_COVER_VARIANT_DESCRIPTION_TR },
] as const;

function hasBearingSuffixInProfile(profile: BearingDecodedProfile): boolean {
  return profile.suffixResolutions.length > 0 || Boolean(profile.suffixBlock?.trim());
}

export function formatBearingVariantCode(baseCode: string, codeSuffix: string): string {
  if (!codeSuffix) {
    return baseCode;
  }
  return `${baseCode}-${codeSuffix}`;
}

export function buildBearingSuggestionDetectedAttributes(
  identification: ProductIdentification
): SuggestedProductDetectedAttributes {
  const attrs: SuggestedProductDetectedAttributes = {};
  if (identification.bore.value != null) {
    attrs.boreMm = Number(identification.bore.value);
  }
  if (identification.outsideDiameter?.value != null) {
    attrs.outsideDiameterMm = Number(identification.outsideDiameter.value);
  }
  const width =
    identification.bearingWidth?.value ?? identification.stroke.value ?? null;
  if (width != null) {
    attrs.widthMm = Number(width);
  }
  return attrs;
}

/**
 * When the user enters a base designation (e.g. 6003) without seal/shield suffix,
 * offer common suffix variants instead of a single catalog series row.
 */
export function suggestRollingBearingVariantSuggestions(
  rawInput: string,
  identification: ProductIdentification,
  limit: number
): SuggestedProduct[] | null {
  if (identification.resolverCategoryKey !== ROLLING_BEARING_CATEGORY) {
    return null;
  }

  const profile = identification.bearingDecode;
  if (!profile?.baseCode || identification.outcome === 'not_found') {
    return null;
  }

  if (hasBearingSuffixInProfile(profile)) {
    return null;
  }

  const series = getProductSeriesById(ROLLING_BEARING_SERIES_ID);
  if (!series) {
    return null;
  }

  const normalizedInput = normalizeCode(rawInput);
  const productTypeTr = identification.productType.value ?? 'Rulman';
  const standardFamily = identification.standardFamily.value ?? series.standardFamily;
  const detectedAttributes = buildBearingSuggestionDetectedAttributes(identification);
  const baseCode = profile.baseCode;

  const suggestions: SuggestedProduct[] = BEARING_BASE_CODE_SUFFIX_VARIANTS.map(
    (variant, index) => {
      const exampleCode = formatBearingVariantCode(baseCode, variant.codeSuffix);
      const isExactInput = normalizedInput === normalizeCode(exampleCode);

      return {
        seriesId: ROLLING_BEARING_SERIES_ID,
        brand: identification.brand.value ?? MULTI_BRAND_LABEL_TR,
        series: baseCode,
        productTypeTr,
        standardFamily,
        equivalenceGroup: series.equivalenceGroup ?? series.equivalenceGroupId ?? '',
        confidence: isExactInput ? 'high' : index === 0 ? 'high' : 'medium',
        matchedBy: isExactInput ? 'exact_match' : 'series_prefix',
        detectedAttributes,
        missingFields: variant.codeSuffix ? [] : ['seal_material'],
        exampleCodeFormat: exampleCode,
        suggestionTextTr: variant.codeSuffix
          ? `${baseCode} · ${variant.descriptionTr}`
          : `${baseCode} · taban kod (conta veya metal kapak seçin)`,
      };
    }
  );

  suggestions.sort((a, b) => {
    if (a.matchedBy === 'exact_match') {
      return -1;
    }
    if (b.matchedBy === 'exact_match') {
      return 1;
    }
    return 0;
  });

  return suggestions.slice(0, limit);
}
