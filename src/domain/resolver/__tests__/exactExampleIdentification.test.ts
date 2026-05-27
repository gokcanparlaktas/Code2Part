import { getHydraulicCatalogExampleCodes } from '@/domain/catalog/adapters/catalogV2Adapter';
import { calculateSuggestionMatchPercentage } from '@/domain/scoring/calculateSuggestionMatchPercentage';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { suggestProducts } from '@/domain/resolver/suggestProducts';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

describe('exact example identification (catalog v2)', () => {
  describe('hydraulic full identification', () => {
    it.each([
      ['4WE6E-6X/EG24N9K4', 'Rexroth', '4WE6'],
      ['DG4V-3-2A-M-U-H7-60', 'Vickers', 'DG4V-3'],
      ['DSG-01-3C2-D24-N1-50', 'Yuken', 'DSG-01'],
      ['DHI-0711-X 24DC', 'Atos', 'DHI'],
    ])('identifies %s as %s %s', (code, brand, series) => {
      const id = identify(code);
      expect(id.resolverCategoryKey).toBe('hydraulic_valve');
      expect(id.outcome).toBe('full');
      expect(id.brand.value).toBe(brand);
      expect(id.series.value).toBe(series);
      expect(id.confidence).toBe('high');
    });

    it('identifies compact/spaced hydraulic example', () => {
      const id = identify('dg4v 3 2a m u h7 60');
      expect(id.outcome).toBe('full');
      expect(id.series.value).toBe('DG4V-3');
    });

    it('returns 100% suggestion score only for exact compact match', () => {
      const code = 'DG4V-3-2A-M-U-H7-60';
      const exact = calculateSuggestionMatchPercentage(code, code);
      expect(exact.percentage).toBe(100);

      const partial = calculateSuggestionMatchPercentage('DG4V-3', code);
      expect(partial.percentage).toBeLessThan(100);
    });
  });

  describe('hydraulic partial series queries', () => {
    it.each(['4WE6', 'DG4V-3', 'DSG 01'])('does not fully identify partial query "%s"', (query) => {
      const id = identify(query);
      expect(id.resolverCategoryKey).toBe('hydraulic_valve');
      expect(id.outcome).not.toBe('full');
      expect(id.confidence).not.toBe('high');
    });

    it('partial hydraulic prefix against full catalog examples is not 100%', () => {
      const query = '4WE6';
      const fullExamples = getHydraulicCatalogExampleCodes();
      for (const example of fullExamples) {
        if (!example.startsWith('4WE6')) {
          continue;
        }
        const match = calculateSuggestionMatchPercentage(query, example);
        expect(match.percentage).toBeLessThan(100);
      }
    });
  });

  describe('pneumatic full identification', () => {
    it.each([
      ['DSBC-50-100-PPVA-N3', 'Festo', 'DSBC', 50, 100],
      ['CP96-50-100', 'SMC', 'CP96', 50, 100],
      ['CP96SDB50-100', 'SMC', 'CP96', 50, 100],
      ['P1D-S050MS-0100', 'Parker', 'P1D', 50, 100],
      ['DSNU-25-80-P-A', 'Festo', 'DSNU', 25, 80],
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

    it('identifies compact pneumatic example cp96 50 100', () => {
      const id = identify('cp96 50 100');
      expect(id.outcome).toBe('full');
      expect(id.series.value).toBe('CP96');
      expect(suggestProducts('cp96 50 100')[0]?.matchedBy).toBe('exact_match');
    });

    it('exact pneumatic code yields 100% match score', () => {
      const code = 'DSBC-50-100-PPVA-N3';
      expect(calculateSuggestionMatchPercentage(code, code).percentage).toBe(100);
      expect(calculateSuggestionMatchPercentage('50 N3', code).percentage).toBeLessThan(100);
    });
  });
});
