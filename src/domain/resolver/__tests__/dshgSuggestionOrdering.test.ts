import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import { suggestProductsDetailed } from '@/domain/resolver/suggestProducts';

describe('dshg suggestion ordering', () => {
  it('ranks higher match percentage suggestions first', () => {
    const query = 'dshg';
    const result = suggestProductsDetailed(query);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);

    const scored = result.suggestions.map((s) => ({
      series: s.series,
      example: s.exampleCodeFormat,
      matchedBy: s.matchedBy,
      pct: matchPercentageFromSuggestion(query, s).percentage,
    }));

    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1]!.pct).toBeGreaterThanOrEqual(scored[i]!.pct);
    }
  });
});
