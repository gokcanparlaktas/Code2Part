import type { SuggestedProduct } from '@/types/suggestion';

import { compactProductCode } from './calculateSuggestionMatchPercentage';
import { calculateSuggestionMatchPercentage } from './calculateSuggestionMatchPercentage';
import type { MatchPercentageResult } from './calculateMatchPercentage';
import { resolveSuggestionCoverageCandidate } from './resolveSuggestionCoverageCandidate';

export function matchPercentageFromSuggestion(
  rawQuery: string,
  suggestion: SuggestedProduct
): MatchPercentageResult {
  const example = suggestion.exampleCodeFormat ?? '';
  const compactQuery = compactProductCode(rawQuery);
  const compactExample = compactProductCode(example);
  // Full catalog identification: use the exact example code for scoring (100%).
  // Do not use compact equality alone — short series-prefix suggestions (e.g. "4WE6")
  // can share the same compact form as the query without being a full code match.
  const isExactCatalogMatch =
    suggestion.matchedBy === 'exact_match' &&
    example.trim().length > 0 &&
    compactQuery === compactExample;
  const candidateCode = isExactCatalogMatch
    ? example
    : resolveSuggestionCoverageCandidate(suggestion.seriesId, example);

  return calculateSuggestionMatchPercentage(rawQuery, candidateCode, {
    fallbackSeriesName: suggestion.series,
  });
}
