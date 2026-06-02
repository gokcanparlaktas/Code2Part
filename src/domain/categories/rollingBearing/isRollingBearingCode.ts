const EXPLICIT_BRAND_PREFIX =
  /^(SKF|FAG|SCHAEFFLER|INA|TIMKEN|NSK|NTN|KOYO|JTEKT)(?=[\s\-/]?\d)/i;

/** Metric rolling-bearing designation starter patterns (after optional brand strip). */
const METRIC_BASE_PATTERN =
  /^(?:6\d{3}|22\d{3}|23\d{3}|24\d{3}|21\d{3}|30\d{3}|31\d{3}|32\d{3}|33\d{3}|29\d{3}|13\d{3})/;

export function stripLeadingBrandToken(normalizedCode: string): string {
  const match = normalizedCode.match(EXPLICIT_BRAND_PREFIX);
  if (!match) {
    return normalizedCode;
  }
  return normalizedCode.slice(match[0].length).replace(/^[\s\-/]+/, '');
}

export function isRollingBearingCode(normalizedCode: string): boolean {
  if (!normalizedCode) {
    return false;
  }
  const remainder = stripLeadingBrandToken(normalizedCode);
  return METRIC_BASE_PATTERN.test(remainder);
}
