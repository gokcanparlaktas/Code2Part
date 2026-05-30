import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import {
  canSearchEquivalentsForIdentification,
} from '@/domain/resolver/partialSourceEquivalents';

import {
  mapComparisonToEquivalentCandidateSummary,
  mapFindEquivalentsResponse,
  type FindEquivalentsResponseDto,
} from '@/backend/dto/mapFindEquivalentsResponse';
import { ensureCatalogProviderInitialized } from '@/backend/services/ensureCatalogProviderInitialized';

export interface FindEquivalentsServiceOptions {
  code: string;
  catalogProvider?: CatalogDataProvider;
}

export async function findEquivalentsService(
  options: FindEquivalentsServiceOptions
): Promise<FindEquivalentsResponseDto> {
  await ensureCatalogProviderInitialized(options.catalogProvider);
  const resolved = resolveProductSearch(options.code);
  const source = resolved.identification;

  if (!canSearchEquivalentsForIdentification(source)) {
    return mapFindEquivalentsResponse({
      sourceCode: options.code,
      normalizedCode: source.normalizedCode,
      manufacturer: source.brand.value,
      series: source.series.value,
      candidates: [],
    });
  }

  const candidates = resolved.compatibilityResults
    .map((comparison) => {
      const candidateCode = comparison.candidate.suggestedCode?.trim();
      if (!candidateCode) {
        return null;
      }

      const match = calculateMatchPercentage(comparison);

      return mapComparisonToEquivalentCandidateSummary(
        comparison,
        candidateCode,
        comparison.candidate.brand,
        comparison.candidate.series,
        match.percentage
      );
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return mapFindEquivalentsResponse({
    sourceCode: options.code,
    normalizedCode: source.normalizedCode,
    manufacturer: source.brand.value,
    series: source.series.value,
    candidates,
  });
}
