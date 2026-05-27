import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { suggestProductsDetailed } from '@/domain/resolver/suggestProducts';

describe('partial Rexroth prefix suggestions', () => {
  it.each(['4WE6', '4WE6E', '4WE6E-7X', '4WE6E-7X/'])(
    'query "%s" returns suggestions',
    (query) => {
      const result = suggestProductsDetailed(query);
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  );

  it('4WE6E-7X partial prefix stays series_only and suggests catalog examples', () => {
    const query = '4WE6E-7X';
    const id = identifyProduct(query, normalizeCode(query));
    expect(id.outcome).toBe('series_only');
    expect(id.seriesId).toBe('rexroth_4we6');

    const result = suggestProductsDetailed(query);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.some((s) => s.exampleCodeFormat.includes('4WE6E-7X/'))).toBe(
      true
    );
    expect(result.suggestions.every((s) => s.matchedBy !== 'exact_match')).toBe(true);
  });
});
