import { mapIdentifyProductResponse } from '@/backend/dto/mapIdentifyProductResponse';
import {
  compareProductsRemote,
  findEquivalentsRemote,
  identifyProductRemote,
} from '@/services/resolverApiClient';
import {
  compareProductsResolved,
  compareTwoProductsResolved,
  findEquivalentsResolved,
  identifyProductResolved,
} from '@/services/resolverService';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

jest.mock('@/services/resolverApiClient', () => ({
  ...jest.requireActual('@/services/resolverApiClient'),
  identifyProductRemote: jest.fn(),
  compareProductsRemote: jest.fn(),
  findEquivalentsRemote: jest.fn(),
}));

const REXROTH = '4WE6E-6X/EG24N9K4';
const YUKEN = 'DSG-01-3C2-D24-N1-70';
const BEARING = '6005-2RS';

function mockIdentifyDto(code: string) {
  const identification = identifyProduct(code, normalizeCode(code));
  return mapIdentifyProductResponse({ identification, inputCode: code });
}

describe('resolverService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_RESOLVER_MODE;
    delete process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK;
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses backend identify flow by default', async () => {
    (identifyProductRemote as jest.Mock).mockResolvedValue(mockIdentifyDto(REXROTH));

    const resolved = await identifyProductResolved(REXROTH);
    expect(identifyProductRemote).toHaveBeenCalledWith(REXROTH);
    expect(resolved.source).toBe('backend');
    expect(resolved.identification.brand.value).toBe('Rexroth');
  });

  it('uses local identify flow when EXPO_PUBLIC_RESOLVER_MODE=local', async () => {
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'local';

    const resolved = await identifyProductResolved(REXROTH);
    expect(resolved.source).toBe('local');
    expect(identifyProductRemote).not.toHaveBeenCalled();
  });

  it('uses backend product search by default', async () => {
    (identifyProductRemote as jest.Mock).mockResolvedValue(mockIdentifyDto(REXROTH));
    (findEquivalentsRemote as jest.Mock).mockResolvedValue({
      source: {
        code: REXROTH,
        normalizedCode: REXROTH,
        manufacturer: 'Rexroth',
        series: '4WE6',
      },
      candidates: [],
    });

    const resolved = await findEquivalentsResolved(REXROTH);
    expect(identifyProductRemote).toHaveBeenCalledWith(REXROTH);
    expect(findEquivalentsRemote).toHaveBeenCalledWith(REXROTH);
    expect(resolved.source).toBe('backend');
  });

  it('uses local product search when mode is local', async () => {
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'local';

    const local = await findEquivalentsResolved(REXROTH);
    const expected = resolveProductSearch(REXROTH);

    expect(local.source).toBe('local');
    expect(local.hasEquivalents).toBe(expected.hasEquivalents);
    expect(findEquivalentsRemote).not.toHaveBeenCalled();
  });

  it('uses backend for rolling bearing codes', async () => {
    (identifyProductRemote as jest.Mock).mockResolvedValue(mockIdentifyDto(BEARING));
    (findEquivalentsRemote as jest.Mock).mockResolvedValue({
      source: {
        code: BEARING,
        normalizedCode: BEARING,
        manufacturer: null,
        series: '6005',
      },
      candidates: [
        {
          code: 'SKF 6005-2RS',
          manufacturer: 'SKF',
          series: '6005',
          matchPercentage: 80,
          metadata: {
            compatibilityLevel: 'medium',
            confidenceLevel: 'medium',
            dataCompleteness: 'medium',
          },
          summary: 'Özet',
          compatibleHighlights: [],
          checkNotes: [],
        },
      ],
    });

    const resolved = await findEquivalentsResolved(BEARING);

    expect(resolved.source).toBe('backend');
    expect(resolved.identification.outcome).toBe('full');
    expect(resolved.identification.resolverCategoryKey).toBe('rolling_bearing');
    expect(identifyProductRemote).toHaveBeenCalledWith(BEARING);
    expect(findEquivalentsRemote).toHaveBeenCalledWith(BEARING);
  });

  it('uses remote equivalents flow in backend mode', async () => {
    (identifyProductRemote as jest.Mock).mockResolvedValue(mockIdentifyDto(REXROTH));
    (findEquivalentsRemote as jest.Mock).mockResolvedValue({
      source: {
        code: REXROTH,
        normalizedCode: REXROTH,
        manufacturer: 'Rexroth',
        series: '4WE6',
      },
      candidates: [
        {
          code: YUKEN,
          manufacturer: 'Yuken',
          series: 'DSG-01',
          matchPercentage: 86,
          metadata: {
            compatibilityLevel: 'high',
            confidenceLevel: 'high',
            dataCompleteness: 'high',
          },
          summary: 'Özet',
          compatibleHighlights: [],
          checkNotes: [],
        },
      ],
    });

    const resolved = await findEquivalentsResolved(REXROTH);
    expect(findEquivalentsRemote).toHaveBeenCalledWith(REXROTH);
    expect(resolved.source).toBe('backend');
    expect(resolved.compatibilityResults.some((item) => item.candidate.suggestedCode === YUKEN)).toBe(
      true
    );
  });

  it('uses remote compare in backend mode', async () => {
    (compareProductsRemote as jest.Mock).mockResolvedValue({
      sourceCode: REXROTH,
      candidateCode: YUKEN,
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
    });

    const result = await compareProductsResolved(REXROTH, YUKEN);
    expect(compareProductsRemote).toHaveBeenCalledWith(REXROTH, YUKEN);
    expect(result.serverMatchPercentage).toBe(86);
  });

  it('uses remote two-code compare in backend mode', async () => {
    (compareProductsRemote as jest.Mock).mockResolvedValue({
      sourceCode: BEARING,
      candidateCode: 'SKF 6005-2RS',
      metadata: {
        compatibilityLevel: 'medium',
        confidenceLevel: 'medium',
        dataCompleteness: 'medium',
      },
      summary: {
        matchLevelTr: 'Mekanik muadil adayı',
        summaryTr: 'Özet',
        riskLevel: 'medium',
        matchPercentage: 75,
      },
      compatible: [],
      different: [],
      unknownOrCheck: [],
      warnings: [],
    });

    const result = await compareTwoProductsResolved(BEARING, 'SKF 6005-2RS');
    expect(compareProductsRemote).toHaveBeenCalledWith(BEARING, 'SKF 6005-2RS');
    expect(result.serverMatchPercentage).toBe(75);
  });

  it('does not import firebase client SDK in service layer', () => {
    expect(JSON.stringify(require('@/services/resolverService'))).not.toMatch(/firebase/i);
    expect(JSON.stringify(require('@/services/resolverApiClient'))).not.toMatch(/firestore/i);
  });
});
