import type { SuggestedProduct } from '@/types/suggestion';

import {
  clampMatchPercentage,
  getMatchColorForLevel,
  resolveMatchPercentageLevel,
  type MatchPercentageResult,
} from './calculateMatchPercentage';
import { compactProductCode } from './calculateSuggestionMatchPercentage';
import { calculateSuggestionMatchPercentage } from './calculateSuggestionMatchPercentage';
import { resolveSuggestionCoverageCandidate } from './resolveSuggestionCoverageCandidate';

/** Full score when the query is an exact series code (e.g. 4WE6, DSBC). */
export const SERIES_CODE_EXACT_MATCH_PERCENTAGE = 100;

/** Cap for in-progress series code typing (e.g. 4WE before 6/10). */
export const PARTIAL_SERIES_CODE_PREFIX_MAX_PERCENTAGE = 85;

function isExactSeriesCodeMatch(rawQuery: string, suggestion: SuggestedProduct): boolean {
  if (suggestion.matchedBy !== 'series_prefix') {
    return false;
  }

  const compactQuery = compactProductCode(rawQuery);
  if (compactQuery.length < 2) {
    return false;
  }

  const compactSeries = compactProductCode(suggestion.series);
  const compactExample = compactProductCode(suggestion.exampleCodeFormat);

  return compactQuery === compactSeries || compactQuery === compactExample;
}

function resolveSeriesCodeReference(suggestion: SuggestedProduct): string {
  const compactSeries = compactProductCode(suggestion.series);
  const compactExample = compactProductCode(suggestion.exampleCodeFormat);
  const candidates = [compactSeries, compactExample].filter((value) => value.length > 0);

  if (candidates.length === 0) {
    return '';
  }

  return candidates.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}

function isPartialSeriesCodePrefix(rawQuery: string, suggestion: SuggestedProduct): boolean {
  if (suggestion.matchedBy !== 'series_prefix') {
    return false;
  }
  if (isExactSeriesCodeMatch(rawQuery, suggestion)) {
    return false;
  }

  const compactQuery = compactProductCode(rawQuery);
  if (compactQuery.length < 2) {
    return false;
  }

  const reference = resolveSeriesCodeReference(suggestion);
  return reference.length > compactQuery.length && reference.startsWith(compactQuery);
}

function calculatePartialSeriesCodePrefixPercentage(
  rawQuery: string,
  suggestion: SuggestedProduct
): number {
  const compactQuery = compactProductCode(rawQuery);
  const reference = resolveSeriesCodeReference(suggestion);
  const ratio = compactQuery.length / reference.length;

  return Math.min(
    clampMatchPercentage(Math.round(ratio * 100)),
    PARTIAL_SERIES_CODE_PREFIX_MAX_PERCENTAGE
  );
}

function toMatchResult(percentage: number): MatchPercentageResult {
  const level = resolveMatchPercentageLevel(percentage);
  return {
    percentage,
    level,
    color: getMatchColorForLevel(level),
  };
}

export function matchPercentageFromSuggestion(
  rawQuery: string,
  suggestion: SuggestedProduct
): MatchPercentageResult {
  if (isExactSeriesCodeMatch(rawQuery, suggestion)) {
    return toMatchResult(SERIES_CODE_EXACT_MATCH_PERCENTAGE);
  }

  if (isPartialSeriesCodePrefix(rawQuery, suggestion)) {
    return toMatchResult(calculatePartialSeriesCodePrefixPercentage(rawQuery, suggestion));
  }

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
