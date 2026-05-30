/**
 * Rexroth WE design/component series tokens.
 * Catalog shorthand 6X represents the 60-series family (60–69).
 */

export interface RexrothWEDesignSeriesParse {
  rawDesignSeries: string | null;
  componentSeriesFamily: string;
  formatDigit: string;
}

export function parseRexrothWEDesignSeriesToken(
  token: string,
  allowedFirstDigits: string
): RexrothWEDesignSeriesParse | null {
  const upper = token.trim().toUpperCase();
  if (!upper) {
    return null;
  }

  const xNotation = upper.match(/^([0-9])X$/);
  if (xNotation && allowedFirstDigits.includes(xNotation[1])) {
    return {
      rawDesignSeries: null,
      componentSeriesFamily: `${xNotation[1]}X`,
      formatDigit: xNotation[1],
    };
  }

  const numeric = upper.match(/^([0-9])([0-9])$/);
  if (numeric && allowedFirstDigits.includes(numeric[1])) {
    return {
      rawDesignSeries: upper,
      componentSeriesFamily: `${numeric[1]}X`,
      formatDigit: numeric[1],
    };
  }

  return null;
}

export function formatRexrothWEDesignSeriesDisplay(
  rawDesignSeries: string | null,
  componentSeriesFamily: string
): string {
  if (rawDesignSeries) {
    return `Tasarım serisi ${rawDesignSeries} / ${componentSeriesFamily} ailesi`;
  }
  return `${componentSeriesFamily} ailesi`;
}
