import { normalizeCode } from '../normalizeCode';

describe('normalizeCode', () => {
  it('trims leading and trailing spaces', () => {
    expect(normalizeCode(' dsbc-50-100-ppva-n3 ')).toBe('DSBC-50-100-PPVA-N3');
  });

  it('converts to uppercase', () => {
    expect(normalizeCode('cp96-50-100')).toBe('CP96-50-100');
  });

  it('removes internal spaces', () => {
    expect(normalizeCode(' cp96 50 100 ')).toBe('CP9650100');
  });

  it('replaces underscores with dashes', () => {
    expect(normalizeCode('dsbc_50_100')).toBe('DSBC-50-100');
  });

  it('keeps dashes in product codes', () => {
    expect(normalizeCode('DSBC-50-100-PPVA-N3')).toBe('DSBC-50-100-PPVA-N3');
  });
});
