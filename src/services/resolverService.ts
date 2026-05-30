import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { CompatibilityResult } from '@/types/compatibility';

import {
  compareProductsRemote,
  findEquivalentsRemote,
  identifyProductRemote,
  mapResolverApiErrorMessage,
  ResolverApiError,
} from './resolverApiClient';
import {
  enrichCompareResultCandidate,
  mapCompareProductsDtoToCompatibilityResult,
  mapFindEquivalentsDtoToCompatibilityResults,
  mapIdentifyProductDtoToResolved,
  type ResolvedIdentifyProduct,
  type ResolvedProductSearch,
} from './mapBackendResolverDtos';
import {
  getResolverMode,
  isBackendResolverMode,
  shouldFallbackToLocalResolverOnBackendError,
} from './resolverConfig';

function mapLocalIdentify(inputCode: string): ResolvedIdentifyProduct {
  const normalizedCode = normalizeCode(inputCode);
  const identification = identifyProduct(inputCode, normalizedCode);
  return {
    identification,
    productDetailRows: [],
    warnings: [],
    source: 'local',
  };
}

function mapLocalProductSearch(inputCode: string): ResolvedProductSearch {
  const resolved = resolveProductSearch(inputCode);
  return {
    identification: resolved.identification,
    productDetailRows: [],
    warnings: [],
    source: 'local',
    compatibilityResults: resolved.compatibilityResults,
    hasEquivalents: resolved.hasEquivalents,
  };
}

async function withOptionalLocalFallback<T>(
  operation: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      isBackendResolverMode() &&
      shouldFallbackToLocalResolverOnBackendError() &&
      !(error instanceof ResolverApiError && error.code === 'validation')
    ) {
      return fallback();
    }
    throw error;
  }
}

export async function identifyProductResolved(code: string): Promise<ResolvedIdentifyProduct> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new ResolverApiError('Ürün kodu boş olamaz.', 'validation');
  }

  if (getResolverMode() === 'local') {
    return mapLocalIdentify(trimmed);
  }

  return withOptionalLocalFallback(async () => {
    const dto = await identifyProductRemote(trimmed);
    return mapIdentifyProductDtoToResolved(dto, trimmed);
  }, () => mapLocalIdentify(trimmed));
}

export async function compareProductsResolved(
  sourceCode: string,
  candidateCode: string
): Promise<CompatibilityResult> {
  const source = sourceCode.trim();
  const candidate = candidateCode.trim();
  if (!source || !candidate) {
    throw new ResolverApiError('Karşılaştırma için iki ürün kodu gerekli.', 'validation');
  }

  if (getResolverMode() === 'local') {
    const local = resolveProductSearch(source);
    const match = local.compatibilityResults.find(
      (result) =>
        result.candidate.suggestedCode?.trim() === candidate ||
        result.candidate.targetIdentification?.normalizedCode === normalizeCode(candidate)
    );
    if (!match) {
      throw new ResolverApiError('Muadil aday bulunamadı.', 'unknown');
    }
    return match;
  }

  const dto = await compareProductsRemote(source, candidate);
  return mapCompareProductsDtoToCompatibilityResult(dto);
}

export async function findEquivalentsResolved(code: string): Promise<ResolvedProductSearch> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new ResolverApiError('Ürün kodu boş olamaz.', 'validation');
  }

  if (getResolverMode() === 'local') {
    return mapLocalProductSearch(trimmed);
  }

  return withOptionalLocalFallback(async () => {
    const identifyDto = await identifyProductRemote(trimmed);
    const resolvedIdentify = mapIdentifyProductDtoToResolved(identifyDto, trimmed);

    if (resolvedIdentify.identification.outcome !== 'full') {
      return {
        ...resolvedIdentify,
        compatibilityResults: [],
        hasEquivalents: false,
      };
    }

    const equivalentsDto = await findEquivalentsRemote(trimmed);
    const compatibilityResults = mapFindEquivalentsDtoToCompatibilityResults(equivalentsDto).map(
      (result, index) =>
        enrichCompareResultCandidate(result, equivalentsDto.candidates[index]!)
    );

    return {
      ...resolvedIdentify,
      compatibilityResults,
      hasEquivalents: compatibilityResults.length > 0,
    };
  }, () => mapLocalProductSearch(trimmed));
}

export async function resolveProductSearchResolved(code: string): Promise<ResolvedProductSearch> {
  return findEquivalentsResolved(code);
}

export { mapResolverApiErrorMessage, isBackendResolverMode, getResolverMode };
