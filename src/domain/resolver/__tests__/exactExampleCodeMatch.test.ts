import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { suggestProducts } from '@/domain/resolver/suggestProducts';

describe('exactExampleCodeMatch identification', () => {
  it('promotes exact hydraulic example to identified result, not unresolved', () => {
    const code = 'DG4V-3-2A-M-U-H7-60';
    const identification = identifyProduct(code, normalizeCode(code));
    expect(identification.outcome).toBe('full');

    const suggestions = suggestProducts(code);
    const sameExample = suggestions.find((s) => s.exampleCodeFormat === code);
    if (sameExample) {
      expect(sameExample.missingFields).not.toContain('stroke');
      expect(sameExample.missingFields).not.toContain('options');
    }
  });
});
