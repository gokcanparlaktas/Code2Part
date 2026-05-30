import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { compareHydraulicValves } from '@/domain/categories/hydraulicValve/hydraulicValveComparison';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import { mapCompareProductsResponse, type CompareProductsResponseDto } from '@/backend/dto/mapCompareProductsResponse';
import { buildCandidateFromCode } from '@/backend/services/buildCandidateFromCode';
import { ensureCatalogProviderInitialized } from '@/backend/services/ensureCatalogProviderInitialized';

export interface CompareProductsServiceOptions {
  sourceCode: string;
  candidateCode: string;
  catalogProvider?: CatalogDataProvider;
}

export async function compareProductsService(
  options: CompareProductsServiceOptions
): Promise<CompareProductsResponseDto> {
  const catalogProvider = await ensureCatalogProviderInitialized(options.catalogProvider);

  const sourceNormalized = normalizeCode(options.sourceCode);
  const source = identifyProduct(options.sourceCode, sourceNormalized);
  const candidate = buildCandidateFromCode(options.candidateCode);

  const result = compareHydraulicValves(source, candidate, { catalogProvider });

  return mapCompareProductsResponse({
    sourceCode: options.sourceCode,
    candidateCode: options.candidateCode,
    result,
  });
}
