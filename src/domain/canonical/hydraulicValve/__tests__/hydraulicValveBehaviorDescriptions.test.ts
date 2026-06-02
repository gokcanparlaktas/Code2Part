import { parseRexrothWE6 } from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import { parseVickersDG4V } from '@/domain/categories/hydraulicValve/manufacturers/vickers/parseVickersDG4V';
import { parseYukenDSG } from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import {
  buildHydraulicValveBehaviorDescriptions,
} from '@/domain/canonical/hydraulicValve/hydraulicValveBehaviorDescriptionsBundle';
import {
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
  it('4WE6E-6X/EG24N9K4 Merkez tipi uses unified P,T,A,B port summary', () => {
    const id = identify('4WE6E-6X/EG24N9K4');
    const descriptions = buildHydraulicValveBehaviorDescriptions({
      identification: id,
      attributes: getTechnicalAttributes(id),
    });
    const center = descriptions.find((d) => d.title === 'Merkez tipi');
    expect(center?.primaryDescription).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(center?.details).toEqual([]);
    expect(center?.userEvidenceTr).toBe('Katalogdan');
    expect(formatBehaviorDescriptionForUi(center!)).toBe(
      'P,T,A,B Kapalı (Kapalı merkez)'
    );
  });

  it('DSG-01-3C2-D24-N1-70 does not use raw 3C2 or sürgü tipi 2 as primary', () => {
    const code = 'DSG-01-3C2-D24-N1-70';
    const primaries = primaryValuesForCode(code);
    const rows = buildProductDetailRows(identify(code));

    expect(primaries.some((value) => value === '3C2')).toBe(false);
    expect(primaries.some((value) => value.includes('Sürgü tipi 2'))).toBe(false);
    expect(primaries.some((value) => value.includes('3 konumlu'))).toBe(true);
    expect(primaries.some((value) => value.includes('Yay merkezlemeli'))).toBe(true);
    const center = buildHydraulicValveBehaviorDescriptions({
      identification: identify(code),
      attributes: getTechnicalAttributes(identify(code)),
    }).find((d) => d.title === 'Merkez tipi');
    expect(center?.primaryDescription).toBe('P,T,A,B Kapalı (Kapalı merkez)');

    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toContain('Kod kanıtı:');
  });

  it('DG4V-3-2A-M-U-H7-60 shows center type from catalog and splits H7 into H + 7', () => {
    const code = 'DG4V-3-2A-M-U-H7-60';
    const primaries = primaryValuesForCode(code);
    const rows = buildProductDetailRows(identify(code));

    expect(primaries.some((value) => value.includes('Sürgü tipi 2'))).toBe(false);
    expect(primaries.some((value) => value.includes('yay düzeni A'))).toBe(false);
    expect(primaries.some((value) => value.includes('P,T,A,B Kapalı (Kapalı merkez)'))).toBe(
      true
    );

    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    expect(voltage?.value).toMatch(/24\s*V\s*DC/i);
    expect(voltage?.requiresCheck).toBe(false);

    const connector = rows.find((r) => r.label === 'Konnektör tipi');
    expect(connector?.value).toMatch(/DIN 43650|EN 175301-803/);
    expect(connector?.requiresCheck).toBe(false);

    const tank = rows.find((r) => r.label === 'Tank hattı basınç sınıfı');
    expect(tank?.value).toContain('207 bar');

    const design = rows.find((r) => r.label === 'Tasarım serisi');
    expect(design?.value).toContain('Basic design');
    expect(rows.map((r) => r.value).join('\n')).not.toContain('Kod kanıtı:');
    expect(rows.some((r) => r.label.toLowerCase().includes('tasarım serisi kodu'))).toBe(false);
  });

  it('4WE6E-7X/HG24N9K4 does not show G from G24 as spool function and shows 24V DC', () => {
    const code = '4WE6E-7X/HG24N9K4';
    const map = new Map(parseRexrothWE6(code)!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('coil_rating')?.value).toBe('HG24');

    const rows = buildProductDetailRows(identify(code));
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toMatch(/Sürgü sembolü:?\s*G/i);
    expect(allText).not.toMatch(/fonksiyon:?\s*G24/i);

    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    expect(voltage?.value).toMatch(/24\s*V\s*DC/i);

    const ways = rows.find((r) => r.label === 'Yol / konum yapısı');
    expect(ways?.value).toMatch(/4 yollu, 3 konumlu|3 konumlu/);
  });

  it('Atos DHI-0711-X 24DC keeps 0711 as evidence only', () => {
    const code = 'DHI-0711-X 24DC';
    const primaries = primaryValuesForCode(code);
    expect(primaries.some((value) => value.includes('Atos sembol ailesi 0711'))).toBe(false);

    const rows = buildProductDetailRows(identify(code));
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toContain('Kod kanıtı:');
  });

  it('formatBehaviorDescriptionForUi omits Kod kanıtı lines from visible text', () => {
    const id = identify('DSG-01-3C2-D24-N1-70');
    const descriptions = buildHydraulicValveBehaviorDescriptions({
      identification: id,
      attributes: getTechnicalAttributes(id),
    });
    const connector = descriptions.find((d) => d.title === 'Konnektör tipi');
    expect(connector?.primaryDescription).toContain('Fişli konnektör');
    expect(formatBehaviorDescriptionForUi(connector!)).not.toContain('Kod kanıtı:');
    expect(connector?.details?.some((line) => line.includes('Kod kanıtı: N1'))).toBe(true);
  });

  it('Yuken parser still exposes function_code in attributes', () => {
    const map = new Map(parseYukenDSG('DSG-01-3C2-D24-N1-70')!.map((a) => [a.key, a]));
    expect(map.get('function_code')?.value).toBe('3C2');
  });

  it('Vickers parser still exposes function_code in attributes', () => {
    const map = new Map(parseVickersDG4V('DG4V-3-2A-M-U-H7-60')!.map((a) => [a.key, a]));
    expect(map.get('function_code')?.value).toBe('2A');
  });
});
