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

const START_SCORE = 100;

const PENALTY_DIFFERENT_NORMAL = 20;
const PENALTY_DIFFERENT_CRITICAL = 30;

const PENALTY_CHECK_NORMAL = 7;
const PENALTY_CHECK_CRITICAL = 12;

const PENALTY_WARNING = 5;

const CRITICAL_DIFFERENT_KEYWORDS = [
  // Pneumatic cylinder
  'ÇAP',
  'STROK',
  'MONTAJ',
  'SÖNÜMLEME',
  'PORT',
  'DİŞ',
  'SENSÖR',
  // Hydraulic valve
  'VOLTAJ',
  'BOBİN',
  'FONKSİYON',
  'SPOOL',
  'KONNEKTÖR',
  'BASINÇ',
  'DEBİ',
  'AKIŞ',
];

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

function isCriticalDifferent(label: string): boolean {
  const key = label.toUpperCase();
  return CRITICAL_DIFFERENT_KEYWORDS.some((kw) => key.includes(kw));
}

export function calculateRawMatchScore(result: CompatibilityResult): number {
  let score = START_SCORE;

  for (const diff of result.different) {
    score -= isCriticalDifferent(diff.label)
      ? PENALTY_DIFFERENT_CRITICAL
      : PENALTY_DIFFERENT_NORMAL;
  }

  for (const check of result.checkItems) {
    const isCritical = check.severity === 'high';
    score -= isCritical ? PENALTY_CHECK_CRITICAL : PENALTY_CHECK_NORMAL;
  }

  score -= result.warnings.length * PENALTY_WARNING;

  return score;
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
