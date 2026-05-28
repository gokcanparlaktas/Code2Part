import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { findEquivalentCandidates } from './findEquivalentCandidates';

/**
 * Returns equivalent product candidates for comparison.
 * Delegates to profile-aware discovery (equivalence groups + catalog coarse filters).
 */
export function findEquivalents(source: ProductIdentification): EquivalentCandidate[] {
  const sourceCode = source.inputCode || source.normalizedCode;
  return findEquivalentCandidates(source, sourceCode).map((entry) => entry.candidate);
}
