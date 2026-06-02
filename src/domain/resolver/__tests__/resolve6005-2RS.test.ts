import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { suggestProducts } from '@/domain/resolver/suggestProducts';

describe('6005-2RS product search', () => {
  const code = '6005-2rs';

  it('identifies as full with equivalents', () => {
    const normalized = normalizeCode(code);
    const id = identifyProduct(code, normalized);
    expect(id.outcome).toBe('full');

    const resolved = resolveProductSearch(code);
    expect(resolved.identification.outcome).toBe('full');
    expect(resolved.hasEquivalents).toBe(true);
    expect(resolved.compatibilityResults.length).toBeGreaterThan(0);
  });

  it('does not suggest exact match when identification is not full', () => {
    const suggestions = suggestProducts(code);
    const exact = suggestions.filter((s) => s.matchedBy === 'exact_match');
    expect(exact.length).toBeLessThanOrEqual(1);
    if (exact.length === 1) {
      expect(identifyProduct(code, normalizeCode(code)).outcome).toBe('full');
    }
  });
});
