import {
  compareProductsRemote,
  findEquivalentsRemote,
  identifyProductRemote,
} from '@/services/resolverApiClient';
import {
  compareProductsResolved,
  findEquivalentsResolved,
  identifyProductResolved,
} from '@/services/resolverService';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';

jest.mock('@/services/resolverApiClient', () => ({
  ...jest.requireActual('@/services/resolverApiClient'),
  identifyProductRemote: jest.fn(),
  compareProductsRemote: jest.fn(),
  findEquivalentsRemote: jest.fn(),
}));

const REXROTH = '4WE6E-6X/EG24N9K4';
const YUKEN = 'DSG-01-3C2-D24-N1-70';

describe('resolverService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses local identify flow by default', async () => {
    const local = await identifyProductResolved(REXROTH);
    expect(local.source).toBe('local');
    expect(local.identification.brand.value).toBe('Rexroth');
    expect(identifyProductRemote).not.toHaveBeenCalled();
  });

  it('uses remote identify flow in backend mode', async () => {
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'backend';
    process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK = 'false';

    (identifyProductRemote as jest.Mock).mockResolvedValue({
      normalizedCode: REXROTH,
      manufacturer: 'Rexroth',
      series: '4WE6',
      category: 'CETOP 03 / NG6 hidrolik yön kontrol valfi',
      outcome: 'full',
      confidence: 'high',
      technicalAttributes: [],
      productDetailRows: [{ label: 'Marka', value: 'Rexroth', evidence: 'x', requiresCheck: false }],
      warnings: [],
    });

    const resolved = await identifyProductResolved(REXROTH);
    expect(identifyProductRemote).toHaveBeenCalledWith(REXROTH);
    expect(resolved.source).toBe('backend');
    expect(resolved.productDetailRows).toHaveLength(1);
  });

  it('uses local product search by default', async () => {
    const local = await findEquivalentsResolved(REXROTH);
    const expected = resolveProductSearch(REXROTH);

    expect(local.source).toBe('local');
    expect(local.hasEquivalents).toBe(expected.hasEquivalents);
    expect(findEquivalentsRemote).not.toHaveBeenCalled();
  });

  it('fully identifies Rexroth nameplate codes after component series normalization', async () => {
    const local = await findEquivalentsResolved('4WE 6 J62/EG24N9K4');

    expect(local.identification.outcome).toBe('full');
    expect(local.productDetailRows.length).toBeGreaterThan(0);
    expect(local.productDetailRows.some((row) => row.label === 'Bobin voltajı')).toBe(true);
    expect(local.hasEquivalents).toBe(true);
  });

  it('uses remote equivalents flow in backend mode', async () => {
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'backend';
    process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK = 'false';

    (identifyProductRemote as jest.Mock).mockResolvedValue({
      normalizedCode: REXROTH,
      manufacturer: 'Rexroth',
      series: '4WE6',
      category: 'Valf',
      outcome: 'full',
      confidence: 'high',
      technicalAttributes: [],
      productDetailRows: [],
      warnings: [],
    });

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
    process.env.EXPO_PUBLIC_RESOLVER_MODE = 'backend';
    process.env.EXPO_PUBLIC_RESOLVER_BACKEND_FALLBACK = 'false';

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

  it('does not import firebase client SDK in service layer', () => {
    expect(JSON.stringify(require('@/services/resolverService'))).not.toMatch(/firebase/i);
    expect(JSON.stringify(require('@/services/resolverApiClient'))).not.toMatch(/firestore/i);
  });
});
