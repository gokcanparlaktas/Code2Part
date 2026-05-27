import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { extractHydraulicAttributes } from '@/domain/attributes/extractors/extractHydraulicAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import {
  isVickersDG4VCode,
  parseVickersDG4V,
  parseVickersDG4VProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

function attrMap(inputCode: string) {
  const id = identifyProduct(inputCode, normalizeCode(inputCode));
  return new Map(getTechnicalAttributes(id).map((a) => [a.key, a]));
}

function normAttr(
  map: Map<string, { normalizedValue?: unknown; value: unknown }>,
  key: string
) {
  return map.get(key)?.normalizedValue ?? map.get(key)?.value;
}

describe('parseVickersDG4V', () => {
  it('DG4V-3-2A-M-U-H7-60 extracts structured attributes', () => {
    const map = attrMap('DG4V-3-2A-M-U-H7-60');

    expect(map.get('manufacturer')?.value).toBe('Vickers');
    expect(map.get('series')?.value).toBe('DG4V-3');
    expect(map.get('cetop_ng')?.value).toBe('CETOP 03 / NG6');
    expect(map.get('spool_type')?.value).toBe('2');
    expect(map.get('spring_arrangement_code')?.value).toBe('A');
    expect(normAttr(map, 'spring_arrangement')).toBe('spring_centered');
    expect(map.get('function_token')?.value).toBe('2A');
    expect(map.get('coil_voltage_code')?.value).toBe('H');
    expect(map.get('tank_pressure_rating_code')?.value).toBe('7');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('electrical_option')?.value).toBe('M');
    expect(map.get('connector_option')?.value).toBe('U');
    expect(map.get('design_number')?.value).toBe('60');
  });

  it('DG4V-5-2A-M-U-H7-60 extracts CETOP 05 / NG10', () => {
    const map = attrMap('DG4V-5-2A-M-U-H7-60');
    expect(map.get('series')?.value).toBe('DG4V-5');
    expect(map.get('cetop_ng')?.value).toBe('CETOP 05 / NG10');
  });

  it('H7 splits to H=24V DC and tank rating code', () => {
    const id = identifyProduct('DG4V-3-2A-M-U-H7-60', normalizeCode('DG4V-3-2A-M-U-H7-60'));
    const voltage = extractHydraulicAttributes({
      inputCode: 'DG4V-3-2A-M-U-H7-60',
      seriesId: id.seriesId,
    }).find((a) => a.key === 'voltage');

    expect(voltage?.value).toBe('24V DC');
    expect(voltage?.evidence).toBe('code');
    expect(voltage?.sourceToken).toBe('H');
    expect(voltage?.requiresCatalogCheck).toBe(true);
  });

  it('DG4V-3-2A-M-U-H7 parses without design number', () => {
    const parsed = parseVickersDG4VProductCode('DG4V-3-2A-M-U-H7');
    expect(parsed?.spoolFunctionCode).toBe('2A');
    expect(parsed?.designNumber).toBeNull();
    expect(parseVickersDG4V('DG4V-3-2A-M-U-H7')).not.toBeNull();
  });

  it('DG4V-3-4C-M-U-H7-60 and DG4V-3-6C-M-U-H7-60 extract spool types', () => {
    expect(attrMap('DG4V-3-4C-M-U-H7-60').get('spool_type')?.value).toBe('4');
    expect(attrMap('DG4V-3-4C-M-U-H7-60').get('function_token')?.value).toBe('4C');
    expect(attrMap('DG4V-3-6C-M-U-H7-60').get('spool_type')?.value).toBe('6');
    expect(attrMap('DG4V-3-6C-M-U-H7-60').get('function_token')?.value).toBe('6C');
  });

  it('compact form DG4V32AMUH760 parses', () => {
    const parsed = parseVickersDG4VProductCode('DG4V32AMUH760');
    expect(parsed?.series).toBe('DG4V-3');
    expect(parsed?.spoolFunctionCode).toBe('2A');
    expect(parsed?.coilRatingCode).toBe('H');
    expect(parsed?.tankPressureRatingCode).toBe('7');
    expect(parsed?.designNumber).toBe('60');
  });

  it('D24 maps to confirmed voltage with catalog check', () => {
    const map = attrMap('DG4V-3-2A-M-U-D24-60');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('coil_voltage_code')?.value).toBe('D24');
  });

  it('isVickersDG4VCode detects DG4V codes', () => {
    expect(isVickersDG4VCode('DG4V-3-2A-M-U-H7-60')).toBe(true);
    expect(isVickersDG4VCode('DSG-01-3C2-D24-N1-70')).toBe(false);
  });

  it('exact same DG4V spool code is compatible', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü davranışı',
      source: { manufacturer: 'Vickers', series: 'DG4V-3', token: '2A' },
      target: { manufacturer: 'Vickers', series: 'DG4V-3', token: '2A' },
    });
    expect(result.comparison.status).toBe('compatible');
    expect(result.statusMessageTr).toContain('2A');
  });

  it('different spring arrangements reduce match score', () => {
    const source = identifyProduct('DG4V-3-2A-M-U-H7-60', normalizeCode('DG4V-3-2A-M-U-H7-60'));
    const series = getProductSeriesById('vickers_dg4v3')!;
    const sameSpool = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: 'DG4V-3-2A-M-U-H7-60',
      targetIdentification: identifyProduct(
        'DG4V-3-2A-M-U-H7-60',
        normalizeCode('DG4V-3-2A-M-U-H7-60')
      ),
    });
    const differentSpring = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: 'DG4V-3-6B-M-U-D24-60',
      targetIdentification: identifyProduct(
        'DG4V-3-6B-M-U-D24-60',
        normalizeCode('DG4V-3-6B-M-U-D24-60')
      ),
    });

    const sameCompatible = sameSpool.compatible.length;
    const diffCompatible = differentSpring.compatible.length;
    expect(sameCompatible).toBeGreaterThan(diffCompatible);
    expect(differentSpring.different.some((c) => c.label === 'Merkezleme')).toBe(true);
    expect(calculateMatchPercentage(sameSpool).percentage).toBeGreaterThanOrEqual(
      calculateMatchPercentage(differentSpring).percentage
    );
  });

  it('Rexroth E vs Vickers 2A remains cautious cross-brand', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Vickers', series: 'DG4V-3', token: '2A' },
    });
    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('compatible');
  });

  it('DG4V-3 vs DG4V-5 CETOP mismatch is different', () => {
    const source = identifyProduct('DG4V-3-2A-M-U-H7-60', normalizeCode('DG4V-3-2A-M-U-H7-60'));
    const dg5 = getProductSeriesById('vickers_dg4v5')!;
    const result = compareProducts(source, {
      seriesId: dg5.id,
      brand: dg5.brand,
      series: dg5.series,
      productType: dg5.productType,
      productCategory: dg5.productCategory,
      standardFamily: dg5.standardFamily,
      suggestedCode: 'DG4V-5-2A-M-U-H7-60',
      targetIdentification: identifyProduct(
        'DG4V-5-2A-M-U-H7-60',
        normalizeCode('DG4V-5-2A-M-U-H7-60')
      ),
    });
    expect(result.different.some((c) => c.label === 'Montaj standardı')).toBe(true);
  });
});
