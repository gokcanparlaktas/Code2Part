import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

describe('hydraulicValveComparison (attribute-based)', () => {
  it('marks voltage compatible when both are known and equal', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(true);
    expect(result.compatible.find((c) => c.label === 'Bobin voltajı')?.sourceDisplay).toContain(
      '24V'
    );
  });

  it('marks connector compatible when both are known and equal', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-6X/EG24N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Konnektör tipi')).toBe(true);
    expect(result.compatible.find((c) => c.label === 'Konnektör tipi')?.sourceDisplay).toBe(
      'DIN EN 175301-803 konnektör'
    );
  });

  it('marks spool/function compatible when both are known and equal', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-6X/EG24N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(true);
    expect(result.compatible.find((c) => c.label === 'Sürgü davranışı')?.sourceDisplay).toMatch(
      /4 yollu, 3 konumlu|3 konumlu/
    );
    expect(result.compatible.find((c) => c.label === 'Sürgü davranışı')?.sourceDisplay).not.toContain(
      'Sürgü sembolü E'
    );
  });

  it('Rexroth E vs Yuken 3C2 is unknownOrCheck with cautious catalog message, not compatible', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    expect(result.different.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    const spoolCheck = result.checkItems.find((c) => c.field === 'Sürgü sembolü / fonksiyon');
    expect(spoolCheck?.reasonTr).toContain('benzer olabilir');
    expect(spoolCheck?.reasonTr).toContain('Katalog sembolüyle doğrulanmalıdır');
    expect([...result.warnings, spoolCheck?.reasonTr ?? ''].join(' ')).not.toMatch(/aynıdır/i);
  });

  it('Rexroth E vs Vickers 2A is unknownOrCheck with cautious message, not compatible', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    const spoolCheck = result.checkItems.find((c) => c.field === 'Sürgü sembolü / fonksiyon');
    expect(spoolCheck?.reasonTr).toContain('katalogdan kontrol edilmelidir');
  });

  it('Rexroth E vs Atos 0711 is unknownOrCheck, not compatible', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('atos_dhi')!;
    const targetCode = 'DHI-0711-X 24DC';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    expect(result.different.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    const spoolCheck = result.checkItems.find((c) => c.field === 'Sürgü sembolü / fonksiyon');
    expect(spoolCheck?.reasonTr).toContain('katalogdan kontrol edilmelidir');
    expect([...result.warnings, spoolCheck?.reasonTr ?? ''].join(' ')).not.toMatch(/aynıdır/i);
  });

  it('Yuken 3C12 vs Rexroth E is different canonical family', () => {
    const source = identify('DSG-01-3C12-D24-N1-50');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-6X/EG24N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Merkez tipi')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
  });

  it('unknown function token leads to unknown/check', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6Z-6X/EG24N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    expect(result.different.some((c) => c.label === 'Sürgü davranışı')).toBe(true);
  });

  it('puts voltage in unknownOrCheck when missing on one side', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-6X/N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(false);
    expect(result.different.some((c) => c.label === 'Bobin voltajı')).toBe(false);
    expect(result.checkItems.some((c) => c.field === 'Bobin voltajı')).toBe(true);
  });

  it('puts voltage in different when both are known but differ', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D110-N1-50';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Bobin voltajı')).toBe(true);
  });

  it('NG6 vs NG10 goes to different', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Montaj standardı')).toBe(true);
  });

  it('CETOP/NG mismatch remains different even if function tokens match', () => {
    const source = identify('4WE6E-6X/EG24N9K4'); // NG6, function E
    const ng10Series = getProductSeriesById('rexroth_4we10')!;
    const targetCode = '4WE10E-3X/CG24N9K4'; // NG10, function E
    const candidate = {
      seriesId: ng10Series.id,
      brand: ng10Series.brand,
      series: ng10Series.series,
      productType: ng10Series.productType,
      productCategory: ng10Series.productCategory,
      standardFamily: ng10Series.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.different.some((c) => c.label === 'Montaj standardı')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Sürgü davranışı')).toBe(false);
    expect(
      result.checkItems.some((c) => c.field === 'Sürgü davranışı') ||
        result.checkItems.some((c) => c.field === 'Sürgü sembolü / fonksiyon')
    ).toBe(true);
  });

  it('same canonical function improves compatibility but does not make score 100 when other checks exist', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    // Base hydraulic checks (pressure/flow/etc.) still remain, so it must not be 100%.
    const match = calculateMatchPercentage(result);
    expect(match.percentage).toBeLessThan(100);
  });

  it('does not include pneumatic cylinder fields in hydraulic comparison', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
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
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    const labels = [...result.compatible, ...result.different].map((c) => c.label);
    expect(labels).not.toContain('Çap');
    expect(labels).not.toContain('Strok');
  });

  it('known equal fields must not also appear in unknown/check', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-6X/EG24N9K4';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identify(targetCode),
    };

    const result = compareProducts(source, candidate);
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(true);
    expect(result.checkItems.some((c) => c.field === 'Bobin voltajı')).toBe(false);
  });
});

