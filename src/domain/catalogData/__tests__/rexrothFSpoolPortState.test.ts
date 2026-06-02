import {
  buildProductResolverContext,
  resolveSpoolCandidate,
  toCatalogResolverContext,
} from '@/domain/catalogData';

describe('Rexroth F spool port state', () => {
  it('resolves F @ WE6 from catalog', () => {
    const product = buildProductResolverContext('4WE6F-62/EG24N9K4')!;
    const result = resolveSpoolCandidate(
      toCatalogResolverContext(product, 'spool_symbol', 'F')
    );
    expect(result.found).toBe(true);
    expect(result.portState).toEqual({
      P: 'connected_to_A_T',
      T: 'connected_to_P_A',
      A: 'connected_to_P_T',
      B: 'blocked',
    });
  });
});
