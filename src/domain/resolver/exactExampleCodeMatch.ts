import exampleProductCodesData from '@/data/exampleProductCodes.json';
import hydraulicValveExampleCodesData from '@/data/hydraulicValveExampleCodes.json';
import { compactProductCode } from '@/domain/scoring/calculateSuggestionMatchPercentage';

import { getAllProductSeries } from './productSeriesCatalog';
import { normalizeCode } from './normalizeCode';

let cachedExampleCodes: string[] | null = null;

function collectCatalogExampleCodes(): string[] {
  if (cachedExampleCodes) {
    return cachedExampleCodes;
  }

  const fromSeries = getAllProductSeries().flatMap((series) => series.exampleProductCodes ?? []);
  cachedExampleCodes = [
    ...new Set([
      ...(exampleProductCodesData as string[]),
      ...(hydraulicValveExampleCodesData as string[]),
      ...fromSeries,
    ]),
  ];
  return cachedExampleCodes;
}

/**
 * Returns the catalog example string when the query matches a supported example code
 * exactly (normalized display form or compact alphanumeric form).
 */
export function findExactExampleCodeMatch(normalizedCode: string): string | null {
  if (!normalizedCode) {
    return null;
  }

  const compactQuery = compactProductCode(normalizedCode);

  for (const example of collectCatalogExampleCodes()) {
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
