import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getDefaultCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';

import type { BearingSuffixResolution } from './types';

export const KNOWN_ROLLING_BEARING_SUFFIX_TOKENS = [
  '2RS1',
  '2RSH',
  '2RSR',
  '2HRS',
  '2RS',
  '2RU',
  '2Z',
  'ZZ',
  'RS1',
  'RSH',
  'RSR',
  'HRS',
  'DDU',
  'DU',
  'ZZS',
  'ZS',
  'VV',
  'B',
  'LLU',
  'LLH',
  'LLB',
  'LU',
  'LH',
  'LB',
  'RS',
  'Z',
  'C3',
  'C4',
  'E',
  'K',
  'W33',
] as const;

const KNOWN_SUFFIX_TOKENS = KNOWN_ROLLING_BEARING_SUFFIX_TOKENS;

export function tokenizeSuffixBlock(suffixBlock: string): string[] {
  if (!suffixBlock.trim()) {
    return [];
  }

  const normalized = suffixBlock.replace(/\s+/g, '').toUpperCase();
  const parts = normalized.split(/[-/]+/).filter(Boolean);
  const tokens: string[] = [];

  for (const part of parts) {
    let remaining = part;
    while (remaining.length > 0) {
      const match = KNOWN_SUFFIX_TOKENS.filter((token) => remaining.startsWith(token)).sort(
        (a, b) => b.length - a.length
      )[0];

      if (!match) {
        tokens.push(remaining);
        break;
      }

      tokens.push(match);
      remaining = remaining.slice(match.length);
    }
  }

  return tokens;
}

export function resolveRollingBearingSuffixes(
  rawTokens: string[],
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): BearingSuffixResolution[] {
  const catalog = catalogProvider.getRollingBearingSuffixCatalog();
  const brandCatalog = catalogProvider.getRollingBearingBrandDetectionCatalog();
  const ambiguous = new Set(
    brandCatalog.ambiguousCommonSuffixes.map((e) => e.rawToken.toUpperCase())
  );

  return rawTokens.map((rawToken) => {
    const upper = rawToken.toUpperCase();
    const candidate = catalog.suffixCandidates.find(
      (entry) => entry.rawToken.toUpperCase() === upper
    );

    if (candidate) {
      return {
        rawToken: upper,
        attributeKey: candidate.attributeKey,
        normalizedMeaning: candidate.candidateMeaning ?? null,
        variantGroupId: undefined,
        sealShieldType: candidate.sealShieldType,
        sideCount: candidate.sideCount,
        confidence: candidate.confidence ?? 'low',
        needsReview: candidate.needsReview ?? true,
        isAmbiguousForBrand: ambiguous.has(upper),
      };
    }

    const group = catalog.brandVariantGroups.find((g) =>
      g.brandTokenExamples.some((b) =>
        b.rawTokenExamples.some((t) => t.replace(/\s+review$/i, '').toUpperCase() === upper)
      )
    );

    const directCandidate = catalog.suffixCandidates.find(
      (entry) => entry.rawToken.toUpperCase() === upper
    );
    const groupFromCandidate = directCandidate
      ? catalog.brandVariantGroups.find((g) => {
          if (directCandidate.sealShieldType && g.sealShieldType) {
            return (
              directCandidate.sealShieldType === g.sealShieldType &&
              (directCandidate.sideCount ?? g.sideCount) === g.sideCount
            );
          }
          const meaning = directCandidate.candidateMeaning?.toLowerCase() ?? '';
          return g.normalizedStarterMeaning.toLowerCase().includes(meaning.split(' ')[0] ?? '');
        })
      : undefined;

    const resolvedGroup = group ?? groupFromCandidate;

    return {
      rawToken: upper,
      attributeKey: resolvedGroup?.attributeKey ?? directCandidate?.attributeKey ?? 'suffix_unknown',
      normalizedMeaning:
        resolvedGroup?.normalizedStarterMeaning ?? directCandidate?.candidateMeaning ?? null,
      variantGroupId: resolvedGroup?.variantGroupId,
      sealShieldType: resolvedGroup?.sealShieldType ?? directCandidate?.sealShieldType,
      sideCount: resolvedGroup?.sideCount ?? directCandidate?.sideCount,
      confidence: directCandidate?.confidence ?? resolvedGroup?.confidence ?? 'unknown',
      needsReview: true,
      isAmbiguousForBrand: ambiguous.has(upper),
    };
  });
}

export function findVariantGroupIdForSealMeaning(
  normalizedMeaning: string | null,
  catalogProvider: CatalogDataProvider = getDefaultCatalogDataProvider()
): string | null {
  if (!normalizedMeaning) {
    return null;
  }
  const catalog = catalogProvider.getRollingBearingSuffixCatalog();
  const group = catalog.brandVariantGroups.find(
    (g) => g.normalizedStarterMeaning === normalizedMeaning
  );
  return group?.variantGroupId ?? null;
}
