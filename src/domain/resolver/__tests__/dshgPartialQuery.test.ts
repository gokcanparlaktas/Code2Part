import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import { suggestProductsDetailed } from '@/domain/resolver/suggestProducts';

describe('dshg-0 suggestions', () => {
  it('keeps DSHG-03 series and DSHG-03 product example', () => {
    const query = 'dshg-0';
    const result = suggestProductsDetailed(query, 20);

    const scored = result.suggestions.map((s) => ({
      series: s.series,
      example: s.exampleCodeFormat,
      matchedBy: s.matchedBy,
      pct: matchPercentageFromSuggestion(query, s).percentage,
    }));

    expect(scored.some((s) => s.series === 'DSHG-03' && s.example === 'DSHG-03')).toBe(true);
    expect(scored.some((s) => s.example.startsWith('DSHG-03-'))).toBe(true);
  });
});
