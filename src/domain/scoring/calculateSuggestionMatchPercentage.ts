import {
  clampMatchPercentage,
  getMatchColorForLevel,
  resolveMatchPercentageLevel,
  type MatchPercentageResult,
} from './calculateMatchPercentage';

const SERIES_FALLBACK_MAX_PERCENTAGE = 40;

export function compactProductCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s\-_/\\.]+/g, '');
}

export function tokenizeSuggestionQuery(rawQuery: string): string[] {
  return rawQuery
    .trim()
    .toUpperCase()
    .split(/[\s\-_/\\.]+/)
    .filter((token) => token.length > 0);
}

function countMatchedQueryChars(tokens: string[], compactCandidate: string): number {
  if (compactCandidate.length === 0 || tokens.length === 0) {
    return 0;
  }

  const seenTokens = new Set<string>();
  let matched = 0;

  for (const token of tokens) {
    if (seenTokens.has(token)) {
      continue;
    }
    seenTokens.add(token);

    if (compactCandidate.includes(token)) {
      matched += token.length;
      continue;
    }

    let candidateIndex = 0;
    for (const char of token) {
      const foundAt = compactCandidate.indexOf(char, candidateIndex);
      if (foundAt === -1) {
        break;
      }
      matched += 1;
      candidateIndex = foundAt + 1;
    }
  }

  return matched;
}

export interface CalculateSuggestionMatchPercentageOptions {
  /** Used when candidate code is empty; final score is capped at 40. */
  fallbackSeriesName?: string;
}

export function calculateSuggestionMatchPercentage(
  rawQuery: string,
  candidateCode: string,
  options: CalculateSuggestionMatchPercentageOptions = {}
): MatchPercentageResult {
  const compactQuery = compactProductCode(rawQuery);
  const trimmedCandidate = candidateCode.trim();
  const useSeriesFallback = trimmedCandidate.length === 0;

  const compactCandidate = useSeriesFallback
    ? compactProductCode(options.fallbackSeriesName ?? '')
    : compactProductCode(trimmedCandidate);

  if (compactCandidate.length === 0) {
    return toMatchResult(0);
  }

  const tokens = tokenizeSuggestionQuery(rawQuery);
  const matchedChars = countMatchedQueryChars(tokens, compactCandidate);
  let percentage = clampMatchPercentage(
    (matchedChars / compactCandidate.length) * 100
  );

  if (useSeriesFallback) {
    return toMatchResult(Math.min(percentage, SERIES_FALLBACK_MAX_PERCENTAGE));
  }

  if (compactQuery.length > 0 && compactQuery === compactCandidate) {
    return toMatchResult(100);
  }

  return toMatchResult(percentage);
}

function toMatchResult(percentage: number): MatchPercentageResult {
  const level = resolveMatchPercentageLevel(percentage);
  return {
    percentage,
    level,
    color: getMatchColorForLevel(level),
  };
}
