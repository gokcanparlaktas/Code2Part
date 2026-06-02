import type { BearingBrandDetection, BearingSuffixResolution } from './types';

export const MULTI_BRAND_LABEL_TR = 'Çoklu marka';

export const METAL_COVER_DESCRIPTION_TR = 'Çift metal kapak';
export const METAL_COVER_VARIANT_DESCRIPTION_TR = 'Çift metal kapak (ZZ / 2Z)';
export const RUBBER_SEAL_DESCRIPTION_TR = 'Çift conta';

const METAL_COVER_TOKENS = new Set(['ZZ', '2Z', '2ZR', 'Z']);

export function isMetalCoverToken(token: string): boolean {
  return METAL_COVER_TOKENS.has(token.toUpperCase());
}

export function formatSealMeaningTr(
  normalizedMeaning: string | null,
  rawToken?: string
): string | null {
  const token = rawToken?.toUpperCase();
  if (token && isMetalCoverToken(token)) {
    return METAL_COVER_DESCRIPTION_TR;
  }

  const lower = normalizedMeaning?.toLowerCase() ?? '';
  if (lower.includes('metal') && (lower.includes('shield') || lower.includes('cover'))) {
    return METAL_COVER_DESCRIPTION_TR;
  }
  if (lower.includes('rubber') || lower.includes('contact seal') || lower.includes('seal')) {
    return RUBBER_SEAL_DESCRIPTION_TR;
  }
  if (token === '2RS' || token === '2RS1' || token === '2RSH' || token === '2RSR') {
    return RUBBER_SEAL_DESCRIPTION_TR;
  }

  if (!normalizedMeaning?.trim()) {
    return null;
  }

  return normalizedMeaning;
}

export function formatSealFromResolution(suffix: BearingSuffixResolution): string {
  return (
    formatSealMeaningTr(suffix.normalizedMeaning, suffix.rawToken) ??
    suffix.rawToken
  );
}

export function formatBearingBrandLabel(brand: BearingBrandDetection): string | null {
  if (brand.manufacturer) {
    return brand.brandAlias
      ? `${brand.manufacturer} (${brand.brandAlias})`
      : brand.manufacturer;
  }

  if (
    brand.detectionType === 'ambiguous_common_suffix' ||
    brand.detectionType === 'unknown' ||
    brand.hintManufacturers.length > 1
  ) {
    return MULTI_BRAND_LABEL_TR;
  }

  return null;
}
