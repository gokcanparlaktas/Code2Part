import type {
  CompatibilityResult,
  ScoredAttributeComparison,
} from '@/types/compatibility';

import {
  calculateMatchPercentage,
  calculateRawMatchScore,
  clampMatchPercentage,
  resolveMatchPercentageLevel,
} from '../calculateMatchPercentage';

function buildResult(
  overrides: Partial<{
    compatible: number;
    different: number;
    differentLabels: string[];
    checkItems: number;
    checkSeverities: Array<'low' | 'medium' | 'high'>;
    warnings: number;
    scoredComparisons: ScoredAttributeComparison[];
  }> = {}
): CompatibilityResult {
  const compatibleCount = overrides.compatible ?? 0;
  const differentCount = overrides.different ?? 0;
  const checkCount = overrides.checkItems ?? 0;
  const warningCount = overrides.warnings ?? 0;
  const differentLabels = overrides.differentLabels ?? [];
  const checkSeverities = overrides.checkSeverities ?? [];

  return {
    candidate: {
      seriesId: 'test_series',
      brand: 'Test',
      series: 'TS',
      productType: 'Test',
      productCategory: 'Test',
      standardFamily: 'Test',
      suggestedCode: 'TEST-1',
      targetIdentification: null,
    },
    summary: {
      matchLevelTr: 'Mekanik muadil adayı',
      summaryTr: 'Test özeti',
      riskLevel: 'medium',
    },
    compatible: Array.from({ length: compatibleCount }, (_, index) => ({
      label: `Uyumlu ${index + 1}`,
      sourceDisplay: 'A',
      targetDisplay: 'A',
      status: 'compatible' as const,
    })),
    different: Array.from({ length: differentCount }, (_, index) => ({
      label: differentLabels[index] ?? `Farklı ${index + 1}`,
      sourceDisplay: 'A',
      targetDisplay: 'B',
      status: 'different' as const,
    })),
    checkItems: Array.from({ length: checkCount }, (_, index) => ({
      field: `Kontrol ${index + 1}`,
      sourceValue: '?',
      targetValue: '?',
      reasonTr: 'Kontrol edin',
      severity: (checkSeverities[index] ?? 'medium') as const,
    })),
    warnings: Array.from({ length: warningCount }, (_, index) => `Uyarı ${index + 1}`),
    profileScoring: overrides.scoredComparisons
      ? { scoredComparisons: overrides.scoredComparisons }
      : undefined,
  };
}

describe('calculateMatchPercentage', () => {
  it('clamps values between 0 and 100', () => {
    expect(clampMatchPercentage(-20)).toBe(0);
    expect(clampMatchPercentage(150)).toBe(100);
    expect(clampMatchPercentage(67.4)).toBe(67);
  });

  it('assigns low/medium/high levels', () => {
    expect(resolveMatchPercentageLevel(0)).toBe('low');
    expect(resolveMatchPercentageLevel(49)).toBe('low');
    expect(resolveMatchPercentageLevel(50)).toBe('medium');
    expect(resolveMatchPercentageLevel(69)).toBe('medium');
    expect(resolveMatchPercentageLevel(70)).toBe('high');
    expect(resolveMatchPercentageLevel(100)).toBe('high');
  });

  it('returns 100 only when all critical scored comparisons are compatible with no checks/warnings', () => {
    const perfect = buildResult({
      scoredComparisons: [
        {
          label: 'Çap (bore)',
          sourceDisplay: '50 mm',
          targetDisplay: '50 mm',
          status: 'compatible',
          importance: 'critical',
        },
        {
          label: 'Strok',
          sourceDisplay: '100 mm',
          targetDisplay: '100 mm',
          status: 'compatible',
          importance: 'critical',
        },
      ],
    });

    expect(calculateMatchPercentage(perfect).percentage).toBe(100);
    expect(
      calculateMatchPercentage(
        buildResult({
          scoredComparisons: [
            {
              label: 'Çap (bore)',
              sourceDisplay: '50 mm',
              targetDisplay: '50 mm',
              status: 'compatible',
              importance: 'critical',
            },
            {
              label: 'Sönümleme tipi',
              sourceDisplay: 'PPVA',
              targetDisplay: 'Bilinmiyor',
              status: 'unknownOrCheck',
              importance: 'important',
            },
          ],
        })
      ).percentage
    ).toBeLessThan(100);
  });

  it('scores compatible critical attributes above zero', () => {
    const match = calculateMatchPercentage(
      buildResult({
        scoredComparisons: [
          {
            label: 'Çap (bore)',
            sourceDisplay: '50 mm',
            targetDisplay: '50 mm',
            status: 'compatible',
            importance: 'critical',
          },
          {
            label: 'Strok',
            sourceDisplay: '100 mm',
            targetDisplay: '100 mm',
            status: 'compatible',
            importance: 'critical',
          },
          {
            label: 'Standart ailesi',
            sourceDisplay: 'ISO 15552',
            targetDisplay: 'ISO 15552',
            status: 'unknownOrCheck',
            importance: 'critical',
          },
        ],
      })
    );

    expect(match.percentage).toBeGreaterThan(0);
    expect(match.level).not.toBe('low');
  });

  it('reduces score for critical different attributes', () => {
    const withDifferentStroke = calculateMatchPercentage(
      buildResult({
        scoredComparisons: [
          {
            label: 'Çap (bore)',
            sourceDisplay: '50 mm',
            targetDisplay: '50 mm',
            status: 'compatible',
            importance: 'critical',
          },
          {
            label: 'Strok',
            sourceDisplay: '100 mm',
            targetDisplay: '80 mm',
            status: 'different',
            importance: 'critical',
          },
        ],
      })
    );

    const withSameStroke = calculateMatchPercentage(
      buildResult({
        scoredComparisons: [
          {
            label: 'Çap (bore)',
            sourceDisplay: '50 mm',
            targetDisplay: '50 mm',
            status: 'compatible',
            importance: 'critical',
          },
          {
            label: 'Strok',
            sourceDisplay: '100 mm',
            targetDisplay: '100 mm',
            status: 'compatible',
            importance: 'critical',
          },
        ],
      })
    );

    expect(withDifferentStroke.percentage).toBeLessThan(withSameStroke.percentage);
  });

  it('returns zero when there are no compatible points and penalties exist', () => {
    const match = calculateMatchPercentage(
      buildResult({
        scoredComparisons: [
          {
            label: 'CETOP / NG ölçüsü',
            sourceDisplay: 'NG6',
            targetDisplay: 'NG10',
            status: 'different',
            importance: 'critical',
          },
        ],
      })
    );

    expect(match.percentage).toBe(0);
  });

  it('applies warning penalties', () => {
    const withoutWarnings = calculateMatchPercentage(
      buildResult({
        scoredComparisons: [
          {
            label: 'Bobin voltajı',
            sourceDisplay: '24V DC',
            targetDisplay: '24V DC',
            status: 'compatible',
            importance: 'critical',
          },
        ],
      })
    );

    const withWarnings = calculateMatchPercentage({
      ...buildResult({
        scoredComparisons: [
          {
            label: 'Bobin voltajı',
            sourceDisplay: '24V DC',
            targetDisplay: '24V DC',
            status: 'compatible',
            importance: 'critical',
          },
        ],
      }),
      warnings: ['Katalog kontrolü gerekir'],
    });

    expect(withWarnings.percentage).toBeLessThan(withoutWarnings.percentage);
  });

  it('uses fallback scoring when profileScoring is missing', () => {
    const result = buildResult({
      compatible: 2,
      checkItems: 1,
      checkSeverities: ['medium'],
    });

    expect(calculateRawMatchScore(result)).toBeGreaterThan(0);
    expect(calculateMatchPercentage(result).percentage).toBeLessThan(100);
  });

  it('returns color for each level', () => {
    expect(
      calculateMatchPercentage(
        buildResult({
          scoredComparisons: [
            {
              label: 'Çap (bore)',
              sourceDisplay: '50 mm',
              targetDisplay: '50 mm',
              status: 'compatible',
              importance: 'critical',
            },
            {
              label: 'Strok',
              sourceDisplay: '100 mm',
              targetDisplay: '100 mm',
              status: 'compatible',
              importance: 'critical',
            },
          ],
        })
      ).color
    ).toBe('#16A34A');
  });
});
