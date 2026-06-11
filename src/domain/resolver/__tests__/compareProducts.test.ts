import { compareProducts, resolveResolverCategory } from '../compareProducts';
import { findEquivalents } from '../findEquivalents';
import { identifyProduct, getProductSeriesById } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

describe('compareProducts', () => {
  it('routes pneumatic_cylinder products to pneumatic cylinder comparison rules', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const normalized = normalizeCode(input);
    const source = identifyProduct(input, normalized);

    expect(resolveResolverCategory(source)).toBe('pneumatic_cylinder');
    expect(source.resolverCategoryKey).toBe('pneumatic_cylinder');
  });

  it('returns generic comparison warning for unsupported resolver category', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const normalized = normalizeCode(input);
    const source = identifyProduct(input, normalized);
    const equivalents = findEquivalents(source);
    const cp96 = equivalents.find((e) => e.series === 'CP96');

    expect(cp96).toBeDefined();

    const unsupportedSource = {
      ...source,
      resolverCategoryKey: 'pneumatic_valve' as const,
    };

    const result = compareProducts(unsupportedSource, cp96!);

    expect(result.warnings).toContain(
      'Bu ürün kategorisi için detaylı karşılaştırma kuralları henüz eklenmemiştir.'
    );
  });

  it('compares DSBC-50-100-PPVA-N3 with SMC CP96 equivalent', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const normalized = normalizeCode(input);
    const source = identifyProduct(input, normalized);
    const equivalents = findEquivalents(source);
    const cp96 = equivalents.find((e) => e.series === 'CP96');

    expect(cp96).toBeDefined();

    const result = compareProducts(source, cp96!);
    const compatibleLabels = result.compatible.map((c) => c.label);
    const checkFields = result.checkItems.map((c) => c.field);

    expect(compatibleLabels).toContain('Ürün kategorisi');
    expect(compatibleLabels).toContain('Çap (bore)');
    expect(compatibleLabels).toContain('Strok');
    expect(compatibleLabels).toContain('Standart ailesi');

    expect(checkFields).toContain('Mil ucu / diş');
    expect(checkFields).toContain('Port ölçüsü');
    expect(checkFields).toContain('Sensör uyumu');
    expect(checkFields).toContain('Sönümleme seçeneği');
    expect(checkFields).toContain('Montaj aksesuarları');
    expect(checkFields).toContain('Üretici / seri farkı');
  });

  it('marks stroke different when stroke differs (pneumatic)', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const source = identifyProduct(input, normalizeCode(input));
    const equivalents = findEquivalents(source);
    const cp96 = equivalents.find((e) => e.series === 'CP96');
    expect(cp96?.suggestedCode).toBe('CP96SDB50-100C');

    const targetCode = 'CP96-50-80';
    const candidate = {
      ...cp96!,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Strok')).toBe(true);
  });

  it('puts unknown cushioning into unknown/check, not compatible (pneumatic)', () => {
    const input = 'DSBC-50-100';
    const source = identifyProduct(input, normalizeCode(input));
    const equivalents = findEquivalents(source);
    const cp96 = equivalents.find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const result = compareProducts(source, cp96!);
    expect(result.compatible.some((c) => c.label === 'Sönümleme tipi')).toBe(false);
    expect(result.checkItems.some((c) => c.field === 'Sönümleme tipi')).toBe(true);
  });

  it('treats cross-category products as not compatible', () => {
    const sourceCode = '4WE6E-6X/EG24N9K4';
    const source = identifyProduct(sourceCode, normalizeCode(sourceCode));

    const targetCode = 'DSBC-50-100-PPVA-N3';
    const target = identifyProduct(targetCode, normalizeCode(targetCode));

    const candidate = {
      seriesId: 'festo_dsbc',
      brand: 'Festo',
      series: 'DSBC',
      productType: 'Pnömatik silindir',
      productCategory: 'Pneumatic cylinder',
      standardFamily: 'ISO 15552',
      suggestedCode: targetCode,
      targetIdentification: target,
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Ürün kategorisi')).toBe(true);
    expect(result.warnings.join(' ')).toContain('Ürün kategorisi farklı');
  });
});

describe('compareProducts scoring (pneumatic profile)', () => {
  it('DSBC-50-100-PPVA-N3 vs CP96-50-100 returns score > 0', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const source = identifyProduct(input, normalizeCode(input));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const match = calculateMatchPercentage(compareProducts(source, cp96!));
    expect(match.percentage).toBeGreaterThan(0);
  });

  it('same ISO + same bore + same stroke returns medium/high score', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const source = identifyProduct(input, normalizeCode(input));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const match = calculateMatchPercentage(compareProducts(source, cp96!));
    expect(['medium', 'high']).toContain(match.level);
  });

  it('different stroke reduces score compared with same stroke', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const source = identifyProduct(input, normalizeCode(input));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const sameStroke = calculateMatchPercentage(compareProducts(source, cp96!)).percentage;
    const differentStroke = calculateMatchPercentage(
      compareProducts(source, {
        ...cp96!,
        suggestedCode: 'CP96-50-80',
        targetIdentification: identifyProduct('CP96-50-80', normalizeCode('CP96-50-80')),
      })
    ).percentage;

    expect(differentStroke).toBeLessThan(sameStroke);
  });

  it('unknown cushioning reduces score but does not force 0', () => {
    const source = identifyProduct('DSBC-50-100', normalizeCode('DSBC-50-100'));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const match = calculateMatchPercentage(compareProducts(source, cp96!));
    expect(match.percentage).toBeGreaterThan(0);
    expect(match.percentage).toBeLessThan(100);
  });

  it('cross-category stays 0 or very low', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const target = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const candidate = {
      seriesId: 'festo_dsbc',
      brand: 'Festo',
      series: 'DSBC',
      productType: 'Pnömatik silindir',
      productCategory: 'Pneumatic cylinder',
      standardFamily: 'ISO 15552',
      suggestedCode: 'DSBC-50-100-PPVA-N3',
      targetIdentification: target,
    };

    expect(calculateMatchPercentage(compareProducts(source, candidate)).percentage).toBeLessThanOrEqual(
      10
    );
  });

  it('100% impossible when unknown/check exists', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const source = identifyProduct(input, normalizeCode(input));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    expect(calculateMatchPercentage(compareProducts(source, cp96!)).percentage).toBeLessThan(100);
  });
});

describe('compareProducts scoring (hydraulic profile)', () => {
  it('Rexroth vs Yuken with same NG/voltage returns score > 0', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D24-N1-50';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    };

    expect(calculateMatchPercentage(compareProducts(source, candidate)).percentage).toBeGreaterThan(0);
  });

  it('NG6 vs NG10 returns low score', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const ng10Series = getProductSeriesById('rexroth_4we10')!;
    const targetCode = '4WE10E-3X/CG24N9K4';
    const candidate = {
      seriesId: ng10Series.id,
      brand: ng10Series.brand,
      series: ng10Series.series,
      productType: ng10Series.productType,
      productCategory: ng10Series.productCategory,
      standardFamily: ng10Series.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    };

    expect(calculateMatchPercentage(compareProducts(source, candidate)).level).toBe('low');
  });

  it('unknown H7 voltage reduces score but does not force 0 when NG matches', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const targetSeries = getProductSeriesById('vickers_dg4v3')!;
    const targetCode = 'DG4V-3-2A-M-U-H7-60';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    };

    const match = calculateMatchPercentage(compareProducts(source, candidate));
    expect(match.percentage).toBeGreaterThan(0);
    expect(match.percentage).toBeLessThan(100);
  });
});
