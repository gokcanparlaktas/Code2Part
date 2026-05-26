/** Built-in voltage token matchers when catalog entry has no matchPattern. */
const DEFAULT_VOLTAGE_MATCH_PATTERNS: Record<string, RegExp> = {
  EG24: /\bEG24\b|EG24N/,
  CG24: /\bCG24\b|CG24N/,
  D24: /\bD24\b|-D24-/,
  '24DC': /24DC/,
  H7: /(?:^|[^A-Z0-9])H7(?:[^A-Z0-9]|$)/,
};

export function voltageCodeAppearsInProductCode(
  code: string,
  normalized: string,
  matchPattern?: string
): boolean {
  if (matchPattern) {
    return new RegExp(matchPattern).test(normalized);
  }

  const builtIn = DEFAULT_VOLTAGE_MATCH_PATTERNS[code];
  if (builtIn) {
    return builtIn.test(normalized);
  }

  return normalized.includes(code);
}
