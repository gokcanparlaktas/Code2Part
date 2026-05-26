import { getCatalogVoltageCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { validateCatalogV2 } from '@/domain/catalog/validateCatalogV2';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('validateCatalogV2', () => {
  it('validates v2 catalog without errors', () => {
    const result = validateCatalogV2();
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.productSeriesCount).toBe(20);
    expect(result.summary.functionMappingsCount).toBeGreaterThan(0);
    expect(result.summary.checkRulesCount).toBeGreaterThan(0);
  });

  it('does not map H7 voltage code to 24V DC', () => {
    const vickers = getCatalogVoltageCodes('vickers_dg4v3');
    const h7 = vickers.find((v) => v.code === 'H7');
    expect(h7).toBeDefined();
    expect(h7?.labelTr).toBeUndefined();
    expect(h7?.requiresCatalogCheck).toBe(true);
    expect(h7?.labelTr ?? '').not.toMatch(/24\s*V/i);
  });
});

describe('catalog v2 identification compatibility', () => {
  it('identifies DG4V-3-2A-M-U-H7-60 as hydraulic full match', () => {
    const code = 'DG4V-3-2A-M-U-H7-60';
    const id = identifyProduct(code, normalizeCode(code));
    expect(id.resolverCategoryKey).toBe('hydraulic_valve');
    expect(id.outcome).toBe('full');
    expect(id.series.value).toBe('DG4V-3');
  });

  it('identifies compact spaced DG4V example', () => {
    const id = identifyProduct('dg4v 3 2a m u h7 60', normalizeCode('dg4v 3 2a m u h7 60'));
    expect(id.outcome).toBe('full');
    expect(id.series.value).toBe('DG4V-3');
  });

  it('identifies pneumatic DSBC example', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    expect(id.resolverCategoryKey).toBe('pneumatic_cylinder');
    expect(id.outcome).toBe('full');
    expect(id.bore.value).toBe(50);
    expect(id.stroke.value).toBe(100);
  });
});
