import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import type { CompatibilityResult } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { compareProducts } from './compareProducts';
import type {
  DiscoveredEquivalentCandidate,
  EquivalentCandidateReason,
} from './findEquivalentCandidates';

/** Profile-discovered candidates below this score are hidden (equivalence-group entries always shown). */
export const MIN_PROFILE_DISCOVERED_MATCH_PERCENT = 15;

const REASON_SORT_BOOST: Partial<Record<EquivalentCandidateReason, number>> = {
  equivalence_group: 0.5,
  same_mounting_standard: 0.25,
  same_standard_family: 0.15,
};

function discoverySortScore(
  result: CompatibilityResult,
  reason: EquivalentCandidateReason,
): number {
  const matchPercent = calculateMatchPercentage(result).percentage;
  return matchPercent + (REASON_SORT_BOOST[reason] ?? 0);
}

export function buildCompatibilityResultsFromDiscoveries(
  source: ProductIdentification,
  discoveries: DiscoveredEquivalentCandidate[],
): CompatibilityResult[] {
  const compared = discoveries
    .map((discovery) => ({
      discovery,
      result: compareProducts(source, discovery.candidate),
    }))
    .filter(({ discovery, result }) => {
      if (discovery.reason === 'equivalence_group') {
        return true;
      }
      if (!result.candidate.targetIdentification) {
        return false;
      }
      return (
        calculateMatchPercentage(result).percentage >= MIN_PROFILE_DISCOVERED_MATCH_PERCENT
      );
    });

  compared.sort((a, b) => {
    const scoreA = discoverySortScore(a.result, a.discovery.reason);
    const scoreB = discoverySortScore(b.result, b.discovery.reason);
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const labelA = `${a.result.candidate.brand} ${a.result.candidate.series}`;
    const labelB = `${b.result.candidate.brand} ${b.result.candidate.series}`;
    return labelA.localeCompare(labelB, 'tr');
  });

  return compared.map((entry) => entry.result);
}
