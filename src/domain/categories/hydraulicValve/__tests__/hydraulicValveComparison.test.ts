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
    expect(result.compatible.find((c) => c.label === 'Konnektör tipi')?.sourceDisplay).toMatch(
      /DIN|175301/i
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(true);
    expect(result.compatible.find((c) => c.label === 'Merkez tipi')?.sourceDisplay).toMatch(
      /P,T,A,B Kapalı \(Kapalı merkez\)|4 yollu, 3 konumlu|3 konumlu/
    );
    expect(result.compatible.find((c) => c.label === 'Merkez tipi')?.sourceDisplay).not.toContain(
      'Sürgü sembolü E'
    );
  });

  it('Rexroth E vs Yuken 3C2: spool and DIN connector compatible by catalog', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D24-N1-70';
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

    expect(result.compatible.some((c) => c.label === 'Montaj standardı')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(true);

    expect(result.compatible.some((c) => c.label === 'Konnektör tipi')).toBe(true);
    expect(result.checkItems.find((c) => c.field === 'Konnektör tipi')).toBeUndefined();

    expect(result.different.some((c) => c.label === 'Merkez tipi')).toBe(false);
    expect(result.checkItems.some((c) => c.field === 'Merkez tipi')).toBe(false);
    expect(
      result.checkItems.some(
        (c) =>
          c.field === 'Merkez tipi' && c.reasonTr.includes('yeterli kesin bilgi yok')
      )
    ).toBe(false);

    const spool = result.compatible.find((c) => c.label === 'Merkez tipi');
    expect(spool?.sourceDisplay).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(spool?.sourceDisplay).not.toContain('Yay merkezlemeli');

    expect(
      result.warnings.some((w) =>
        w.includes('Sipariş öncesi katalog, uygulama basıncı/debisi')
      )
    ).toBe(true);
  });

  it('Rexroth E vs Vickers 2A is compatible by catalog portState when centers match', () => {
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(true);
    expect(result.checkItems.find((c) => c.field === 'Merkez tipi')).toBeUndefined();
    expect(
      result.warnings.some((w) => w.includes('sürgü davranışı farklı olabilir'))
    ).toBe(false);
  });

  it('Vickers U vs Rexroth K4: compatible DIN 43650 / EN 175301-803 family', () => {
    const source = identify('DG4V-3-2A-M-U-D24-60');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const targetCode = '4WE6E-62/EG24N9K4';
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
    const connector = result.compatible.find((c) => c.label === 'Konnektör tipi');
    expect(connector).toBeDefined();
    expect(connector?.status).toBe('compatible');
    expect(result.checkItems.find((c) => c.field === 'Konnektör tipi')).toBeUndefined();
    const displays = `${connector?.sourceDisplay ?? ''} ${connector?.targetDisplay ?? ''}`;
    expect(displays).toMatch(/175301|43650|4400/i);
  });

  it('Vickers 2A vs Rexroth E is compatible by catalog portState without spool mismatch warning', () => {
    const source = identify('DG4V-3-2A-M-U-H7-60');
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(true);
    expect(result.checkItems.find((c) => c.field === 'Merkez tipi')).toBeUndefined();
    expect(
      result.warnings.some((w) => w.includes('sürgü davranışı farklı olabilir'))
    ).toBe(false);
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(false);
    expect(result.different.some((c) => c.label === 'Merkez tipi')).toBe(false);
    const spoolCheck = result.checkItems.find((c) => c.field === 'Merkez tipi');
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
    expect(
      result.different.some((c) => c.label === 'Merkez tipi') ||
        result.checkItems.some((c) => c.field === 'Merkez tipi')
    ).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(false);
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(false);
    expect(result.different.some((c) => c.label === 'Merkez tipi')).toBe(true);
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
    const targetCode = 'DSG-01-3C2-D12-N1-50';
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
    expect(result.compatible.some((c) => c.label === 'Merkez tipi')).toBe(true);
    expect(
      result.checkItems.some((c) => c.field === 'Merkez tipi')
    ).toBe(false);
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

