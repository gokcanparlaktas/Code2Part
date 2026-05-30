import { extractHydraulicEquivalentTokens } from '@/domain/categories/hydraulicValve/extractHydraulicEquivalentTokens';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('extractHydraulicEquivalentTokens', () => {
  it('extracts Rexroth E spool from partial 4WE6E-7X/ header', () => {
    const source = identifyProduct('4WE6E-7X/', normalizeCode('4WE6E-7X/'));

    expect(extractHydraulicEquivalentTokens(source)).toEqual(
      expect.objectContaining({
        spoolSymbol: 'E',
        functionCode: 'E',
        designSeriesFamily: '7X',
      })
    );
  });
});
