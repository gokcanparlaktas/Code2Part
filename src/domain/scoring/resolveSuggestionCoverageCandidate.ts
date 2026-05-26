import { getAllCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import { compactProductCode } from './calculateSuggestionMatchPercentage';

let longestExampleBySeriesId: Map<string, string> | null = null;

function buildLongestExampleBySeriesId(): Map<string, string> {
  const best = new Map<string, { code: string; length: number }>();

  for (const code of getAllCatalogExampleCodes()) {
    const normalized = normalizeCode(code);
    const identification = identifyProduct(code, normalized);
    if (!identification.seriesId) {
      continue;
    }

    const compactLength = compactProductCode(code).length;
    const current = best.get(identification.seriesId);
    if (!current || compactLength > current.length) {
      best.set(identification.seriesId, { code, length: compactLength });
    }
  }

  return new Map([...best.entries()].map(([seriesId, entry]) => [seriesId, entry.code]));
}

function getLongestExampleBySeriesId(): Map<string, string> {
  if (!longestExampleBySeriesId) {
    longestExampleBySeriesId = buildLongestExampleBySeriesId();
  }
  return longestExampleBySeriesId;
}

/**
 * Picks the longest known catalog example for coverage scoring when the suggestion
 * only carries a short prefix/template code (e.g. "DSBC" instead of a full example).
 */
export function resolveSuggestionCoverageCandidate(
  seriesId: string,
  exampleCodeFormat: string
): string {
  const trimmed = exampleCodeFormat.trim();
  const referenceCode = getLongestExampleBySeriesId().get(seriesId);

  if (!referenceCode) {
    return trimmed;
  }

  if (!trimmed) {
    return referenceCode;
  }

  const trimmedLength = compactProductCode(trimmed).length;
  const referenceLength = compactProductCode(referenceCode).length;

  if (trimmedLength >= referenceLength) {
    return trimmed;
  }

  return referenceCode;
}
