export const REXROTH_WE_SERIES_PREFIXES = ['3WE6', '4WE6', '4WE10'] as const;

/** Eski/yanlış kod; desteklenmiyor (3WE6 ile karıştırılmamalı). */
export const UNSUPPORTED_REXROTH_WE_SERIES_PREFIXES = ['3WE4'] as const;

export type RexrothWESeriesPrefix = (typeof REXROTH_WE_SERIES_PREFIXES)[number];

export type RexrothWESourceFamily = 'WE6' | 'WE10';

export type RexrothWENominalSize = '6' | '10';

export const REXROTH_WE_CODE_PREFIX_PATTERN = '(?:3WE6|4WE6|4WE10)';

export const REXROTH_WE_CODE_PREFIX_CAPTURE_PATTERN = '(3WE6|4WE6|4WE10)';

export function isUnsupportedRexrothWECode(normalized: string): boolean {
  return UNSUPPORTED_REXROTH_WE_SERIES_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

export function isRexrothWECode(normalized: string): boolean {
  if (isUnsupportedRexrothWECode(normalized)) {
    return false;
  }
  return new RegExp(`^${REXROTH_WE_CODE_PREFIX_PATTERN}`).test(normalized);
}

export function rexrothWESourceFamilyFromPrefix(
  seriesPrefix: RexrothWESeriesPrefix
): RexrothWESourceFamily {
  if (seriesPrefix === '4WE10') {
    return 'WE10';
  }
  return 'WE6';
}

export function rexrothWENominalSizeFromPrefix(
  seriesPrefix: RexrothWESeriesPrefix
): RexrothWENominalSize {
  if (seriesPrefix === '4WE10') {
    return '10';
  }
  return '6';
}

export function rexrothWEAllowedDesignFirstDigits(seriesPrefix: RexrothWESeriesPrefix): string {
  if (seriesPrefix === '4WE10') {
    return '35';
  }
  return '67';
}

export function rexrothWEComponentSeriesDigits(seriesPrefix: RexrothWESeriesPrefix): string {
  return rexrothWEAllowedDesignFirstDigits(seriesPrefix);
}

export function rexrothWEHeaderPrefixRegex(): RegExp {
  return new RegExp(`^${REXROTH_WE_CODE_PREFIX_PATTERN}`, 'i');
}

export function rexrothWEPartialHeaderRegex(): RegExp {
  return new RegExp(`^${REXROTH_WE_CODE_PREFIX_CAPTURE_PATTERN}(.*)$`, 'i');
}
