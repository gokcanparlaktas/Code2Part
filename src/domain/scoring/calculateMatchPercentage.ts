import type { CompatibilityResult } from '@/types/compatibility';

export type MatchPercentageLevel = 'low' | 'medium' | 'high';

export interface MatchPercentageResult {
  percentage: number;
  level: MatchPercentageLevel;
  color: string;
}

const LEVEL_COLORS: Record<MatchPercentageLevel, string> = {
  low: '#DC2626',
  medium: '#F59E0B',
  high: '#16A34A',
};

const LEVEL_LABELS: Record<MatchPercentageLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

const SCORE_PER_COMPATIBLE = 25;
const SCORE_PER_CHECK = 10;
const SCORE_PER_WARNING = 5;
const SCORE_PER_DIFFERENT = 30;

export function clampMatchPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveMatchPercentageLevel(percentage: number): MatchPercentageLevel {
  if (percentage >= 80) {
    return 'high';
  }
  if (percentage >= 50) {
    return 'medium';
  }
  return 'low';
}

export function getMatchPercentageLabel(level: MatchPercentageLevel): string {
  return LEVEL_LABELS[level];
}

export function getMatchColorForLevel(level: MatchPercentageLevel): string {
  return LEVEL_COLORS[level];
}

export function calculateRawMatchScore(result: CompatibilityResult): number {
  const compatibleScore = result.compatible.length * SCORE_PER_COMPATIBLE;
  const checkScore = result.checkItems.length * SCORE_PER_CHECK;
  const warningPenalty = result.warnings.length * SCORE_PER_WARNING;
  const differentPenalty = result.different.length * SCORE_PER_DIFFERENT;

  return compatibleScore + checkScore - warningPenalty - differentPenalty;
}

export function calculateMatchPercentage(
  result: CompatibilityResult
): MatchPercentageResult {
  const percentage = clampMatchPercentage(calculateRawMatchScore(result));
  const level = resolveMatchPercentageLevel(percentage);

  return {
    percentage,
    level,
    color: LEVEL_COLORS[level],
  };
}
