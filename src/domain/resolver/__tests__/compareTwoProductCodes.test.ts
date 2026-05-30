import { compareTwoProductCodes, CompareTwoProductCodesError } from '../compareTwoProductCodes';

describe('compareTwoProductCodes', () => {
  it('compares two fully identified pneumatic cylinder codes', () => {
    const result = compareTwoProductCodes('DSBC-63-200-PPVA', 'C96-40-80');

    expect(result.candidate.series).toBe('C96');
    expect(result.compatible.length + result.different.length + result.checkItems.length).toBeGreaterThan(
      0
    );
    expect(result.summary.summaryTr.length).toBeGreaterThan(0);
  });

  it('throws when source code cannot be fully identified', () => {
    expect(() => compareTwoProductCodes('DSBC', 'C96-40-80')).toThrow(CompareTwoProductCodesError);
  });

  it('marks different bore and stroke in uyumsuz for mismatched sizes', () => {
    const result = compareTwoProductCodes('DSBC-63-200-PPVA', 'C96-40-80');

    expect(result.different.some((item) => item.label === 'Çap (bore)')).toBe(true);
    expect(result.different.some((item) => item.label === 'Strok')).toBe(true);
    expect(result.checkItems.some((item) => item.field === 'Çap (bore)')).toBe(false);
    expect(result.checkItems.some((item) => item.field === 'Strok')).toBe(false);
  });
});
