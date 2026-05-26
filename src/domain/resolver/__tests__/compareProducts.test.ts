import { compareProducts, resolveResolverCategory } from '../compareProducts';
import { findEquivalents } from '../findEquivalents';
import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';

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
    expect(cp96?.suggestedCode).toBe('CP96-50-100');

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
