import { parseRexrothWE6 } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import { parseVickersDG4V } from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import { parseYukenDSG } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  buildHydraulicValveBehaviorDescriptions,
  formatBehaviorDescriptionForUi,
} from '@/domain/canonical/hydraulicValve/hydraulicValveBehaviorDescriptions';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

function primaryValuesForCode(code: string): string[] {
  const id = identify(code);
  const descriptions = buildHydraulicValveBehaviorDescriptions({
    identification: id,
    attributes: getTechnicalAttributes(id),
  });
  return descriptions.map((d) => d.primaryDescription);
}

describe('hydraulicValveBehaviorDescriptions', () => {
  it('DSG-01-3C2-D24-N1-70 does not use raw 3C2 or sürgü tipi 2 as primary', () => {
    const code = 'DSG-01-3C2-D24-N1-70';
    const primaries = primaryValuesForCode(code);
    const rows = buildProductDetailRows(identify(code));

    expect(primaries.some((value) => value === '3C2')).toBe(false);
    expect(primaries.some((value) => value.includes('Sürgü tipi 2'))).toBe(false);
    expect(primaries.some((value) => value.includes('3 konumlu'))).toBe(true);
    expect(primaries.some((value) => value.includes('Yay merkezlemeli'))).toBe(true);

    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).toContain('Kod kanıtı: 3');
    expect(allText).toContain('Kod kanıtı: C');
    expect(allText).toContain('Kod kanıtı: 2');
    expect(allText).toContain('Kod kanıtı: D24');
    expect(allText).toContain('Kod kanıtı: N1');
  });

  it('DG4V-3-2A-M-U-H7-60 shows catalog check wording and splits H7 into H + 7', () => {
    const code = 'DG4V-3-2A-M-U-H7-60';
    const primaries = primaryValuesForCode(code);
    const rows = buildProductDetailRows(identify(code));

    expect(primaries.some((value) => value.includes('Sürgü tipi 2'))).toBe(false);
    expect(primaries.some((value) => value.includes('yay düzeni A'))).toBe(false);
    expect(primaries.some((value) => value.includes('Katalog'))).toBe(true);

    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    expect(voltage?.value).toContain('24V DC');
    expect(voltage?.value).toContain('Voltaj değeri katalogdan doğrulanmalıdır.');
    expect(voltage?.value).toContain('Kod kanıtı: H');

    const connector = rows.find((r) => r.label === 'Konnektör tipi');
    expect(connector?.value).toContain('ISO 4400 / DIN 43650');
    expect(connector?.value).toContain('Kod kanıtı: U');

    const tank = rows.find((r) => r.label === 'Tank hattı basınç sınıfı');
    expect(tank?.value).toContain('207 bar');
    expect(tank?.value).toContain('Kod kanıtı: 7');

    const design = rows.find((r) => r.label === 'Tasarım serisi');
    expect(design?.value).toContain('Basic design');
    expect(design?.value).toContain('Kod kanıtı: 60');
  });

  it('4WE6E-7X/HG24N9K4 does not show G from G24 as spool function and shows 24V DC', () => {
    const code = '4WE6E-7X/HG24N9K4';
    const map = new Map(parseRexrothWE6(code)!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('coil_voltage_code')?.value).toBe('G24');

    const rows = buildProductDetailRows(identify(code));
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toMatch(/Sürgü sembolü:?\s*G/i);
    expect(allText).not.toMatch(/fonksiyon:?\s*G24/i);

    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    expect(voltage?.value).toContain('24V DC');

    const ways = rows.find((r) => r.label === 'Yol / konum yapısı');
    expect(ways?.value).toMatch(/4 yollu, 3 konumlu|3 konumlu/);
  });

  it('Atos DHI-0711-X 24DC keeps 0711 as evidence only', () => {
    const code = 'DHI-0711-X 24DC';
    const primaries = primaryValuesForCode(code);
    expect(primaries.some((value) => value.includes('Atos sembol ailesi 0711'))).toBe(false);

    const rows = buildProductDetailRows(identify(code));
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).toContain('Kod kanıtı: 0711');
  });

  it('formatBehaviorDescriptionForUi keeps raw codes in details not primary', () => {
    const id = identify('DSG-01-3C2-D24-N1-70');
    const descriptions = buildHydraulicValveBehaviorDescriptions({
      identification: id,
      attributes: getTechnicalAttributes(id),
    });
    const connector = descriptions.find((d) => d.title === 'Konnektör tipi');
    expect(connector?.primaryDescription).toContain('Fişli konnektör');
    expect(formatBehaviorDescriptionForUi(connector!)).toContain('Kod kanıtı: N1');
  });

  it('Yuken parser still exposes function token in attributes', () => {
    const map = new Map(parseYukenDSG('DSG-01-3C2-D24-N1-70')!.map((a) => [a.key, a]));
    expect(map.get('function_token')?.value).toBe('3C2');
  });

  it('Vickers parser still exposes function token in attributes', () => {
    const map = new Map(parseVickersDG4V('DG4V-3-2A-M-U-H7-60')!.map((a) => [a.key, a]));
    expect(map.get('function_token')?.value).toBe('2A');
  });
});
