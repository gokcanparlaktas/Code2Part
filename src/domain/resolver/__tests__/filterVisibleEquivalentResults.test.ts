import type { CompatibilityResult } from '@/types/compatibility';

import { filterVisibleEquivalentResults } from '../filterVisibleEquivalentResults';

jest.mock('@/domain/scoring/calculateMatchPercentage', () => ({
  calculateMatchPercentage: (result: CompatibilityResult) => {
    const raw = result.candidate.series;
    const score = Number(raw?.replace(/^r/, ''));
    return {
      percentage: Number.isFinite(score) ? score : 0,
      level: 'low',
      color: '#000000',
    };
  },
}));

function resultWithScore(options: { id: string; score: number }): CompatibilityResult {
  return {
    candidate: {
      seriesId: options.id,
      brand: 'X',
      series: `r${options.score}`,
      productType: 't',
      productCategory: 'c',
      standardFamily: 's',
      suggestedCode: options.id,
      targetIdentification: null,
    },
    summary: {
      matchLevelTr: 'Fonksiyonel alternatif',
      summaryTr: 'test',
      riskLevel: 'high',
    },
    compatible: [],
    different: [],
    checkItems: [],
    warnings: [],
  };
}

describe('filterVisibleEquivalentResults', () => {
  it('<=5 results returns all visible and isLimited false', () => {
    const results = [1, 2, 3, 4, 5].map((n) => resultWithScore({ id: `r${n}`, score: 80 }));
    const filtered = filterVisibleEquivalentResults(results);
    expect(filtered.totalCount).toBe(5);
    expect(filtered.visible).toHaveLength(5);
    expect(filtered.hidden).toHaveLength(0);
    expect(filtered.isLimited).toBe(false);
  });

  it('>5 results returns visible and hidden', () => {
    const results = [90, 85, 70, 65, 55, 40, 30].map((score, idx) =>
      resultWithScore({ id: `r${idx}`, score }),
    );
    const filtered = filterVisibleEquivalentResults(results);
    expect(filtered.totalCount).toBe(7);
    expect(filtered.visible.length).toBeGreaterThan(0);
    expect(filtered.hidden.length).toBeGreaterThan(0);
    expect(filtered.isLimited).toBe(true);
  });

  it('ensures at least top 5 visible even if scores below 60', () => {
    const results = [50, 49, 48, 47, 46, 10, 9].map((score, idx) =>
      resultWithScore({ id: `r${idx}`, score }),
    );
    const filtered = filterVisibleEquivalentResults(results);
    expect(filtered.visible).toHaveLength(5);
    expect(filtered.hidden).toHaveLength(2);
  });

  it('includes candidates >=60 within cap logic', () => {
    const results = [95, 92, 90, 88, 86, 84, 82, 80, 78, 40].map((score, idx) =>
      resultWithScore({ id: `r${idx}`, score }),
    );
    const filtered = filterVisibleEquivalentResults(results);
    // hard cap is 8 by default
    expect(filtered.visible).toHaveLength(8);
    expect(filtered.hiddenCount).toBe(2);
  });

  it('totalCount and hiddenCount are correct', () => {
    const results = [90, 50, 40, 30, 20, 10].map((score, idx) =>
      resultWithScore({ id: `r${idx}`, score }),
    );
    const filtered = filterVisibleEquivalentResults(results);
    expect(filtered.totalCount).toBe(6);
    expect(filtered.hiddenCount).toBe(filtered.hidden.length);
    expect(filtered.visible.length + filtered.hidden.length).toBe(6);
  });
});

