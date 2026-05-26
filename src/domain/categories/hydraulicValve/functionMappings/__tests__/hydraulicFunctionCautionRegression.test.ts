import { compareProducts } from '@/domain/resolver/compareProducts';
import { compareValveFunctions } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctions';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('hydraulic function caution regression', () => {
  it('Rexroth E vs Atos 0711 is unknownOrCheck, not compatible', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Atos', series: 'DHI', token: '0711' },
    });

    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('compatible');
    expect(result.statusMessageTr).toContain('katalogdan kontrol edilmelidir');
    expect(result.statusMessageTr ?? '').not.toMatch(/aynıdır/i);
  });

  it('exact same token remains compatible', () => {
    const result = compareValveFunctions({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
    });
    expect(result.comparison.status).toBe('compatible');
    expect(result.matchType).toBe('exact_token_match');
  });

  it('integration: Rexroth vs Atos comparison does not mark spool as compatible', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const atosSeries = getProductSeriesById('atos_dhi')!;
    const targetCode = 'DHI-0711-X 24DC';
    const result = compareProducts(source, {
      seriesId: atosSeries.id,
      brand: atosSeries.brand,
      series: atosSeries.series,
      productType: atosSeries.productType,
      productCategory: atosSeries.productCategory,
      standardFamily: atosSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    });

    expect(result.compatible.some((c) => c.label === 'Sürgü / fonksiyon kodu')).toBe(false);
    const spoolCheck = result.checkItems.find((c) => c.field === 'Sürgü sembolü / fonksiyon');
      expect(spoolCheck?.reasonTr).toContain('katalogdan kontrol edilmelidir');
  });
});
