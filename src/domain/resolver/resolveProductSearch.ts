import type { CompatibilityResult } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { buildCompatibilityResultsFromDiscoveries } from './buildCompatibilityResultsFromDiscoveries';
import {
  findEquivalentCandidates,
  logEquivalentCandidateDiscoveryDiagnostics,
} from './findEquivalentCandidates';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';

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

  const discoveries = findEquivalentCandidates(identification, inputCode);
  logEquivalentCandidateDiscoveryDiagnostics(inputCode);

  const compatibilityResults = buildCompatibilityResultsFromDiscoveries(
    identification,
    discoveries,
  );

  return {
    identification,
    compatibilityResults,
    hasEquivalents: compatibilityResults.length > 0,
  };
}
