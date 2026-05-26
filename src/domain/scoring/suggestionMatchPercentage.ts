import type { SuggestedProduct } from '@/types/suggestion';

import { calculateSuggestionMatchPercentage } from './calculateSuggestionMatchPercentage';
import type { MatchPercentageResult } from './calculateMatchPercentage';
import { resolveSuggestionCoverageCandidate } from './resolveSuggestionCoverageCandidate';

export function matchPercentageFromSuggestion(
  rawQuery: string,
  suggestion: SuggestedProduct
): MatchPercentageResult {
  const candidateCode = resolveSuggestionCoverageCandidate(
    suggestion.seriesId,
    suggestion.exampleCodeFormat ?? ''
  );

  return calculateSuggestionMatchPercentage(rawQuery, candidateCode, {
    fallbackSeriesName: suggestion.series,
  });
}
