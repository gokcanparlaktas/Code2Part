import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { extractPneumaticAttributes } from '@/domain/attributes/extractors/extractPneumaticAttributes';
import { buildPneumaticCushioningAttribute } from '@/domain/canonical/pneumatic/pneumaticCanonicalAttributes';
import {
  generatePneumaticCodeCandidates,
  getPneumaticComparableOptionCandidates,
  parsePneumaticCylinderRawAttributes,
  resolveComparableOptionCandidate,
  resolveParkerP1DToken,
} from '@/domain/catalogData';

describe('pneumatic catalog-data integration', () => {
  describe('loader', () => {
    it('loads comparable option candidates with context entries', () => {
      const catalog = getPneumaticComparableOptionCandidates();
      expect(catalog.category).toBe('pneumatic_cylinder');
      expect(catalog.entries.some((e) => e.rawToken === 'PPVA' && e.series === 'DSBC')).toBe(
        true
      );
    });
  });

  describe('parsePneumaticCylinderRawAttributes', () => {
    it('DSBC-50-100-PPVA-N3 extracts raw option tokens without canonical output', () => {
      const parsed = parsePneumaticCylinderRawAttributes('DSBC-50-100-PPVA-N3');
      expect(parsed?.brand).toBe('Festo');
      expect(parsed?.series).toBe('DSBC');
      expect(parsed?.boreMm).toBe(50);
      expect(parsed?.strokeMm).toBe(100);
      expect(parsed?.fields.some((f) => f.rawToken === 'PPVA')).toBe(true);
      expect(parsed?.fields.some((f) => f.rawToken === 'N3')).toBe(true);
      expect(parsed?.fields.every((f) => !('canonicalKey' in f))).toBe(true);
    });

    it('CP96SDB50-100C follows official order key: CP96SD + B + 50-100 + C', () => {
      const parsed = parsePneumaticCylinderRawAttributes('CP96SDB50-100C');
      expect(parsed?.brand).toBe('SMC');
      expect(parsed?.series).toBe('CP96');
      expect(parsed?.boreMm).toBe(50);
      expect(parsed?.strokeMm).toBe(100);
      expect(parsed?.matchedPatternId).toBe('SMC:CP96:official_order_key');

      const tokenMap = new Map(
        parsed?.fields
          .filter((f) => f.rawToken)
          .map((f) => [`${f.attributeKey}:${f.position ?? ''}`, f.rawToken as string])
      );
      expect(tokenMap.get('series_model_variant:series_variant_suffix')).toBe('SD');
      expect(tokenMap.get('mounting_style:order_key_mounting')).toBe('B');
      expect(tokenMap.get('magnet_sensor_capability:series_variant_suffix')).toBe('CP96SD');
      expect(tokenMap.get('cushioning:stroke_suffix_cushion')).toBe('C');
    });

    it('CP96KB32-100CW parses non-rotating CP96K line with C cushion and W double rod', () => {
      const parsed = parsePneumaticCylinderRawAttributes('CP96KB32-100CW');
      expect(parsed?.brand).toBe('SMC');
      expect(parsed?.series).toBe('CP96');
      expect(parsed?.boreMm).toBe(32);
      expect(parsed?.strokeMm).toBe(100);

      const tokenMap = new Map(
        parsed?.fields
          .filter((f) => f.rawToken)
          .map((f) => [f.attributeKey, f.rawToken as string])
      );
      expect(tokenMap.get('series_family_line')).toBe('CP96K');
      expect(tokenMap.get('series_model_variant')).toBe('K');
      expect(tokenMap.get('rod_non_rotating')).toBe('CP96K');
      expect(tokenMap.get('mounting_style')).toBe('B');
      expect(tokenMap.get('cushioning')).toBe('C');
      expect(tokenMap.get('rod_configuration')).toBe('W');
    });

    it('Camozzi 63MP2C050A0200 parses series 63 with M/P/2/C tokens and dimensions', () => {
      const parsed = parsePneumaticCylinderRawAttributes('63MP2C050A0200');
      expect(parsed?.brand).toBe('Camozzi');
      expect(parsed?.series).toBe('63');
      expect(parsed?.boreMm).toBe(50);
      expect(parsed?.strokeMm).toBe(200);

      const tokenMap = new Map(
        parsed?.fields
          .filter((f) => f.rawToken)
          .map((f) => [f.attributeKey, f.rawToken as string])
      );
      expect(tokenMap.get('version_token')).toBe('M');
      expect(tokenMap.get('construction_token')).toBe('P');
      expect(tokenMap.get('operation_token')).toBe('2');
      expect(tokenMap.get('cushioning_token')).toBe('C');
      expect(tokenMap.get('constructive_type_token')).toBe('A');
    });
  });

  describe('resolveComparableOptionCandidate', () => {
    it('resolves Festo DSBC PPVA as cushioning candidate', () => {
      const resolved = resolveComparableOptionCandidate({
        brand: 'Festo',
        series: 'DSBC',
        attributeKey: 'cushioning',
        rawToken: 'PPVA',
      });
      expect(resolved.found).toBe(true);
      expect(resolved.candidateMeaning).toContain('pneumatic cushioning');
      expect(resolved.needsReview).toBe(true);
    });

    it('resolves SMC CP96 C as cushioning candidate at stroke suffix position', () => {
      const resolved = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'CP96',
        attributeKey: 'cushioning',
        rawToken: 'C',
        tokenPosition: 'stroke_suffix_cushion',
      });
      expect(resolved.found).toBe(true);
      expect(resolved.candidateMeaning).toMatch(/air cushion/i);
    });

    it('CP96 D at mounting position is double clevis, not auto-switch magnet', () => {
      const mountingD = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'CP96',
        attributeKey: 'mounting_style',
        rawToken: 'D',
        tokenPosition: 'order_key_mounting',
      });
      const seriesSd = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'CP96',
        attributeKey: 'series_model_variant',
        rawToken: 'SD',
        tokenPosition: 'series_variant_suffix',
      });
      const cq2 = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'CQ2',
        attributeKey: 'action',
        rawToken: 'D',
      });
      expect(mountingD.found).toBe(true);
      expect(mountingD.candidateMeaning).toContain('Double clevis');
      expect(seriesSd.found).toBe(true);
      expect(seriesSd.candidateMeaning).toContain('auto switch');
      expect(cq2.found).toBe(true);
      expect(cq2.candidateMeaning).toContain('double acting');
    });

    it('Parker N is position-sensitive and must not use global N lookup', () => {
      const rodEnd = resolveParkerP1DToken('N', 'piston_rod_end_or_rod_mounting');
      expect(rodEnd.found).toBe(true);

      const wrongContext = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'C85',
        attributeKey: 'head_cover_or_mounting_style',
        rawToken: 'N',
      });
      const parkerWrong = resolveComparableOptionCandidate({
        brand: 'Parker',
        series: 'P1D',
        attributeKey: 'mounting_style',
        rawToken: 'N',
      });
      expect(wrongContext.found).toBe(true);
      expect(wrongContext.candidateMeaning).toContain('clevis');
      expect(parkerWrong.found).toBe(false);
    });

    it('Festo PPVA and SMC C are different raw tokens but both cushioning candidates', () => {
      const festo = resolveComparableOptionCandidate({
        brand: 'Festo',
        series: 'DSBC',
        attributeKey: 'cushioning',
        rawToken: 'PPVA',
      });
      const smc = resolveComparableOptionCandidate({
        brand: 'SMC',
        series: 'CP96',
        attributeKey: 'cushioning',
        rawToken: 'C',
      });
      expect(festo.rawToken).not.toBe(smc.rawToken);
      expect(festo.comparisonAttributeKey).toBe('cushioning');
      expect(smc.comparisonAttributeKey).toBe('cushioning');
      expect(festo.found && smc.found).toBe(true);
    });
  });

  describe('extractor bridge', () => {
    it('DSBC-50-100-PPVA-N3 resolves PPVA cushioning candidate in profile layer', () => {
      const code = 'DSBC-50-100-PPVA-N3';
      const id = identifyProduct(code, normalizeCode(code));
      const attrs = extractPneumaticAttributes({ inputCode: code, seriesId: id.seriesId });
      const cushioning = attrs.find((a) => a.key === 'cushioning_type');
      expect(cushioning?.value).toBe('PPVA');

      const profileAttr = buildPneumaticCushioningAttribute({
        rawToken: String(cushioning?.value),
        manufacturer: 'Festo',
        series: 'DSBC',
      });
      expect(profileAttr.canonicalKey).toBe('ADJUSTABLE_PNEUMATIC_CUSHIONING');
      expect(profileAttr.requiresCatalogCheck).toBe(true);
    });
  });

  describe('code generation candidates', () => {
    it('returns review-required catalog templates without replacing app-current shapes', () => {
      const festo = generatePneumaticCodeCandidates({
        brand: 'Festo',
        series: 'DSBC',
        boreMm: 50,
        strokeMm: 100,
        cushioningToken: 'PPVA',
      });
      expect(festo.some((c) => c.code === 'DSBC-50-100-PPVA-N3')).toBe(true);
      expect(festo.every((c) => c.needsReview)).toBe(true);

      const parker = generatePneumaticCodeCandidates({
        brand: 'Parker',
        series: 'P1D',
        boreMm: 50,
        strokeMm: 100,
      });
      expect(parker.some((c) => c.code.includes('P1D-S050MS-0100'))).toBe(true);
      expect(parker.some((c) => c.code.includes('P1D-B050MC-0100'))).toBe(true);
    });
  });

  describe('regression: existing pneumatic identification', () => {
    it.each([
      ['DSBC-50-100-PPVA-N3', 'Festo', 'DSBC', 50, 100],
      ['CP96-50-100', 'SMC', 'CP96', 50, 100],
      ['CP96SDB50-100', 'SMC', 'CP96', 50, 100],
      ['P1D-S050MS-0100', 'Parker', 'P1D', 50, 100],
      ['DSNU-25-80-P-A', 'Festo', 'DSNU', 25, 80],
      ['SI50X100', 'AirTAC', 'SI', 50, 100],
      ['CQ2B32-50D', 'SMC', 'CQ2', 32, 50],
      ['C85N25-80', 'SMC', 'C85', 25, 80],
    ])('identifies %s', (code, brand, series, bore, stroke) => {
      const id = identifyProduct(code, normalizeCode(code));
      expect(id.brand.value).toBe(brand);
      expect(id.series.value).toBe(series);
      expect(id.bore.value).toBe(bore);
      expect(id.stroke.value).toBe(stroke);
    });
  });
});
