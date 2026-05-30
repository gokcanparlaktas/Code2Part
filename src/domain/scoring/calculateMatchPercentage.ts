import type {
  AttributeImportance,
  CompatibilityResult,
  ScoredAttributeComparison,
} from '@/types/compatibility';

export type MatchPercentageLevel = 'low' | 'medium' | 'high';

export interface MatchPercentageResult {
  percentage: number;
  level: MatchPercentageLevel;
  color: string;
}

const LEVEL_COLORS: Record<MatchPercentageLevel, string> = {
  low: '#C2410C',
  medium: '#CA8A04',
  high: '#059669',
};

const LEVEL_LABELS: Record<MatchPercentageLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

const COMPATIBLE_POINTS: Record<AttributeImportance, number> = {
  critical: 30,
  important: 20,
  optional: 8,
};

const DIFFERENT_PENALTY: Record<AttributeImportance, number> = {
  critical: 35,
  important: 25,
  optional: 10,
};

const UNKNOWN_PENALTY: Record<AttributeImportance, number> = {
  critical: 15,
  important: 10,
  optional: 5,
};

const WARNING_PENALTY = 5;

const GENERIC_PROFILE_WARNING =
  'Bazı alanlar kesin değil: Sipariş öncesinde katalog kontrolü gerekir.';

const CRITICAL_LABEL_KEYWORDS = [
  'KATEGOR',
  'ÇAP',
  'BORE',
  'STROK',
  'STANDART',
  'ISO',
  'CETOP',
  'NG',
  'KONUM',
  'MERKEZ',
  'VOLTAJ',
  'BOBİN',
  'YOL',
  'MONTAJ STANDARD',
  'MONTAJ STANDART',
];

const IMPORTANT_LABEL_KEYWORDS = [
  'SÖNÜM',
  'MANYETİK',
  'MONTAJ',
  'PORT',
  'DİŞ',
  'KONNEKTÖR',
  'MANUEL',
  'BASINÇ',
  'DEBİ',
  'FONKSİYON',
  'SURG',
  'SÜRGÜ',
];

export function clampMatchPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolveMatchPercentageLevel(percentage: number): MatchPercentageLevel {
  if (percentage >= 70) {
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

function inferImportanceFromLabel(label: string): AttributeImportance {
  const key = label.toUpperCase();
  if (CRITICAL_LABEL_KEYWORDS.some((keyword) => key.includes(keyword))) {
    return 'critical';
  }
  if (IMPORTANT_LABEL_KEYWORDS.some((keyword) => key.includes(keyword))) {
    return 'important';
  }
  return 'optional';
}

function severityToImportance(severity: 'low' | 'medium' | 'high'): AttributeImportance {
  if (severity === 'high') {
    return 'critical';
  }
  if (severity === 'medium') {
    return 'important';
  }
  return 'optional';
}

function countScoringWarnings(warnings: string[] | undefined): number {
  return (warnings ?? []).filter((warning) => warning !== GENERIC_PROFILE_WARNING).length;
}

function buildFallbackScoredComparisons(result: CompatibilityResult): ScoredAttributeComparison[] {
  const byLabel = new Map<string, ScoredAttributeComparison>();

  for (const comparison of [...(result.compatible ?? []), ...(result.different ?? [])]) {
    byLabel.set(comparison.label, {
      ...comparison,
      importance: inferImportanceFromLabel(comparison.label),
    });
  }

  for (const check of result.checkItems ?? []) {
    if (byLabel.has(check.field)) {
      continue;
    }
    byLabel.set(check.field, {
      label: check.field,
      sourceDisplay: check.sourceValue,
      targetDisplay: check.targetValue,
      status: 'unknownOrCheck',
      importance: severityToImportance(check.severity),
    });
  }

  return [...byLabel.values()];
}

function scoreFromScoredComparisons(
  scoredComparisons: ScoredAttributeComparison[],
  warningCount: number
): number {
  if (scoredComparisons.length === 0) {
    return warningCount === 0 ? 100 : 0;
  }

  let positivePoints = 0;
  let penaltyPoints = 0;
  let hasCompatible = false;
  let hasCriticalDifferent = false;

  for (const comparison of scoredComparisons) {
    const importance = comparison.importance;

    if (comparison.status === 'compatible') {
      positivePoints += COMPATIBLE_POINTS[importance];
      hasCompatible = true;
      continue;
    }

    if (comparison.status === 'different') {
      penaltyPoints += DIFFERENT_PENALTY[importance];
      if (importance === 'critical') {
        hasCriticalDifferent = true;
      }
      continue;
    }

    penaltyPoints += UNKNOWN_PENALTY[importance];
  }

  penaltyPoints += warningCount * WARNING_PENALTY;

  if (positivePoints === 0) {
    return 0;
  }

  let percentage = (positivePoints / (positivePoints + penaltyPoints)) * 100;

  if (hasCompatible && !hasCriticalDifferent && percentage <= 0) {
    percentage = 5;
  }

  const hasDifferent = scoredComparisons.some((comparison) => comparison.status === 'different');
  const hasUnknown = scoredComparisons.some(
    (comparison) => comparison.status === 'unknownOrCheck'
  );
  const allCriticalCompatible = scoredComparisons
    .filter((comparison) => comparison.importance === 'critical')
    .every((comparison) => comparison.status === 'compatible');

  if (
    !hasDifferent &&
    !hasUnknown &&
    warningCount === 0 &&
    allCriticalCompatible &&
    scoredComparisons.some((comparison) => comparison.importance === 'critical')
  ) {
    return 100;
  }

  if (hasCriticalDifferent) {
    percentage = Math.min(percentage, 49);
  }

  if (hasDifferent || hasUnknown || warningCount > 0) {
    percentage = Math.min(percentage, 99);
  }

  return clampMatchPercentage(percentage);
}

export function calculateRawMatchScore(result: CompatibilityResult): number {
  const warningCount = countScoringWarnings(result.warnings);
  const scoredComparisons =
    result.profileScoring?.scoredComparisons ?? buildFallbackScoredComparisons(result);

  return scoreFromScoredComparisons(scoredComparisons, warningCount);
}

export function calculateMatchPercentage(
  result: CompatibilityResult
): MatchPercentageResult {
  if (typeof result.serverMatchPercentage === 'number') {
    const percentage = clampMatchPercentage(result.serverMatchPercentage);
    const level = resolveMatchPercentageLevel(percentage);
    return {
      percentage,
      level,
      color: LEVEL_COLORS[level],
    };
  }

  const percentage = calculateRawMatchScore(result);
  const level = resolveMatchPercentageLevel(percentage);

  return {
    percentage,
    level,
    color: LEVEL_COLORS[level],
  };
}
