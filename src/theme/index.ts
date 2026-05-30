export { colors } from './colors';
export { spacing } from './spacing';
export { radius } from './radius';
export { typography, textColors } from './typography';
export { shadows } from './shadows';
export { buttons } from './buttons';

import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import type { MatchPercentageLevel } from '@/domain/scoring/calculateMatchPercentage';
import { buttons } from './buttons';

const MATCH_LEVEL_COLORS: Record<MatchPercentageLevel, string> = {
  high: colors.match.high,
  medium: colors.match.medium,
  low: colors.match.low,
};

export function matchLevelColor(level: MatchPercentageLevel): string {
  return MATCH_LEVEL_COLORS[level];
}

export function matchLevelBg(level: MatchPercentageLevel): string {
  const map: Record<MatchPercentageLevel, string> = {
    high: colors.match.highBg,
    medium: colors.match.mediumBg,
    low: colors.match.lowBg,
  };
  return map[level];
}

/** @deprecated Use `buttons.primary` from `@/theme` instead. */
export const primaryButtonStyle = buttons.primary;
