import { KNOWN_ROLLING_BEARING_SUFFIX_TOKENS } from './resolveRollingBearingSuffixes';

export interface SplitBearingDesignationResult {
  baseCode: string | null;
  suffixBlock: string | null;
  suffixTokens: string[];
}

function peelSuffixTokensFromEnd(designation: string): { baseCode: string; suffixTokens: string[] } {
  let remaining = designation.toUpperCase();
  const suffixTokens: string[] = [];

  while (remaining.length > 0) {
    const matched = KNOWN_ROLLING_BEARING_SUFFIX_TOKENS.filter((token) =>
      remaining.endsWith(token)
    ).sort((a, b) => b.length - a.length)[0];

    if (!matched) {
      break;
    }

    suffixTokens.unshift(matched);
    remaining = remaining.slice(0, remaining.length - matched.length);
  }

  return { baseCode: remaining, suffixTokens };
}

/**
 * Splits a metric bearing designation into base code (4–5 digits) and suffix block.
 * Supports separated forms (6005-2RS, 6005/C3) and compact forms (60052RS, 6308ZZ).
 */
export function splitBearingDesignation(remainder: string): SplitBearingDesignationResult {
  const compact = remainder.replace(/\s+/g, '').toUpperCase();
  if (!compact) {
    return { baseCode: null, suffixBlock: null, suffixTokens: [] };
  }

  if (/[-/]/.test(compact)) {
    const separated = compact.match(/^(\d{4,5})([-/].+)?$/);
    if (separated) {
      const suffixBlock = separated[2] ? separated[2].replace(/^[-/]+/, '') : null;
      return {
        baseCode: separated[1],
        suffixBlock,
        suffixTokens: [],
      };
    }
  }

  const peeled = peelSuffixTokensFromEnd(compact);
  if (/^\d{4,5}$/.test(peeled.baseCode)) {
    const suffixBlock = peeled.suffixTokens.length > 0 ? peeled.suffixTokens.join('') : null;
    return {
      baseCode: peeled.baseCode,
      suffixBlock,
      suffixTokens: peeled.suffixTokens,
    };
  }

  const fallback = compact.match(/^(\d{4,5})(.*)$/);
  if (!fallback) {
    return { baseCode: null, suffixBlock: null, suffixTokens: [] };
  }

  const suffixBlock = fallback[2].replace(/^[-/]+/, '') || null;
  return {
    baseCode: fallback[1],
    suffixBlock,
    suffixTokens: [],
  };
}
