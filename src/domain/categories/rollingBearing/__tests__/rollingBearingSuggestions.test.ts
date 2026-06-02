import { suggestProducts } from '@/domain/resolver/suggestProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('rollingBearingSuggestions', () => {
  it('suggests 6003 base and common suffix variants', () => {
    const suggestions = suggestProducts('6003');
    const codes = suggestions.map((s) => s.exampleCodeFormat);

    expect(codes).toContain('6003');
    expect(codes).toContain('6003-2RS');
    expect(codes).toContain('6003-ZZ');
    expect(codes).toContain('6003-2Z');
    expect(suggestions.length).toBeGreaterThanOrEqual(4);
  });

  it('uses Bilyalı rulman and bearing dimension labels, not strok', () => {
    const suggestions = suggestProducts('6003');
    expect(suggestions[0]?.productTypeTr).toBe('Bilyalı rulman');
    expect(suggestions[0]?.detectedAttributes.strokeMm).toBeUndefined();

    const withBore = suggestions.find((s) => s.detectedAttributes.boreMm !== undefined);
    if (withBore) {
      expect(withBore.detectedAttributes.widthMm).toBeDefined();
      expect(withBore.detectedAttributes.strokeMm).toBeUndefined();
    }
  });

  it('returns single exact suggestion for suffixed code 6003-2RS', () => {
    const suggestions = suggestProducts('6003-2RS');
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.exampleCodeFormat).toBe('6003-2RS');
    expect(suggestions[0]?.productTypeTr).toBe('Bilyalı rulman');
  });

  it('identifies 6003 as rolling bearing', () => {
    const id = identifyProduct('6003', normalizeCode('6003'));
    expect(id.resolverCategoryKey).toBe('rolling_bearing');
    expect(id.productType.value).toBe('Bilyalı rulman');
  });
});
