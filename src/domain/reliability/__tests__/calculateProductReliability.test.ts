import { calculateProductReliability } from '@/domain/reliability/calculateProductReliability';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('calculateProductReliability', () => {
  it('hydraulic valve is not penalized for missing bore/stroke', () => {
    const code = '4WE6J-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const reliability = calculateProductReliability(id);

    expect(id.resolverCategoryKey).toBe('hydraulic_valve');
    expect(id.bore.value).toBeNull();
    expect(id.stroke.value).toBeNull();
    expect(reliability.confidence).not.toBe('low');
    expect(reliability.isLowConfidence).toBe(false);
  });

  it('hydraulic valve reliability uses CETOP/NG and series', () => {
    const code = '4WE6J-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const reliability = calculateProductReliability(id);

    expect(id.series.value).toBe('4WE6');
    expect(id.cetopNgSize?.value).toContain('NG6');
    expect(reliability.confidence).toBe('high');
  });

  it('pneumatic cylinder still uses pneumatic confidence behavior', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const reliability = calculateProductReliability(id);

    expect(id.resolverCategoryKey).toBe('pneumatic_cylinder');
    expect(id.bore.value).toBe(50);
    expect(id.stroke.value).toBe(100);
    expect(reliability.confidence).toBe('high');
  });

  it('unsupported category returns generic cautious reliability', () => {
    const code = 'UNKNOWN';
    const id = identifyProduct(code, normalizeCode(code));
    const reliability = calculateProductReliability(id);
    expect(reliability.confidence).toBe('unknown');
    expect(reliability.isLowConfidence).toBe(true);
  });

  it('clear hydraulic series should not show low-confidence warning wording', () => {
    const code = '4WE6J-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const reliability = calculateProductReliability(id);
    expect(reliability.isLowConfidence).toBe(false);
    expect(reliability.warningTitleTr).toBeUndefined();
  });
});

