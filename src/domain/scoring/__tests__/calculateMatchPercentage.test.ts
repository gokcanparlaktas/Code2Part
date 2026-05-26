import type { CompatibilityResult } from '@/types/compatibility';

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
  };
}

describe('calculateMatchPercentage', () => {
  it('clamps values between 0 and 100', () => {
    expect(clampMatchPercentage(-20)).toBe(0);
    expect(clampMatchPercentage(150)).toBe(100);
    expect(clampMatchPercentage(67.4)).toBe(67);
  });

  it('assigns low level for 0-49', () => {
    expect(resolveMatchPercentageLevel(0)).toBe('low');
    expect(resolveMatchPercentageLevel(49)).toBe('low');
    expect(
      calculateMatchPercentage(
        buildResult({ different: 3, differentLabels: ['Çap', 'Strok', 'Montaj'] })
      ).level
    ).toBe('low');
  });

  it('assigns medium level for 50-79', () => {
    expect(resolveMatchPercentageLevel(50)).toBe('medium');
    expect(resolveMatchPercentageLevel(79)).toBe('medium');
    expect(calculateMatchPercentage(buildResult({ checkItems: 5 })).level).toBe('medium');
  });

  it('assigns high level for 80-100', () => {
    expect(resolveMatchPercentageLevel(80)).toBe('high');
    expect(resolveMatchPercentageLevel(100)).toBe('high');
    expect(calculateMatchPercentage(buildResult({})).percentage).toBe(100);
    expect(calculateMatchPercentage(buildResult({})).level).toBe('high');
  });

  it('returns 100 only when there are no different/check/warning items', () => {
    expect(calculateMatchPercentage(buildResult({})).percentage).toBe(100);
    expect(calculateMatchPercentage(buildResult({ checkItems: 1 })).percentage).toBeLessThan(100);
    expect(calculateMatchPercentage(buildResult({ warnings: 1 })).percentage).toBeLessThan(100);
    expect(calculateMatchPercentage(buildResult({ different: 1 })).percentage).toBeLessThan(100);
  });

  it('reduces score for 5 unknown/check items (not 100)', () => {
    const score = calculateRawMatchScore(buildResult({ checkItems: 5 }));
    expect(score).toBeLessThan(100);
    expect(calculateMatchPercentage(buildResult({ checkItems: 5 })).percentage).toBeLessThan(100);
  });

  it('reduces score for warnings', () => {
    expect(calculateMatchPercentage(buildResult({ warnings: 2 })).percentage).toBe(90);
  });

  it('critical different item drops score significantly', () => {
    const match = calculateMatchPercentage(buildResult({ different: 1, differentLabels: ['Çap'] }));
    expect(match.percentage).toBe(70);
    expect(match.level).toBe('medium');
  });

  it('critical unknown/check items use heavier penalty', () => {
    const normal = calculateMatchPercentage(buildResult({ checkItems: 1, checkSeverities: ['medium'] }));
    const critical = calculateMatchPercentage(buildResult({ checkItems: 1, checkSeverities: ['high'] }));
    expect(normal.percentage).toBe(93);
    expect(critical.percentage).toBe(88);
  });

  it('hydraulic-like critical unknowns should not show 100', () => {
    const match = calculateMatchPercentage(
      buildResult({
        checkItems: 5,
        checkSeverities: ['high', 'high', 'high', 'high', 'high'],
      })
    );
    expect(match.percentage).toBe(40);
    expect(match.level).toBe('low');
  });

  it('returns color for each level', () => {
    expect(calculateMatchPercentage(buildResult({})).color).toBe('#16A34A');
    expect(calculateMatchPercentage(buildResult({ checkItems: 5 })).color).toBe('#F59E0B');
    expect(
      calculateMatchPercentage(
        buildResult({ checkItems: 5, checkSeverities: ['high', 'high', 'high', 'high', 'high'] })
      ).color
    ).toBe('#DC2626');
  });
});
