import type { CompatibilityResult } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

import { buildCompatibilityResultsFromDiscoveries } from './buildCompatibilityResultsFromDiscoveries';
import {
  findEquivalentCandidates,
  logEquivalentCandidateDiscoveryDiagnostics,
} from './findEquivalentCandidates';
import { identifyProduct } from './identifyProduct';
import { normalizeCode } from './normalizeCode';
import {
  applyPartialSourceEquivalenceAdjustments,
  canSearchEquivalentsForIdentification,
  getEquivalenceWarningsForIdentification,
} from './partialSourceEquivalents';

export interface ProductSearchResult {
  identification: ProductIdentification;
  compatibilityResults: CompatibilityResult[];
  hasEquivalents: boolean;
  equivalenceWarnings: string[];
}

export function resolveProductSearch(inputCode: string): ProductSearchResult {
  const normalizedCode = normalizeCode(inputCode);
  const identification = identifyProduct(inputCode, normalizedCode);

  if (!canSearchEquivalentsForIdentification(identification)) {
    return {
      identification,
      compatibilityResults: [],
      hasEquivalents: false,
      equivalenceWarnings: [],
    };
  }

  const discoveries = findEquivalentCandidates(identification, inputCode);
  logEquivalentCandidateDiscoveryDiagnostics(inputCode);

  let compatibilityResults = buildCompatibilityResultsFromDiscoveries(
    identification,
    discoveries,
  );
  compatibilityResults = applyPartialSourceEquivalenceAdjustments(
    identification,
    compatibilityResults
  );

  return {
    identification,
    compatibilityResults,
    hasEquivalents: compatibilityResults.length > 0,
    equivalenceWarnings: getEquivalenceWarningsForIdentification(identification),
  };
}
