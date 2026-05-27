import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import {
  DEFAULT_SUGGESTION_LIMIT,
  suggestProducts,
  suggestProductsDetailed,
} from '@/domain/resolver/suggestProducts';

describe('suggestProducts autocomplete', () => {
  it('short query with many matches returns capped suggestions, not empty', () => {
    const result = suggestProductsDetailed('DG4V', 5);
    expect(result.suggestions.length).toBe(5);
    expect(result.totalMatchedCount).toBeGreaterThan(5);
    expect(result.hasMoreResults).toBe(true);
  });

  it('limit caps results but never clears the list when matches exceed limit', () => {
    const detailed = suggestProductsDetailed('50 100', 5);
    expect(detailed.suggestions.length).toBeGreaterThan(0);
    expect(detailed.suggestions.length).toBeLessThanOrEqual(5);
    if (detailed.totalMatchedCount > 5) {
      expect(detailed.hasMoreResults).toBe(true);
    }
  });

  it('exact full product code shows exact match as first suggestion', () => {
    const code = 'DG4V-3-2A-M-U-D24-60';
    const identification = identifyProduct(code, normalizeCode(code));
    expect(identification.outcome).toBe('full');

    const result = suggestProductsDetailed(code);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]?.matchedBy).toBe('exact_match');
    expect(result.suggestions[0]?.exampleCodeFormat).toBe(normalizeCode(code));
    expect(result.suggestions[0]?.suggestionTextTr).toBe(
      `Tam kod eşleşmesi: Vickers ${normalizeCode(code)}`
    );
    expect(result.hasMoreResults).toBe(false);
  });

  it('Rexroth 4WE6E-7X/HG24N9K4 with slash identifies and suggests exact match', () => {
    const code = '4WE6E-7X/HG24N9K4';
    const identification = identifyProduct(code, normalizeCode(code));
    expect(identification.outcome).toBe('full');
    expect(identification.seriesId).toBe('rexroth_4we6');

    const result = suggestProductsDetailed(code);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0]?.matchedBy).toBe('exact_match');
    expect(result.suggestions[0]?.exampleCodeFormat).toBe(code);
    expect(result.suggestions[0]?.suggestionTextTr).toBe(
      `Tam kod eşleşmesi: Rexroth ${code}`
    );
  });

  it('exact match does not duplicate generic series-prefix suggestion', () => {
    const code = 'DG4V-3-2A-M-U-D24-60';
    const suggestions = suggestProducts(code);
    expect(suggestions).toHaveLength(1);
    expect(suggestions.some((s) => s.suggestionTextTr.includes('serisine ait olabilir'))).toBe(
      false
    );
  });

  it.each([
    'DG4V-3-2A-M-U-D24-60',
    'DG4V 3 2A M U D24 60',
    'dg4v-3-2a-m-u-d24-60',
  ])('code variation "%s" resolves to same exact match', (input) => {
    const identification = identifyProduct(input, normalizeCode(input));
    expect(identification.outcome).toBe('full');
    expect(identification.normalizedCode).toBe('DG4V-3-2A-M-U-D24-60');

    const suggestions = suggestProducts(input);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.exampleCodeFormat).toBe('DG4V-3-2A-M-U-D24-60');
    expect(suggestions[0]?.matchedBy).toBe('exact_match');
  });

  it('catalog check messages are not required for this file — exact pneumatic code still suggests', () => {
    const query = 'cp96 50 100';
    const identification = identifyProduct(query, normalizeCode(query));
    expect(identification.outcome).toBe('full');

    const suggestions = suggestProducts(query);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.matchedBy).toBe('exact_match');
    expect(suggestions[0]?.exampleCodeFormat).toBe('CP96-50-100');
  });
});
