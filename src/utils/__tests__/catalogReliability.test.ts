import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import {
  isEquivalenceMappingUnverified,
  isSeriesDataUnverified,
} from '../catalogReliability';

describe('catalogReliability', () => {
  it('flags MVP product series as unverified', () => {
    const identification = identifyProduct(
      'DSBC-50-100-PPVA-N3',
      normalizeCode('DSBC-50-100-PPVA-N3')
    );

    expect(isSeriesDataUnverified(identification.seriesId)).toBe(true);
    expect(isEquivalenceMappingUnverified(identification.seriesId)).toBe(true);
  });
});
