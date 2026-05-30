import {
  buildResolverEndpointUrl,
  compareProductsRemote,
  findEquivalentsRemote,
  identifyProductRemote,
  mapResolverApiErrorMessage,
  ResolverApiError,
} from '@/services/resolverApiClient';

describe('resolverApiClient', () => {
  const originalEnv = process.env;
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_RESOLVER_API_BASE_URL: 'https://example.cloudfunctions.net',
      EXPO_PUBLIC_RESOLVER_TIMEOUT_MS: '5000',
    };
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds identify endpoint URL', () => {
    expect(buildResolverEndpointUrl('identify')).toBe(
      'https://example.cloudfunctions.net/identify'
    );
  });

  it('posts identify request body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        normalizedCode: '4WE6E-6X/EG24N9K4',
        manufacturer: 'Rexroth',
        series: '4WE6',
        category: 'Valf',
        outcome: 'full',
        confidence: 'high',
        technicalAttributes: [],
        productDetailRows: [],
        warnings: [],
      }),
    });

    await identifyProductRemote('4WE6E-6X/EG24N9K4');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.cloudfunctions.net/identify',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ code: '4WE6E-6X/EG24N9K4' }),
      })
    );
  });

  it('posts compare request body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sourceCode: 'A',
        candidateCode: 'B',
        metadata: {
          compatibilityLevel: 'high',
          confidenceLevel: 'high',
          dataCompleteness: 'high',
        },
        summary: {
          matchLevelTr: 'Yüksek uyumlu muadil adayı',
          summaryTr: 'Özet',
          riskLevel: 'low',
          matchPercentage: 86,
        },
        compatible: [],
        different: [],
        unknownOrCheck: [],
        warnings: [],
      }),
    });

    await compareProductsRemote('4WE6E-6X/EG24N9K4', 'DSG-01-3C2-D24-N1-70');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.cloudfunctions.net/compare',
      expect.objectContaining({
        body: JSON.stringify({
          sourceCode: '4WE6E-6X/EG24N9K4',
          candidateCode: 'DSG-01-3C2-D24-N1-70',
        }),
      })
    );
  });

  it('posts equivalents request body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        source: {
          code: '4WE6E-6X/EG24N9K4',
          normalizedCode: '4WE6E-6X/EG24N9K4',
          manufacturer: 'Rexroth',
          series: '4WE6',
        },
        candidates: [],
      }),
    });

    await findEquivalentsRemote('4WE6E-6X/EG24N9K4');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.cloudfunctions.net/equivalents',
      expect.objectContaining({
        body: JSON.stringify({ code: '4WE6E-6X/EG24N9K4' }),
      })
    );
  });

  it('maps validation errors to friendly messages', () => {
    expect(
      mapResolverApiErrorMessage(new ResolverApiError('code must be a string', 'validation'))
    ).toBe('code must be a string');
  });

  it('maps network errors to friendly messages', () => {
    expect(mapResolverApiErrorMessage(new ResolverApiError('x', 'network'))).toContain(
      'bağlanılamadı'
    );
  });
});
