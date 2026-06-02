import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

import { parseRollingBearingCode } from '../parseRollingBearingCode';
import { splitBearingDesignation } from '../splitBearingDesignation';

describe('splitBearingDesignation', () => {
  it('splits compact 60052RS into 6005 + 2RS', () => {
    const split = splitBearingDesignation('60052RS');
    expect(split.baseCode).toBe('6005');
    expect(split.suffixTokens).toEqual(['2RS']);
  });

  it('splits separated 6005-2RS', () => {
    const split = splitBearingDesignation('6005-2RS');
    expect(split.baseCode).toBe('6005');
    expect(split.suffixBlock).toBe('2RS');
  });

  it('splits compact 6308ZZ', () => {
    const split = splitBearingDesignation('6308ZZ');
    expect(split.baseCode).toBe('6308');
    expect(split.suffixTokens).toEqual(['ZZ']);
  });
});

describe('compact bearing codes', () => {
  it('parses 60052rs as 6005 with dimensions', () => {
    const profile = parseRollingBearingCode('60052rs');
    expect(profile.baseCode).toBe('6005');
    expect(profile.suffixResolutions.map((s) => s.rawToken)).toContain('2RS');
    expect(profile.dimensions.status).toBe('complete');
    expect(profile.series?.bearingTypeNameTr).toBe('Bilyalı rulman');
  });

  it('identifies 60052RS same as 6005-2RS', () => {
    const compact = identifyProduct('60052RS', normalizeCode('60052RS'));
    const separated = identifyProduct('6005-2RS', normalizeCode('6005-2RS'));

    expect(compact.outcome).toBe('full');
    expect(separated.outcome).toBe('full');
    expect(compact.series.value).toBe('6005');
    expect(separated.series.value).toBe('6005');
    expect(compact.bore.value).toBe(25);
    expect(compact.outsideDiameter?.value).toBe(47);
  });
});
