import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import { sortCompatibilityResultsByMatchPercentage } from '@/domain/presentation/sortCompatibilityResults';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import type { CompatibilityResult } from '@/types/compatibility';

describe('sortCompatibilityResultsByMatchPercentage', () => {
  it('orders equivalents by match percentage descending', () => {
    const { compatibilityResults } = resolveProductSearch('4WE6E-6X/EG24N9K4');
    expect(compatibilityResults.length).toBeGreaterThan(1);

    const sorted = sortCompatibilityResultsByMatchPercentage(compatibilityResults);
    const percentages = sorted.map((r) => calculateMatchPercentage(r).percentage);

    for (let i = 1; i < percentages.length; i += 1) {
      expect(percentages[i - 1]).toBeGreaterThanOrEqual(percentages[i]);
    }
  });

  it('uses calculated technical match score, not static labels', () => {
    const candidateBase = {
      productType: 'valf',
      productCategory: 'hidrolik',
      standardFamily: 'CETOP',
      suggestedCode: null,
      targetIdentification: null,
    };

    const low: CompatibilityResult = {
      candidate: {
        seriesId: 'a',
        brand: 'A',
        series: 'Low',
        ...candidateBase,
      },
      summary: {
        matchLevelTr: 'Fonksiyonel alternatif',
        summaryTr: 'test',
        riskLevel: 'high',
      },
      compatible: [],
      different: [
        {
          label: 'CETOP / NG',
          sourceDisplay: '03',
          targetDisplay: '05',
          status: 'different',
        },
      ],
      checkItems: [],
      warnings: [],
    };
    const high: CompatibilityResult = {
      candidate: {
        seriesId: 'b',
        brand: 'B',
        series: 'High',
        ...candidateBase,
      },
      summary: {
        matchLevelTr: 'Yüksek uyumlu muadil adayı',
        summaryTr: 'test',
        riskLevel: 'low',
      },
      compatible: [
        {
          label: 'Marka',
          sourceDisplay: 'x',
          targetDisplay: 'x',
          status: 'compatible',
        },
      ],
      different: [],
      checkItems: [],
      warnings: [],
    };

    const sorted = sortCompatibilityResultsByMatchPercentage([low, high]);
    expect(calculateMatchPercentage(sorted[0]).percentage).toBeGreaterThan(
      calculateMatchPercentage(sorted[1]).percentage
    );
    expect(sorted[0].candidate.series).toBe('High');
  });
});
