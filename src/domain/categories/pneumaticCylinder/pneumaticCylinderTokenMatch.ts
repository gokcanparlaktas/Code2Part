import type { ProductSeriesRecord } from '@/types/product';

export interface TokenizedQuery {
  tokens: string[];
  compact: string;
}

export interface TokenMatchContext {
  isSingleTokenQuery: boolean;
  isMultiTokenQuery: boolean;
}

export interface TokenMatchScore {
  score: number;
  matchedTokenCount: number;
  totalTokens: number;
  exactTokenMatches: number;
  seriesTokenMatched: boolean;
  boreMm?: number;
  strokeMm?: number;
}

export function tokenizeForMatching(raw: string): string[] {
  return raw
    .trim()
    .toUpperCase()
    .split(/[\s\-_/]+/)
    .map((token) => token.replace(/[^A-Z0-9]/g, ''))
    .filter((token) => token.length > 0);
}

export function toCompactAlphanumeric(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function buildTokenizedQuery(rawInput: string): TokenizedQuery {
  const tokens = tokenizeForMatching(rawInput);
  return {
    tokens,
    compact: tokens.join(''),
  };
}

export function buildTokenMatchContext(query: TokenizedQuery): TokenMatchContext {
  return {
    isSingleTokenQuery: query.tokens.length === 1,
    isMultiTokenQuery: query.tokens.length >= 2,
  };
}

export function isEligibleTokenQuery(tokens: string[]): boolean {
  if (tokens.length === 0) {
    return false;
  }

  if (tokens.length >= 2) {
    return true;
  }

  const token = tokens[0];
  if (/^\d+$/.test(token)) {
    return false;
  }

  return token.length >= 3;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractBoreStrokeFromTokens(tokens: string[]): {
  boreMm?: number;
  strokeMm?: number;
} {
  const numericTokens = tokens
    .filter((token) => /^\d+$/.test(token))
    .map((token) => Number(token))
    .filter((value) => !Number.isNaN(value));

  if (numericTokens.length >= 2) {
    return { boreMm: numericTokens[0], strokeMm: numericTokens[1] };
  }

  if (numericTokens.length === 1) {
    return { boreMm: numericTokens[0] };
  }

  return {};
}

function numericTokenMatchesCode(
  token: string,
  codeTokens: string[],
  codeCompact: string
): { exact: boolean; matched: boolean; score: number } {
  if (codeTokens.includes(token)) {
    return { exact: true, matched: true, score: 18 };
  }

  const boundaryPattern = new RegExp(`(^|[^0-9])${escapeRegex(token)}([^0-9]|$)`);
  if (boundaryPattern.test(codeCompact)) {
    return { exact: false, matched: true, score: 12 };
  }

  // Partial numeric segment while typing (e.g. "0" → "03" in DSHG-03).
  if (
    codeTokens.some(
      (segment) =>
        /^\d+$/.test(segment) &&
        segment.startsWith(token) &&
        segment.length > token.length
    )
  ) {
    return { exact: false, matched: true, score: 9 };
  }

  return { exact: false, matched: false, score: 0 };
}

function allowsCompactAlphaMatch(token: string, context: TokenMatchContext): boolean {
  if (context.isSingleTokenQuery && token.length >= 3) {
    return true;
  }
  if (context.isMultiTokenQuery && token.length >= 4) {
    return true;
  }
  return false;
}

export function queryTokenMatchesCode(
  token: string,
  codeTokens: string[],
  codeCompact: string,
  context: TokenMatchContext
): { exact: boolean; matched: boolean; score: number } {
  if (/^\d+$/.test(token)) {
    return numericTokenMatchesCode(token, codeTokens, codeCompact);
  }

  if (codeTokens.includes(token)) {
    return { exact: true, matched: true, score: 20 };
  }

  if (codeTokens.some((segment) => segment.includes(token))) {
    return { exact: false, matched: true, score: 14 };
  }

  if (allowsCompactAlphaMatch(token, context) && codeCompact.includes(token)) {
    return { exact: false, matched: true, score: 10 };
  }

  return { exact: false, matched: false, score: 0 };
}

export function allQueryTokensMatchCode(
  query: TokenizedQuery,
  codeTokens: string[],
  codeCompact: string,
  context: TokenMatchContext
): boolean {
  if (query.tokens.length === 0) {
    return false;
  }

  return query.tokens.every((token) =>
    queryTokenMatchesCode(token, codeTokens, codeCompact, context).matched
  );
}

export function scoreProductCodeAgainstTokens(
  exampleCode: string,
  query: TokenizedQuery,
  seriesPrefixes: string[]
): TokenMatchScore | null {
  const codeNormalized = exampleCode.toUpperCase();
  const codeTokens = tokenizeForMatching(codeNormalized);
  const codeCompact = toCompactAlphanumeric(codeNormalized);
  const context = buildTokenMatchContext(query);

  if (!allQueryTokensMatchCode(query, codeTokens, codeCompact, context)) {
    return null;
  }

  let totalScore = 0;
  let exactTokenMatches = 0;
  let seriesTokenMatched = false;

  for (const token of query.tokens) {
    const result = queryTokenMatchesCode(token, codeTokens, codeCompact, context);
    totalScore += result.score;
    if (result.exact) {
      exactTokenMatches += 1;
    }
    if (
      seriesPrefixes.some(
        (prefix) => prefix === token || token.startsWith(prefix) || prefix.startsWith(token)
      )
    ) {
      seriesTokenMatched = true;
      totalScore += 12;
    }
  }

  totalScore += 40;
  totalScore += exactTokenMatches * 5;

  if (codeCompact === query.compact || codeNormalized === query.tokens.join('-')) {
    totalScore += 25;
  }

  const dims = extractBoreStrokeFromTokens(query.tokens);
  if (dims.boreMm !== undefined && dims.strokeMm !== undefined) {
    const boreMatched =
      codeTokens.includes(String(dims.boreMm)) ||
      new RegExp(`(^|[^0-9])${dims.boreMm}([^0-9]|$)`).test(codeCompact);
    const strokeMatched =
      codeTokens.includes(String(dims.strokeMm)) ||
      new RegExp(`(^|[^0-9])${dims.strokeMm}([^0-9]|$)`).test(codeCompact);
    if (boreMatched && strokeMatched) {
      totalScore += 20;
    }
  }

  return {
    score: totalScore,
    matchedTokenCount: query.tokens.length,
    totalTokens: query.tokens.length,
    exactTokenMatches,
    seriesTokenMatched,
    ...(dims.boreMm !== undefined ? { boreMm: dims.boreMm } : {}),
    ...(dims.strokeMm !== undefined ? { strokeMm: dims.strokeMm } : {}),
  };
}

export function collectSeriesPrefixes(productSeries: ProductSeriesRecord[]): string[] {
  const prefixes = new Set<string>();
  for (const series of productSeries) {
    prefixes.add(series.codePrefix.toUpperCase());
    for (const prefix of series.matchPrefixes ?? []) {
      prefixes.add(prefix.toUpperCase());
    }
    prefixes.add(series.series.toUpperCase());
  }
  return [...prefixes].sort((a, b) => b.length - a.length);
}
