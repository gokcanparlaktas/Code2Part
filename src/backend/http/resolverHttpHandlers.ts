import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { getCachedFirestoreCatalogProvider } from '@/backend/catalog/cachedFirestoreCatalogProvider';
import { compareProductsService } from '@/backend/services/compareProductsService';
import { findEquivalentsService } from '@/backend/services/findEquivalentsService';
import { identifyProductService } from '@/backend/services/identifyProductService';

import {
  logResolverInternalError,
  type ResolverInternalErrorContext,
} from './logResolverInternalError';
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
  getCatalogProvider: () =>
    getCachedFirestoreCatalogProvider({
      projectId: process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID,
    }),
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

function readProviderContext(catalogProvider: CatalogDataProvider): ResolverInternalErrorContext {
  const catalogVersion =
    'catalogVersion' in catalogProvider &&
    typeof catalogProvider.catalogVersion === 'string'
      ? catalogProvider.catalogVersion
      : null;

  return {
    providerSource: catalogProvider.constructor.name,
    catalogVersion,
  };
}

async function runResolverHttpRequest<T extends Record<string, unknown>>(
  endpoint: ResolverHttpEndpoint,
  body: unknown,
  deps: ResolverHttpDeps,
  execute: (catalogProvider: CatalogDataProvider) => Promise<T>
): Promise<ResolverHttpResponse> {
  let providerContext: ResolverInternalErrorContext = { providerSource: 'unknown' };

  try {
    const catalogProvider = await deps.getCatalogProvider();
    providerContext = readProviderContext(catalogProvider);
    const result = await execute(catalogProvider);
    return sendResolverJsonResponse(200, dtoToRecord(result));
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }

    logResolverInternalError(endpoint, error, providerContext);
    return internalErrorResponse();
  }
}

export async function handleIdentifyHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateIdentifyRequestBody(body);
    return runResolverHttpRequest('identify', body, deps, async (catalogProvider) =>
      deps.identifyProductService({
        code: input.code,
        catalogProvider,
      })
    );
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }

    logResolverInternalError('identify', error);
    return internalErrorResponse();
  }
}

export async function handleCompareHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateCompareRequestBody(body);
    return runResolverHttpRequest('compare', body, deps, async (catalogProvider) =>
      deps.compareProductsService({
        sourceCode: input.sourceCode,
        candidateCode: input.candidateCode,
        catalogProvider,
      })
    );
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }

    logResolverInternalError('compare', error);
    return internalErrorResponse();
  }
}

export async function handleEquivalentsHttpRequest(
  body: unknown,
  deps: ResolverHttpDeps = defaultResolverHttpDeps
): Promise<ResolverHttpResponse> {
  try {
    const input = validateEquivalentsRequestBody(body);
    return runResolverHttpRequest('equivalents', body, deps, async (catalogProvider) =>
      deps.findEquivalentsService({
        code: input.code,
        catalogProvider,
      })
    );
  } catch (error) {
    if (error instanceof ResolverRequestValidationError) {
      return validationErrorResponse(error);
    }

    logResolverInternalError('equivalents', error);
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
