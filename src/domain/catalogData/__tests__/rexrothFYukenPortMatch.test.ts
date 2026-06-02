import {
  buildProductResolverContext,
  portStatesMatch,
  resolveSpoolCandidate,
  toCatalogResolverContext,
} from '@/domain/catalogData';

describe('Rexroth F vs Yuken DSG port states', () => {
  const product = buildProductResolverContext('4WE6F-62/EG24N9K4')!;

  it('reports port match against candidate Yuken tokens', () => {
    const f = resolveSpoolCandidate(toCatalogResolverContext(product, 'spool_symbol', 'F'));
    const tokens = ['3C2', '3C3', '3C4', '3C9', '3C12', '3C60', '3C40'];
    for (const token of tokens) {
      const y = resolveSpoolCandidate(
        toCatalogResolverContext(
          buildProductResolverContext('DSG-01-3C2-D24-N1-70')!,
          'spool_symbol',
          token
        )
      );
      const match = portStatesMatch(f.portState, y.portState);
      if (match) {
        // eslint-disable-next-line no-console
        console.log('MATCH', token, y.portState);
      }
    }
    expect(f.found).toBe(true);
  });
});
