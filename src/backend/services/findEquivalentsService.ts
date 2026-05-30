import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { findEquivalents } from '@/domain/resolver/findEquivalents';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

import {
  mapComparisonToEquivalentCandidateSummary,
  mapFindEquivalentsResponse,
  type FindEquivalentsResponseDto,
} from '@/backend/dto/mapFindEquivalentsResponse';
import { buildCandidateFromEquivalent } from '@/backend/services/buildCandidateFromCode';
import { compareSourceToCandidate } from '@/backend/services/compareSourceToCandidate';
import { ensureCatalogProviderInitialized } from '@/backend/services/ensureCatalogProviderInitialized';

export interface FindEquivalentsServiceOptions {
  code: string;
  catalogProvider?: CatalogDataProvider;
}

export async function findEquivalentsService(
  options: FindEquivalentsServiceOptions
): Promise<FindEquivalentsResponseDto> {
  const catalogProvider = await ensureCatalogProviderInitialized(options.catalogProvider);
  const normalized = normalizeCode(options.code);
  const source = identifyProduct(options.code, normalized);
  const discoveries = findEquivalents(source);

  const candidates = discoveries
    .map((discovery) => {
      const candidate = buildCandidateFromEquivalent(discovery);
      const candidateCode = candidate.suggestedCode?.trim();
      if (!candidateCode) {
        return null;
      }

      const comparison = compareSourceToCandidate(source, candidate, catalogProvider);
      const match = calculateMatchPercentage(comparison);

      return mapComparisonToEquivalentCandidateSummary(
        comparison,
        candidateCode,
        candidate.brand,
        candidate.series,
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
