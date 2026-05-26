import type { CatalogCodePattern, CatalogCodePatternKind } from '@/types/catalog';

export function compilePattern(pattern: CatalogCodePattern): RegExp {
  return new RegExp(pattern.pattern, pattern.kind === 'connector' ? 'g' : undefined);
}

export function matchPattern(
  normalized: string,
  pattern: CatalogCodePattern
): RegExpMatchArray | null {
  const regex = compilePattern(pattern);
  return normalized.match(regex);
}

export function getCapturedValue(
  match: RegExpMatchArray,
  pattern: CatalogCodePattern
): string | null {
  const group = pattern.captureGroup ?? pattern.boreGroup ?? pattern.strokeGroup;
  if (group === undefined) {
    return null;
  }
  const value = match[group];
  return value === undefined ? null : String(value);
}

export function extractBoreStrokeFromPatterns(
  normalized: string,
  patterns: CatalogCodePattern[]
): { boreMm?: number; strokeMm?: number } {
  for (const pattern of patterns) {
    if (pattern.kind !== 'bore_stroke' && pattern.boreGroup === undefined) {
      continue;
    }
    const match = matchPattern(normalized, pattern);
    if (!match || pattern.boreGroup === undefined || pattern.strokeGroup === undefined) {
      continue;
    }
    const boreMm = Number(match[pattern.boreGroup]);
    const strokeMm = Number(match[pattern.strokeGroup]);
    if (!Number.isNaN(boreMm) && !Number.isNaN(strokeMm)) {
      return { boreMm, strokeMm };
    }
  }
  return {};
}

export function extractLastCaptureFromPatterns(
  normalized: string,
  patterns: CatalogCodePattern[],
  kind: CatalogCodePatternKind
): string | null {
  let last: string | null = null;

  for (const pattern of patterns) {
    if (pattern.kind !== kind) {
      continue;
    }
    const regex = compilePattern(pattern);
    if (pattern.kind === 'connector') {
      const matches = [...normalized.matchAll(regex)];
      for (const match of matches) {
        const captured = getCapturedValue(match, pattern);
        if (captured) {
          last = captured;
        }
      }
      continue;
    }

    const match = normalized.match(regex);
    if (!match) {
      continue;
    }
    const captured = getCapturedValue(match, pattern);
    if (captured) {
      last = captured;
    }
  }

  return last;
}

export function extractFunctionTokenFromPatterns(
  normalized: string,
  patterns: CatalogCodePattern[]
): string | null {
  for (const pattern of patterns) {
    if (pattern.kind !== 'function_token') {
      continue;
    }
    const match = matchPattern(normalized, pattern);
    const captured = match ? getCapturedValue(match, pattern) : null;
    if (captured) {
      return captured;
    }
  }
  return null;
}

export function extractInferredVoltageFromPatterns(
  normalized: string,
  patterns: CatalogCodePattern[]
): { token: string; voltageValue: string } | null {
  for (const pattern of patterns) {
    if (pattern.kind !== 'inferred_voltage') {
      continue;
    }
    const match = matchPattern(normalized, pattern);
    const captured = match ? getCapturedValue(match, pattern) : null;
    if (!captured) {
      continue;
    }
    return {
      token: `D${captured}`,
      voltageValue: `${Number(captured)}V DC`,
    };
  }
  return null;
}
