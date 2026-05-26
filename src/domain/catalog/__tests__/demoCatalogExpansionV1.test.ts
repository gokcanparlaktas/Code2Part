import { assertCatalogV2Valid, validateCatalogV2 } from '@/domain/catalog/validateCatalogV2';
import { getCatalogSeriesById } from '@/domain/catalog/adapters/catalogV2Adapter';
import { calculateSuggestionMatchPercentage } from '@/domain/scoring/calculateSuggestionMatchPercentage';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

describe('demo catalog expansion v1', () => {
  it('catalog v2 validates after demo enrichment', () => {
    const result = validateCatalogV2();
    expect(result.isValid).toBe(true);
    expect(() => assertCatalogV2Valid()).not.toThrow();
  });

  describe('hydraulic exact examples (sample)', () => {
    it.each([
      ['4WE6G-6X/EG24N9K4', 'Rexroth', '4WE6'],
      ['4WE10J-3X/CG24N9K4', 'Rexroth', '4WE10'],
      ['DSG-03-3C12-D24-N1-50', 'Yuken', 'DSG-03'],
      ['DG4V-3-2A-M-U-D24-60', 'Vickers', 'DG4V-3'],
      ['D1VW020BNJW', 'Parker', 'D1VW'],
      ['DHI-0713-X 24DC', 'Atos', 'DHI'],
    ])('identifies %s as %s %s with full outcome', (code, brand, series) => {
      const id = identify(code);
      expect(id.resolverCategoryKey).toBe('hydraulic_valve');
      expect(id.outcome).toBe('full');
      expect(id.confidence).toBe('high');
      expect(id.brand.value).toBe(brand);
      expect(id.series.value).toBe(series);
    });

    it('H7 example still does not confirm 24V DC voltage attribute', () => {
      const code = 'DG4V-5-6B-M-U-H7-60';
      const id = identify(code);
      expect(id.outcome).toBe('full');
      expect(id.series.value).toBe('DG4V-5');
    });
  });

  describe('pneumatic exact examples (sample)', () => {
    it.each([
      ['DSBC-63-200-PPVA', 'Festo', 'DSBC', 63, 200],
      ['ADN-40-100', 'Festo', 'ADN', 40, 100],
      ['CP96SDB32-80', 'SMC', 'CP96', 32, 80],
      ['C96-40-80', 'SMC', 'C96', 40, 80],
      ['PRA-63-150', 'Aventics', 'PRA', 63, 150],
      ['SI-63-150', 'AirTAC', 'SI', 63, 150],
    ])(
      'identifies %s with bore/stroke',
      (code, brand, series, bore, stroke) => {
        const id = identify(code);
        expect(id.resolverCategoryKey).toBe('pneumatic_cylinder');
        expect(id.outcome).toBe('full');
        expect(id.brand.value).toBe(brand);
        expect(id.series.value).toBe(series);
        expect(id.bore.value).toBe(bore);
        expect(id.stroke.value).toBe(stroke);
      }
    );
  });

  describe('search and safety', () => {
    it('partial hydraulic query stays below 100% against full examples', () => {
      const query = '4WE6';
      const series = getCatalogSeriesById('rexroth_4we6');
      for (const example of series?.exampleCodes ?? []) {
        const match = calculateSuggestionMatchPercentage(query, example);
        expect(match.percentage).toBeLessThan(100);
      }
    });

    it('enriched series include demo search aliases and extra check rules', () => {
      const rexroth = getCatalogSeriesById('rexroth_4we6');
      expect(rexroth?.searchAliases).toEqual(
        expect.arrayContaining(['rexroth ng6', '4WE 6'])
      );
      expect(rexroth?.checkRuleRefs).toEqual(
        expect.arrayContaining([{ ruleId: 'hydraulic_mounting_cetop' }])
      );

      const dsbc = getCatalogSeriesById('festo_dsbc');
      expect(dsbc?.searchAliases).toEqual(
        expect.arrayContaining(['festo dsbc', 'iso 15552 cylinder'])
      );
      expect(dsbc?.checkRuleRefs).toEqual(
        expect.arrayContaining([{ ruleId: 'pneumatic_seal_material' }])
      );
      expect(dsbc?.exampleCodes.length).toBeGreaterThanOrEqual(5);
    });
  });
});
