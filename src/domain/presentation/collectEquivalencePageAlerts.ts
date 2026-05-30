import type { CompatibilityResult } from '@/types/compatibility';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

import { buildLegacyMatchScoreFootnote } from './formatCompatibilityMetadata';

export function collectEquivalencePageLegacyScoreFootnote(
  results: readonly CompatibilityResult[],
): string | null {
  for (const result of results) {
    const match = calculateMatchPercentage(result);
    const footnote = buildLegacyMatchScoreFootnote(result.metadata, match.level);
    if (footnote) {
      return footnote;
    }
  }
  return null;
}
