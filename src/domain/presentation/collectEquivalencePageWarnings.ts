import type { CompatibilityResult } from '@/types/compatibility';

import { consolidateCatalogWarningsForUi } from './formatUserFacingCatalogDisplay';

/** Merges and dedupes warnings from all equivalence results for a single page footer. */
export function collectEquivalencePageWarnings(
  results: readonly CompatibilityResult[]
): string[] {
  const merged: string[] = [];
  for (const result of results) {
    merged.push(...result.warnings);
  }
  return consolidateCatalogWarningsForUi(merged);
}
