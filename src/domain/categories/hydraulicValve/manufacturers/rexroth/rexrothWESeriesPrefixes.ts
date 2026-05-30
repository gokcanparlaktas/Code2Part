export const REXROTH_WE_SERIES_PREFIXES = ['3WE4', '3WE6', '4WE6', '4WE10'] as const;

export type RexrothWESeriesPrefix = (typeof REXROTH_WE_SERIES_PREFIXES)[number];

export type RexrothWESourceFamily = 'WE4' | 'WE6' | 'WE10';

export type RexrothWENominalSize = '4' | '6' | '10';

export const REXROTH_WE_CODE_PREFIX_PATTERN = '(?:3WE4|3WE6|4WE6|4WE10)';

export const REXROTH_WE_CODE_PREFIX_CAPTURE_PATTERN = '(3WE4|3WE6|4WE6|4WE10)';

export function isRexrothWECode(normalized: string): boolean {
  return new RegExp(`^${REXROTH_WE_CODE_PREFIX_PATTERN}`).test(normalized);
}

export function rexrothWESourceFamilyFromPrefix(
  seriesPrefix: RexrothWESeriesPrefix
): RexrothWESourceFamily {
  if (seriesPrefix === '4WE10') {
    return 'WE10';
  }
  if (seriesPrefix === '3WE4') {
    return 'WE4';
  }
  return 'WE6';
}

export function rexrothWENominalSizeFromPrefix(
  seriesPrefix: RexrothWESeriesPrefix
): RexrothWENominalSize {
  if (seriesPrefix === '4WE10') {
    return '10';
  }
  if (seriesPrefix === '3WE4') {
    return '4';
  }
  return '6';
}

export function rexrothWEAllowedDesignFirstDigits(seriesPrefix: RexrothWESeriesPrefix): string {
  if (seriesPrefix === '4WE10') {
    return '35';
  }
  if (seriesPrefix === '3WE4') {
    return '45';
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
