import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import type { CompareProductsResponseDto } from '@/backend/dto/mapCompareProductsResponse';
import type { FindEquivalentsResponseDto } from '@/backend/dto/mapFindEquivalentsResponse';
import type { IdentifyProductResponseDto } from '@/backend/dto/mapIdentifyProductResponse';
import { getCachedFirestoreCatalogProvider } from '@/backend/catalog/cachedFirestoreCatalogProvider';
import { compareProductsService } from '@/backend/services/compareProductsService';
import { findEquivalentsService } from '@/backend/services/findEquivalentsService';
import { identifyProductService } from '@/backend/services/identifyProductService';

import {
  resolverErrorResponse,
  sendResolverJsonResponse,
  type ResolverHttpResponse,
} from './sendResolverJsonResponse';
import {
  ResolverRequestValidationError,
  validateCompareRequestBody,
  validateEquivalentsRequestBody,
  validateIdentifyRequestBody,
} from './validateResolverRequest';

export type ResolverHttpEndpoint = 'identify' | 'compare' | 'equivalents';

export interface ResolverHttpDeps {
  getCatalogProvider: () => Promise<CatalogDataProvider>;
  identifyProductService: typeof identifyProductService;
  compareProductsService: typeof compareProductsService;
  findEquivalentsService: typeof findEquivalentsService;
}

export const defaultResolverHttpDeps: ResolverHttpDeps = {
  getCatalogProvider: getCachedFirestoreCatalogProvider,
  identifyProductService,
  compareProductsService,
  findEquivalentsService,
};

function dtoToRecord(dto: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
}

function validationErrorResponse(error: ResolverRequestValidationError): ResolverHttpResponse {
  return resolverErrorResponse(400, error.message, 'validation_error');
}

function internalErrorResponse(): ResolverHttpResponse {
  return resolverErrorResponse(500, 'Internal resolver error', 'internal_error');
}

export async function handleIdentifyHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateIdentifyRequestBody(body);
    const catalogProvider = await deps.getCatalogProvider();
    const result: IdentifyProductResponseDto = await deps.identifyProductService({
      code: input.code,
      catalogProvider,
    });
    return sendResolverJsonResponse(200, dtoToRecord(result as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }
    return internalErrorResponse();
  }
}

export async function handleCompareHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateCompareRequestBody(body);
    const catalogProvider = await deps.getCatalogProvider();
    const result: CompareProductsResponseDto = await deps.compareProductsService({
      sourceCode: input.sourceCode,
      candidateCode: input.candidateCode,
      catalogProvider,
    });
    return sendResolverJsonResponse(200, dtoToRecord(result as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }
    return internalErrorResponse();
  }
}

export async function handleEquivalentsHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateEquivalentsRequestBody(body);
    const catalogProvider = await deps.getCatalogProvider();
    const result: FindEquivalentsResponseDto = await deps.findEquivalentsService({
      code: input.code,
      catalogProvider,
    });
    return sendResolverJsonResponse(200, dtoToRecord(result as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }
    return internalErrorResponse();
  }
}

export async function dispatchResolverHttpRequest(
  endpoint: ResolverHttpEndpoint,
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  switch (endpoint) {
    case 'identify':
      return handleIdentifyHttpRequest(body, deps);
    case 'compare':
      return handleCompareHttpRequest(body, deps);
    case 'equivalents':
      return handleEquivalentsHttpRequest(body, deps);
    default:
      return resolverErrorResponse(404, 'Unknown endpoint', 'not_found');
  }
}
