import { findEquivalents } from '../findEquivalents';
import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';

describe('findEquivalents', () => {
  it('returns SMC CP96 as equivalent for DSBC-50-100-PPVA-N3', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const normalized = normalizeCode(input);
    const source = identifyProduct(input, normalized);
    const equivalents = findEquivalents(source);

    expect(equivalents.length).toBeGreaterThan(0);

    const cp96 = equivalents.find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();
    expect(cp96?.brand).toBe('SMC');
    expect(equivalents.every((e) => e.seriesId !== source.seriesId)).toBe(true);
    expect(equivalents.every((e) => e.series !== 'DSBC')).toBe(true);
    expect(cp96?.suggestedCode).toBe('CP96SDB50-100C');
  });
});
