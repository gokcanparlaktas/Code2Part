import type { CatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import { LocalCatalogDataProvider } from '@/domain/catalogData/CatalogDataProvider';
import {
  findForbiddenBackendResponseKeys,
} from '@/backend/dto/backendResponseSecurity';
import { createResolverHttpHandler } from '@/backend/http/createCloudFunctionHandler';
import {
  defaultResolverHttpDeps,
  handleCompareHttpRequest,
  handleEquivalentsHttpRequest,
  handleIdentifyHttpRequest,
  type ResolverHttpDeps,
} from '@/backend/http/resolverHttpHandlers';
import { MAX_PRODUCT_CODE_LENGTH } from '@/backend/http/validateResolverRequest';
import { compareProductsService } from '@/backend/services/compareProductsService';
import { findEquivalentsService } from '@/backend/services/findEquivalentsService';
import { identifyProductService } from '@/backend/services/identifyProductService';

const REXROTH_CODE = '4WE6E-6X/EG24N9K4';
const YUKEN_CODE = 'DSG-01-3C2-D24-N1-70';

function buildLocalDeps(): ResolverHttpDeps {
  const catalogProvider = new LocalCatalogDataProvider();
  return {
    getCatalogProvider: async () => catalogProvider,
    identifyProductService,
    compareProductsService,
    findEquivalentsService,
  };
}

describe('validateResolverRequest via HTTP handlers', () => {
  const deps = buildLocalDeps();

  it('rejects non-object body', async () => {
    const result = await handleIdentifyHttpRequest(null, deps);
    expect(result.status).toBe(400);
    expect(result.body.code).toBe('validation_error');
  });

  it('rejects empty code after trim', async () => {
    const result = await handleIdentifyHttpRequest({ code: '   ' }, deps);
    expect(result.status).toBe(400);
    expect(String(result.body.error)).toContain('empty');
  });

  it('rejects code exceeding max length', async () => {
    const result = await handleIdentifyHttpRequest(
      { code: 'A'.repeat(MAX_PRODUCT_CODE_LENGTH + 1) },
      deps
    );
    expect(result.status).toBe(400);
    expect(String(result.body.error)).toContain(String(MAX_PRODUCT_CODE_LENGTH));
  });

  it('trims code before service call', async () => {
    const identifySpy = jest.fn(identifyProductService);
    const trimmedDeps: ResolverHttpDeps = {
      ...deps,
      identifyProductService: identifySpy as typeof identifyProductService,
    };

    await handleIdentifyHttpRequest({ code: `  ${REXROTH_CODE}  ` }, trimmedDeps);
    expect(identifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ code: REXROTH_CODE })
    );
  });

  it('validates compare requires both codes', async () => {
    const result = await handleCompareHttpRequest({ sourceCode: REXROTH_CODE }, deps);
    expect(result.status).toBe(400);
  });
});

describe('resolver HTTP handlers with local catalog', () => {
  const deps = buildLocalDeps();

  it('identify returns DTO without forbidden keys', async () => {
    const result = await handleIdentifyHttpRequest({ code: REXROTH_CODE }, deps);
    expect(result.status).toBe(200);
    expect(result.body.manufacturer).toBe('Rexroth');
    expect(findForbiddenBackendResponseKeys(result.body)).toEqual([]);
  });

  it('compare returns DTO without forbidden keys', async () => {
    const result = await handleCompareHttpRequest(
      { sourceCode: REXROTH_CODE, candidateCode: YUKEN_CODE },
      deps
    );
    expect(result.status).toBe(200);
    expect(result.body.summary).toBeDefined();
    expect((result.body.summary as { matchPercentage: number }).matchPercentage).toBeGreaterThan(0);
    expect(findForbiddenBackendResponseKeys(result.body)).toEqual([]);
  });

  it('equivalents returns DTO without forbidden keys', async () => {
    const result = await handleEquivalentsHttpRequest({ code: REXROTH_CODE }, deps);
    expect(result.status).toBe(200);
    expect(result.body.candidates).toBeDefined();
    expect(findForbiddenBackendResponseKeys(result.body)).toEqual([]);
  });
});

describe('resolver HTTP handlers with mocked services', () => {
  it('returns 500 when service throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const deps: ResolverHttpDeps = {
      getCatalogProvider: async () => ({}) as CatalogDataProvider,
      identifyProductService: async () => {
        throw new Error('boom');
      },
      compareProductsService,
      findEquivalentsService,
    };

    const result = await handleIdentifyHttpRequest({ code: REXROTH_CODE }, deps);
    expect(result.status).toBe(500);
    expect(result.body.code).toBe('internal_error');
    expect(result.body.error).toBe('Internal resolver error');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('uses injected catalog provider', async () => {
    const provider = new LocalCatalogDataProvider();
    const getCatalogProvider = jest.fn(async () => provider);
    const deps: ResolverHttpDeps = {
      getCatalogProvider,
      identifyProductService,
      compareProductsService,
      findEquivalentsService,
    };

    await handleIdentifyHttpRequest({ code: REXROTH_CODE }, deps);
    expect(getCatalogProvider).toHaveBeenCalledTimes(1);
  });
});

describe('createResolverHttpHandler', () => {
  it('rejects GET with 405', async () => {
    const handler = createResolverHttpHandler('identify', buildLocalDeps());
    const res = createMockResponse();

    await handler({ method: 'GET' }, res);

    expect(res.statusCode).toBe(405);
    expect(res.jsonBody?.code).toBe('method_not_allowed');
  });

  it('handles OPTIONS with 204', async () => {
    const handler = createResolverHttpHandler('identify', buildLocalDeps());
    const res = createMockResponse();

    await handler({ method: 'OPTIONS' }, res);

    expect(res.statusCode).toBe(204);
  });

  it('POST identify delegates to handler', async () => {
    const handler = createResolverHttpHandler('identify', buildLocalDeps());
    const res = createMockResponse();

    await handler({ method: 'POST', body: { code: REXROTH_CODE } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody?.manufacturer).toBe('Rexroth');
    expect(findForbiddenBackendResponseKeys(res.jsonBody)).toEqual([]);
  });
});

describe('defaultResolverHttpDeps', () => {
  it('exposes real service references for Cloud Functions runtime', () => {
    expect(defaultResolverHttpDeps.identifyProductService).toBe(identifyProductService);
    expect(defaultResolverHttpDeps.compareProductsService).toBe(compareProductsService);
    expect(defaultResolverHttpDeps.findEquivalentsService).toBe(findEquivalentsService);
  });
});

function createMockResponse() {
  const res = {
    statusCode: 200,
    jsonBody: undefined as Record<string, unknown> | undefined,
    sendBody: undefined as string | undefined,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.jsonBody = body as Record<string, unknown>;
    },
    send(body?: string) {
      res.sendBody = body;
    },
    set(header: string, value: string) {
      res.headers[header] = value;
    },
  };

  return res;
}
