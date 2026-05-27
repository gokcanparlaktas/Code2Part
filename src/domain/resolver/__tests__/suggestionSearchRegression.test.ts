import { matchPercentageFromSuggestion } from '@/domain/scoring/suggestionMatchPercentage';
import { calculateSuggestionMatchPercentage } from '@/domain/scoring/calculateSuggestionMatchPercentage';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { suggestProducts } from '@/domain/resolver/suggestProducts';

function maxSuggestionPercentage(query: string) {
  const suggestions = suggestProducts(query);
  if (suggestions.length === 0) {
    return { max: 0, suggestions };
  }
  const percentages = suggestions.map((s) =>
    matchPercentageFromSuggestion(query, s).percentage
  );
  return { max: Math.max(...percentages), suggestions };
}

describe('suggestion/search regression (catalog v2)', () => {
  it('multi-token hydraulic search requires all tokens in example', () => {
    const query = 'D24 N1';
    const { suggestions } = maxSuggestionPercentage(query);
    expect(suggestions.length).toBeGreaterThan(0);
    for (const suggestion of suggestions) {
      const compact = suggestion.exampleCodeFormat.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      expect(compact).toContain('D24');
      expect(compact).toContain('N1');
    }
  });

  it.each(['DG4V 3', '4WE6', 'DSG 01'])(
    'partial series search "%s" does not score 100%',
    (query) => {
      const { max } = maxSuggestionPercentage(query);
      expect(max).toBeLessThan(100);
      expect(identifyProduct(query, normalizeCode(query)).outcome).not.toBe('full');
    }
  );

  it('DG4V 3 ranks DG4V-3 example highest among returned suggestions', () => {
    const query = 'DG4V 3';
    const suggestions = suggestProducts(query);
    expect(suggestions.length).toBeGreaterThan(0);
    const scored = suggestions.map((s) => ({
      code: s.exampleCodeFormat,
      pct: matchPercentageFromSuggestion(query, s).percentage,
    }));
    scored.sort((a, b) => b.pct - a.pct);
    expect(scored[0]!.code).toContain('DG4V-3');
  });

  it.each([
    ['50 n3', 'DSBC-50-100-PPVA-N3'],
    ['ppva n3', 'DSBC-50-100-PPVA-N3'],
    ['s050', 'P1D-S050MS-0100'],
  ])('pneumatic token search "%s" matches expected example', (query, expectedExample) => {
    const suggestions = suggestProducts(query);
    expect(
      suggestions.some((s) => s.exampleCodeFormat === expectedExample)
    ).toBe(true);
    const match = calculateSuggestionMatchPercentage(query, expectedExample);
    expect(match.percentage).toBeLessThan(100);
  });

  it('compact exact example returns 100% and shows exact match in suggestions', () => {
    const query = 'cp96 50 100';
    expect(calculateSuggestionMatchPercentage(query, 'CP96-50-100').percentage).toBe(100);
    const suggestions = suggestProducts(query);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.matchedBy).toBe('exact_match');
    expect(identifyProduct(query, normalizeCode(query)).outcome).toBe('full');
  });

  it('exact full hydraulic code returns 100% coverage score', () => {
    const code = '4WE6E-6X/EG24N9K4';
    expect(calculateSuggestionMatchPercentage(code, code).percentage).toBe(100);
  });
});
