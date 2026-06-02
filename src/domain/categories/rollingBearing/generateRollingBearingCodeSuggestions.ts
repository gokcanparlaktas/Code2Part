import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

import { getManufacturerSealSuffixCheckNotesTr } from './manufacturerSealSuffixNotes';
import { findVariantGroupIdForSealMeaning } from './resolveRollingBearingSuffixes';
import type { BearingCodeSuggestion, BearingDecodedProfile, BearingSuffixResolution } from './types';

const TARGET_MANUFACTURERS = ['SKF', 'Schaeffler', 'NSK', 'NTN', 'JTEKT', 'Timken'] as const;

const BEARING_EQUIVALENT_DISCLAIMER_TR =
  'Metrik rulman standardına göre üretici kod önerisi.';

function primarySealSuffix(profile: BearingDecodedProfile): BearingSuffixResolution | undefined {
  return profile.suffixResolutions.find((s) => s.attributeKey === 'seal_or_shield');
}

function formatCodeForManufacturer(
  baseCode: string,
  manufacturer: string,
  suffixTokens: string[],
  clearance: string | null
): string {
  const sealPart = suffixTokens.join('');
  if (!sealPart && !clearance) {
    return baseCode;
  }

  if (manufacturer === 'NSK' || manufacturer === 'NTN' || manufacturer === 'JTEKT') {
    const body = `${baseCode}${sealPart}`;
    return clearance ? `${body}/${clearance}` : body;
  }

  if (manufacturer === 'Schaeffler' && suffixTokens.includes('ZZ') && !suffixTokens.includes('2Z')) {
    const tokens = suffixTokens.map((t) => (t === 'ZZ' ? 'ZZ' : t));
    const joined = tokens.join('-');
    const base = `${baseCode}-${joined}`;
    return clearance ? `${base}/${clearance}` : base;
  }

  const joined = suffixTokens.join('-');
  const base = joined ? `${baseCode}-${joined}` : baseCode;
  return clearance ? `${base}/${clearance}` : base;
}

function manufacturerSuffixTokens(
  manufacturer: string,
  variantGroupId: string | null,
  catalogProvider: CatalogDataProvider
): string[] {
  if (!variantGroupId) {
    return [];
  }

  const catalog = catalogProvider.getRollingBearingSuffixCatalog();
  const group = catalog.brandVariantGroups.find((g) => g.variantGroupId === variantGroupId);
  if (!group) {
    return [];
  }

  const example = group.brandTokenExamples.find(
    (b) =>
      b.manufacturer === manufacturer ||
      b.brandAliases?.some((a) => manufacturer === 'Schaeffler' && a === 'FAG')
  );

  if (!example) {
    return [];
  }

  return example.rawTokenExamples
    .map((t) => t.replace(/\s+review$/i, '').toUpperCase())
    .filter((t) => t && !t.includes(' '));
}

export function generateRollingBearingCodeSuggestions(
  profile: BearingDecodedProfile,
  options?: {
    targetManufacturers?: string[];
    catalogProvider?: CatalogDataProvider;
  }
): BearingCodeSuggestion[] {
  const catalogProvider = options?.catalogProvider ?? getDefaultCatalogDataProvider();

  if (!profile.baseCode || profile.dimensions.status !== 'complete') {
    return [];
  }

  const seal = primarySealSuffix(profile);
  let variantGroupId =
    seal?.variantGroupId ??
    findVariantGroupIdForSealMeaning(seal?.normalizedMeaning ?? null, catalogProvider);

  if (!variantGroupId && seal?.sealShieldType === 'metal_shield' && (seal.sideCount ?? 0) >= 2) {
    variantGroupId = 'two_metal_shields';
  }
  if (!variantGroupId && seal?.sealShieldType === 'rubber_seal' && (seal.sideCount ?? 0) >= 2) {
    variantGroupId = 'two_rubber_seals';
  }

  const targets = options?.targetManufacturers ?? [...TARGET_MANUFACTURERS];
  const suggestions: BearingCodeSuggestion[] = [];

  for (const manufacturer of targets) {
    if (
      profile.brand.detectionType === 'explicit_brand_token' &&
      profile.brand.manufacturer &&
      profile.brand.manufacturer !== manufacturer
    ) {
      continue;
    }

    const suffixTokens = manufacturerSuffixTokens(manufacturer, variantGroupId, catalogProvider);
    if (variantGroupId && suffixTokens.length === 0) {
      continue;
    }

    const suggestedCode = formatCodeForManufacturer(
      profile.baseCode,
      manufacturer,
      suffixTokens,
      profile.internalClearance
    );

    suggestions.push({
      manufacturer,
      brandAlias: manufacturer === 'Schaeffler' ? 'FAG' : undefined,
      suggestedCode,
      generationStatus: suffixTokens.length > 0 ? 'generated_full' : 'generated_partial',
      requiresCheck: true,
      checkNotesTr: getManufacturerSealSuffixCheckNotesTr(manufacturer),
      suffixTokensUsed: suffixTokens,
    });
  }

  if (
    profile.brand.manufacturer === null &&
    variantGroupId &&
    suggestions.length === 0
  ) {
    for (const manufacturer of targets) {
      const suffixTokens = manufacturerSuffixTokens(manufacturer, variantGroupId, catalogProvider);
      if (suffixTokens.length === 0) {
        continue;
      }
      suggestions.push({
        manufacturer,
        brandAlias: manufacturer === 'Schaeffler' ? 'FAG' : undefined,
        suggestedCode: formatCodeForManufacturer(
          profile.baseCode,
          manufacturer,
          suffixTokens,
          profile.internalClearance
        ),
        generationStatus: 'generated_full',
        requiresCheck: true,
        checkNotesTr: getManufacturerSealSuffixCheckNotesTr(manufacturer),
        suffixTokensUsed: suffixTokens,
      });
    }
  }

  return suggestions;
}
