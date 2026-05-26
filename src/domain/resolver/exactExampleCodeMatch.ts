import { getAllCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { compactProductCode } from '@/domain/scoring/calculateSuggestionMatchPercentage';

import { normalizeCode } from './normalizeCode';

/**
 * Returns the catalog example string when the query matches a supported example code
 * exactly (normalized display form or compact alphanumeric form).
 */
export function findExactExampleCodeMatch(normalizedCode: string): string | null {
  if (!normalizedCode) {
    return null;
  }

  const compactQuery = compactProductCode(normalizedCode);

  for (const example of getAllCatalogExampleCodes()) {
    const normalizedExample = normalizeCode(example);
    if (normalizedExample === normalizedCode) {
      return example;
    }
    if (compactProductCode(example) === compactQuery) {
      return example;
    }
  }

  return null;
}
