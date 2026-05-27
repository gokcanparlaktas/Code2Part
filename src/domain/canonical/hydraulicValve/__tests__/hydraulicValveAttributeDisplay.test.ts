import { parseRexrothWE6 } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import { parseVickersDG4V } from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import { parseYukenDSG } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  formatHydraulicAttributeForUi,
  normalizeHydraulicConnectorDisplay,
  normalizeHydraulicFunctionDisplay,
  normalizeHydraulicVoltageDisplay,
} from '@/domain/canonical/hydraulicValve/hydraulicValveAttributeDisplay';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

describe('hydraulicValveAttributeDisplay', () => {
  it('does not treat G24 voltage token as Rexroth spool symbol G', () => {
    const display = normalizeHydraulicFunctionDisplay({
      rawToken: 'G24',
      manufacturer: 'Rexroth',
      series: '4WE6',
    });
    expect(display).toBeNull();
  });

  it('Rexroth 4WE6E-7X/HG24N9K4 parses spool E and voltage G24', () => {
    const map = new Map(parseRexrothWE6('4WE6E-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_token')?.value).toBe('E');
    expect(map.get('coil_voltage_code')?.value).toBe('G24');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('connector')?.value).toBe('DIN EN 175301-803');
    expect(map.get('manual_override')?.value).toBe('Gizli/korumalı manuel kumanda');
  });

  it('Yuken DSG-01-3C2-D24-N1-70 displays behavior descriptions instead of raw function code', () => {
    const id = identify('DSG-01-3C2-D24-N1-70');
    const rows = buildProductDetailRows(id);
    const ways = rows.find((r) => r.label === 'Yol / konum yapısı');
    const centering = rows.find((r) => r.label === 'Merkezleme');
    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    const connector = rows.find((r) => r.label === 'Konnektör tipi');
    const allText = rows.map((r) => r.value).join('\n');

    expect(ways?.value).toMatch(/3 konumlu|4 yollu, 3 konumlu/);
    expect(centering?.value).toContain('Yay merkezlemeli');
    expect(allText).not.toContain('Sürgü tipi 2');
    expect(allText).toContain('Kod kanıtı: 3');
    expect(allText).toContain('Kod kanıtı: C');
    expect(allText).toContain('Kod kanıtı: 2');
    expect(voltage?.value).toContain('24V DC');
    expect(voltage?.value).toContain('Kod kanıtı: D24');
    expect(connector?.value).toContain('Fişli konnektör, gösterge ışıklı');
    expect(connector?.value).toContain('Kod kanıtı: N1');
  });

  it('Atos DHI-0711-X 24DC uses catalog behavior wording, not symbol family label', () => {
    const display = normalizeHydraulicFunctionDisplay({
      rawToken: '0711',
      manufacturer: 'Atos',
      series: 'DHI',
    });
    expect(display?.displayValue).toBe(
      'Çalışma davranışı katalog sembolünden doğrulanmalıdır.'
    );
    expect(formatHydraulicAttributeForUi(display!)).toContain('Kod kanıtı: 0711');

    const id = identify('DHI-0711-X 24DC');
    const rows = buildProductDetailRows(id);
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toContain('Atos sembol ailesi 0711');
    expect(allText).toContain('Kod kanıtı: 0711');
  });

  it('Vickers DG4V-3-2A-M-U-H7-60 displays catalog check behavior and coil code', () => {
    const map = new Map(parseVickersDG4V('DG4V-3-2A-M-U-H7-60')!.map((a) => [a.key, a]));
    expect(map.get('function_token')?.value).toBe('2A');

    const id = identify('DG4V-3-2A-M-U-H7-60');
    const rows = buildProductDetailRows(id);
    const allText = rows.map((r) => r.value).join('\n');

    expect(allText).not.toContain('Sürgü tipi 2, yay düzeni A');
    expect(allText).toContain('Kod kanıtı: 2A');
    expect(allText).toContain('24V DC');
    expect(allText).toContain('Voltaj değeri katalogdan doğrulanmalıdır.');
    expect(allText).toContain('Kod kanıtı: H');
    expect(allText).toContain('207 bar');
    expect(allText).toContain('Kod kanıtı: 7');
    expect(allText).toContain('Basic design');
    expect(allText).toContain('Kod kanıtı: U');
  });

  it('G24 and D24 compare as same 24V DC without raw token mismatch', () => {
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
    const voltage = result.compatible.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.sourceDisplay).toBe('24V DC');
    expect(voltage?.targetDisplay).toBe('24V DC');
    expect(result.different.some((c) => c.label === 'Bobin voltajı')).toBe(false);
  });

  it('Vickers H-derived 24V DC still stays unknown/check vs confirmed 24V DC', () => {
    const source = identify('4WE6E-6X/EG24N9K4');
    const target = identify('DG4V-3-2A-M-U-H7-60');
    const targetSeries = getProductSeriesById('vickers_dg4v3')!;
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: 'DG4V-3-2A-M-U-H7-60',
      targetIdentification: target,
    };

    const result = compareProducts(source, candidate);
    const voltage = result.compatible.find((c) => c.label === 'Bobin voltajı');
    expect(voltage).toBeUndefined();
    expect(result.checkItems.some((c) => c.field === 'Bobin voltajı')).toBe(true);
  });

  it('maps Yuken N1 connector to readable label', () => {
    const display = normalizeHydraulicConnectorDisplay({ rawToken: 'N1' });
    expect(display?.displayValue).toBe('Fişli konnektör, gösterge ışıklı');
  });

  it('Yuken function display path avoids raw spool type label', () => {
    const map = new Map(parseYukenDSG('DSG-01-3C2-D24-N1-70')!.map((a) => [a.key, a]));
    expect(map.get('function_token')?.value).toBe('3C2');
    const display = normalizeHydraulicFunctionDisplay({
      rawToken: '3C2',
      manufacturer: 'Yuken',
      series: 'DSG-01',
    });
    expect(display?.displayValue).toBe(
      'Çalışma davranışı katalog sembolünden doğrulanmalıdır.'
    );
    expect(display?.displayValue).not.toContain('Sürgü tipi 2');
  });

  it('H maps to 24V DC but requires catalog check', () => {
    const display = normalizeHydraulicVoltageDisplay({ rawToken: 'H' });
    expect(display?.displayValue).toBe('24V DC');
    expect(display?.rawTokenLabel).toBe('Kod kanıtı: H');
    expect(display?.requiresCatalogCheck).toBe(true);
    expect(display?.note).toContain('Voltaj değeri katalogdan doğrulanmalıdır.');
  });
});
