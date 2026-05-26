import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';

export function sortCompatibilityResultsByMatchPercentage(
  results: CompatibilityResult[]
): CompatibilityResult[] {
  return [...results].sort((a, b) => {
    const scoreA = calculateMatchPercentage(a).percentage;
    const scoreB = calculateMatchPercentage(b).percentage;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const labelA = `${a.candidate.brand} ${a.candidate.series}`;
    const labelB = `${b.candidate.brand} ${b.candidate.series}`;
    return labelA.localeCompare(labelB, 'tr');
  });
}
