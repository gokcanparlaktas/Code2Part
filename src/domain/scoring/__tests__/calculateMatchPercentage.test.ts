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
    checkItems: number;
    warnings: number;
  }> = {}
): CompatibilityResult {
  const compatibleCount = overrides.compatible ?? 0;
  const differentCount = overrides.different ?? 0;
  const checkCount = overrides.checkItems ?? 0;
  const warningCount = overrides.warnings ?? 0;

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
      label: `Farklı ${index + 1}`,
      sourceDisplay: 'A',
      targetDisplay: 'B',
      status: 'different' as const,
    })),
    checkItems: Array.from({ length: checkCount }, (_, index) => ({
      field: `Kontrol ${index + 1}`,
      sourceValue: '?',
      targetValue: '?',
      reasonTr: 'Kontrol edin',
      severity: 'medium' as const,
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
    expect(calculateMatchPercentage(buildResult({ different: 4 })).level).toBe('low');
  });

  it('assigns medium level for 50-79', () => {
    expect(resolveMatchPercentageLevel(50)).toBe('medium');
    expect(resolveMatchPercentageLevel(79)).toBe('medium');
    expect(
      calculateMatchPercentage(buildResult({ compatible: 2, checkItems: 1 })).level
    ).toBe('medium');
  });

  it('assigns high level for 80-100', () => {
    expect(resolveMatchPercentageLevel(80)).toBe('high');
    expect(resolveMatchPercentageLevel(100)).toBe('high');
    expect(calculateMatchPercentage(buildResult({ compatible: 4 })).percentage).toBe(100);
    expect(calculateMatchPercentage(buildResult({ compatible: 4 })).level).toBe('high');
  });

  it('adds score for compatible and check items', () => {
    const score = calculateRawMatchScore(buildResult({ compatible: 2, checkItems: 2 }));
    expect(score).toBe(70);
  });

  it('reduces score for warnings and different items', () => {
    const score = calculateRawMatchScore(
      buildResult({ compatible: 3, different: 2, warnings: 2, checkItems: 1 })
    );
    expect(score).toBe(15);
    expect(calculateMatchPercentage(buildResult({ compatible: 3, different: 2, warnings: 2, checkItems: 1 })).level).toBe(
      'low'
    );
  });

  it('returns color for each level', () => {
    expect(calculateMatchPercentage(buildResult({ compatible: 4 })).color).toBe('#16A34A');
    expect(calculateMatchPercentage(buildResult({ compatible: 2, checkItems: 1 })).color).toBe(
      '#F59E0B'
    );
    expect(calculateMatchPercentage(buildResult({ different: 3 })).color).toBe('#DC2626');
  });
});
