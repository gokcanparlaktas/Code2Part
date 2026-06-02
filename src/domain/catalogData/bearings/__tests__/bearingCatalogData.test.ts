import {
  extractBearingBaseCode,
  getRollingBearingBrandDetectionCatalog,
  getRollingBearingBoreCodeCatalog,
  getRollingBearingDimensionCatalog,
  getRollingBearingFamilyIndexCatalog,
  getRollingBearingGenerationSpecCatalog,
  getRollingBearingManufacturerIndexCatalog,
  getRollingBearingParserSpecCatalog,
  getRollingBearingSeriesCatalog,
  resolveBearingDimensionByBaseCode,
  resolveBearingDimensionFromCode,
  resolveBoreCodeCandidate,
} from '@/domain/catalogData';
import { resetBearingDimensionIndexForTests } from '@/domain/catalogData/bearings/bearingDimensionIndex';

describe('bearing catalog-data integration', () => {
  beforeEach(() => {
    resetBearingDimensionIndexForTests();
  });

  describe('read-only loaders', () => {
    it('loads rolling-bearing family index with 6000/20000/30000 families', () => {
      const index = getRollingBearingFamilyIndexCatalog();
      expect(index.category).toBe('bearing');
      expect(index.families.map((f) => f.seriesFamily)).toEqual(
        expect.arrayContaining(['6000', '20000', '30000'])
      );
    });

    it('loads brand detection catalog with ambiguous ZZ token', () => {
      const brand = getRollingBearingBrandDetectionCatalog();
      expect(brand.ambiguousCommonSuffixes.some((e) => e.rawToken === 'ZZ')).toBe(true);
    });

    it('loads manufacturer index with SKF and Schaeffler aliases', () => {
      const index = getRollingBearingManufacturerIndexCatalog();
      const skf = index.manufacturers.find((m) => m.manufacturer === 'SKF');
      expect(skf?.brandAliases).toContain('SKF');
      const schaeffler = index.manufacturers.find((m) => m.manufacturer === 'Schaeffler');
      expect(schaeffler?.brandAliases).toEqual(expect.arrayContaining(['FAG', 'INA']));
    });

    it('loads dimension dictionary with starter rows', () => {
      const catalog = getRollingBearingDimensionCatalog();
      expect(catalog.dimensionRows.length).toBeGreaterThan(100);
      const row6205 = catalog.dimensionRows.find((r) => r.baseCode === '6205');
      expect(row6205?.boreDiameter.value).toBe(25);
      expect(row6205?.outsideDiameter.value).toBe(52);
      expect(row6205?.width.value).toBe(15);
    });

    it('loads parser and generation prep specs (no app resolver yet)', () => {
      const parser = getRollingBearingParserSpecCatalog();
      const generation = getRollingBearingGenerationSpecCatalog();
      expect(parser.parserSpecStatus).toBe('starter_candidate');
      expect(parser.knownSeriesGroups).toEqual(expect.arrayContaining(['6000', '20000', '30000']));
      expect(generation.status).toBe('starter_candidate');
      expect(generation.generationTemplates?.length).toBeGreaterThan(0);
    });

    it('loads series groups for deep groove and tapered families', () => {
      const series = getRollingBearingSeriesCatalog();
      expect(series.seriesGroups.map((g) => g.seriesGroup)).toEqual(
        expect.arrayContaining(['6000', '20000', '30000'])
      );
    });
  });

  describe('resolveBoreCodeCandidate', () => {
    it('maps fixed bore codes 00–03', () => {
      expect(resolveBoreCodeCandidate('00').displayCandidate).toBe('10 mm');
      expect(resolveBoreCodeCandidate('03').displayCandidate).toBe('17 mm');
    });

    it('maps 05 to 25 mm via starter calculation rule', () => {
      const resolved = resolveBoreCodeCandidate('05');
      expect(resolved.found).toBe(true);
      expect(resolved.displayCandidate).toBe('25 mm');
      expect(resolved.needsReview).toBe(true);
    });
  });

  describe('resolveBearingDimensionCandidate', () => {
    it('looks up 6205 boundary dimensions', () => {
      const resolved = resolveBearingDimensionByBaseCode('6205');
      expect(resolved.found).toBe(true);
      expect(resolved.boreDiameterMm).toBe(25);
      expect(resolved.outsideDiameterMm).toBe(52);
      expect(resolved.widthMm).toBe(15);
      expect(resolved.needsReview).toBe(true);
    });

    it('extracts base code from suffixed designation', () => {
      expect(extractBearingBaseCode('6205-2RS1/C3')).toBe('6205');
      const resolved = resolveBearingDimensionFromCode('6205-2RS1/C3');
      expect(resolved.found).toBe(true);
      expect(resolved.baseCode).toBe('6205');
    });

    it('resolves spherical roller starter row 22205', () => {
      const resolved = resolveBearingDimensionByBaseCode('22205');
      expect(resolved.found).toBe(true);
      expect(resolved.seriesGroup).toBe('22200');
      expect(resolved.boreDiameterMm).toBe(25);
    });
  });

  describe('bore code catalog', () => {
    it('includes 04+ calculation rule with examples', () => {
      const catalog = getRollingBearingBoreCodeCatalog();
      const calcRule = catalog.boreCodeRules.find((r) => r.rawTokenPattern === '04+');
      expect(calcRule?.calculation?.formula).toBe('numericBoreCode * 5');
    });
  });
});
