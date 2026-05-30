import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import { resolveHydraulicFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import {
  isYukenDSGCode,
  parseYukenDSG,
  parseYukenDSGProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/yuken/parseYukenDSG';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function attrMap(inputCode: string) {
  const id = identifyProduct(inputCode, normalizeCode(inputCode));
  const attrs = getTechnicalAttributes(id);
  return new Map(attrs.map((a) => [a.key, a]));
}

function parserMap(inputCode: string) {
  const attrs = parseYukenDSG(inputCode);
  expect(attrs).not.toBeNull();
  return new Map(attrs!.map((a) => [a.key, a]));
}

describe('parseYukenDSG', () => {
  it('DSG-01-3C2-D24-N1-70 extracts raw model code attributes', () => {
    const map = parserMap('DSG-01-3C2-D24-N1-70');

    expect(map.get('manufacturer')?.value).toBe('Yuken');
    expect(map.get('family')?.value).toBe('DSG');
    expect(map.get('source_family')?.value).toBe('DSG-01');
    expect(map.get('series')?.value).toBe('DSG-01');
    expect(map.get('model_size')?.value).toBe('01');
    expect(map.get('mounting_standard')?.value).toBe('01');
    expect(map.get('function_code')?.value).toBe('3C2');
    expect(map.get('spool_symbol')?.value).toBe('2');
    expect(map.get('spring_arrangement')?.value).toBe('C');
    expect(map.get('coil_rating')?.value).toBe('D24');
    expect(map.get('connector_type')?.value).toBe('N1');
    expect(map.get('design_series')?.value).toBe('70');
    expect(map.get('design_number')?.value).toBe('70');
    expect(map.get('number_of_positions')?.value).toBe(3);
    expect(map.get('number_of_positions')?.requiresCatalogCheck).toBe(true);
  });

  it('DSG-03-3C2-D24-N1-70 extracts mounting size 03', () => {
    const map = parserMap('DSG-03-3C2-D24-N1-70');
    expect(map.get('series')?.value).toBe('DSG-03');
    expect(map.get('mounting_standard')?.value).toBe('03');
  });

  it('DSG-01-3C4-D24-N1-70 extracts spool symbol 4', () => {
    const map = parserMap('DSG-01-3C4-D24-N1-70');
    expect(map.get('spool_symbol')?.value).toBe('4');
    expect(map.get('function_code')?.value).toBe('3C4');
    const behavior = resolveHydraulicFunctionBehavior({
      manufacturer: 'Yuken',
      series: 'DSG-01',
      token: '3C4',
    });
    expect(behavior?.centerCondition).toBe('tandem_center');
  });

  it('DSG-01-3C60-D24-N1-70 extracts spool symbol 60', () => {
    const map = parserMap('DSG-01-3C60-D24-N1-70');
    expect(map.get('spool_symbol')?.value).toBe('60');
    expect(map.get('function_code')?.value).toBe('3C60');
    const behavior = resolveHydraulicFunctionBehavior({
      manufacturer: 'Yuken',
      series: 'DSG-01',
      token: '3C60',
    });
    expect(behavior?.centerCondition).toBe('open_center');
  });

  it('DSG-01-3C2-D24-N1-50 legacy design number still parses', () => {
    const parsed = parseYukenDSGProductCode('DSG-01-3C2-D24-N1-50');
    expect(parsed?.designNumber).toBe('50');
    expect(parseYukenDSG('DSG-01-3C2-D24-N1-50')).not.toBeNull();
  });

  it.each([
    ['DSG-01-3C2-D12-N1-70', 'D12'],
    ['DSG-01-3C2-D24-N1-70', 'D24'],
    ['DSG-01-3C2-D48-N1-70', 'D48'],
  ] as const)('coil_rating raw token %s => %s', (code, token) => {
    const map = parserMap(code);
    expect(map.get('coil_rating')?.value).toBe(token);
  });

  it('N vs N1 connector distinction', () => {
    expect(parserMap('DSG-01-3C2-D24-N-70').get('connector_type')?.value).toBe('N');
    expect(parserMap('DSG-01-3C2-D24-N1-70').get('connector_type')?.value).toBe('N1');
  });

  it('default manual override when segment omitted (N1 is connector only)', () => {
    const map = parserMap('DSG-01-3C2-D24-N1-70');
    expect(map.get('manual_override')?.value).toBe('default');
    expect(map.get('manual_override')?.sourceToken).toBe('default');
    expect(map.get('connector_type')?.value).toBe('N1');
  });

  it('C manual override segment is separate from connector', () => {
    const map = parserMap('DSG-01-3C2-D24-C-N1-70');
    expect(map.get('manual_override')?.value).toBe('C');
    expect(map.get('manual_override')?.sourceToken).toBe('C');
    expect(map.get('connector_type')?.value).toBe('N1');
  });

  it('isYukenDSGCode detects DSG model codes', () => {
    expect(isYukenDSGCode('DSG-01-3C2-D24-N1-70')).toBe(true);
    expect(isYukenDSGCode('4WE6E-7X/HG24N9K4')).toBe(false);
    expect(isYukenDSGCode('DSHG-03-3C4-T-D24-14')).toBe(false);
  });

  it('3C2 vs 3C4 behavior comparison is different center', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C2' },
      target: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C4' },
    });
    expect(result.comparison.status).toBe('different');
  });

  it('Rexroth E vs Yuken 3C2 remains cautious cross-brand check', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C2' },
    });
    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('compatible');
  });

  it('full pipeline exposes function_code for comparison', () => {
    const map = attrMap('DSG-01-3C2-D24-N1-70');
    expect(map.get('function_code')?.value).toBe('3C2');
    expect(map.get('coil_rating')?.value).toBe('D24');
  });
});
