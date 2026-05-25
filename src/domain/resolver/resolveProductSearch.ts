import { compareProducts } from './compareProducts';
import { findEquivalents } from './findEquivalents';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';
import type { CompatibilityResult } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

export interface ProductSearchResult {
  identification: ProductIdentification;
  compatibilityResults: CompatibilityResult[];
  hasEquivalents: boolean;
}

export function resolveProductSearch(inputCode: string): ProductSearchResult {
  const normalizedCode = normalizeCode(inputCode);
  const identification = identifyProduct(inputCode, normalizedCode);

  if (identification.outcome !== 'full') {
    return {
      identification,
      compatibilityResults: [],
      hasEquivalents: false,
    };
  }

  const equivalents = findEquivalents(identification);
  const compatibilityResults = equivalents.map((candidate) =>
    compareProducts(identification, candidate)
  );

  return {
    identification,
    compatibilityResults,
    hasEquivalents: compatibilityResults.length > 0,
  };
}
