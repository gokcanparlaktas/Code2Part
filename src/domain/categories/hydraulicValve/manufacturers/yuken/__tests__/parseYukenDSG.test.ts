import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
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

function normAttr(
  map: Map<string, { normalizedValue?: unknown; value: unknown }>,
  key: string
) {
  return map.get(key)?.normalizedValue ?? map.get(key)?.value;
}

describe('parseYukenDSG', () => {
  it('DSG-01-3C2-D24-N1-70 extracts full model code attributes', () => {
    const map = attrMap('DSG-01-3C2-D24-N1-70');

    expect(map.get('manufacturer')?.value).toBe('Yuken');
    expect(map.get('series')?.value).toBe('DSG-01');
    expect(map.get('product_type')?.value).toBe('Hidrolik yön kontrol valfi');
    expect(map.get('cetop_ng')?.value).toBe('CETOP 03 / NG6');
    expect(map.get('spool_function_code')?.value).toBe('3C2');
    expect(map.get('function_token')?.value).toBe('3C2');
    expect(normAttr(map, 'number_of_positions')).toBe(3);
    expect(normAttr(map, 'spring_arrangement')).toBe('spring_centered');
    expect(map.get('spring_arrangement')?.value).toBe('Yay merkezlemeli');
    expect(map.get('spool_type')?.value).toBe('2');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('connector_token')?.value).toBe('N1');
    expect(map.get('connector')?.value).toContain('Göstergeli');
    expect(map.get('design_number')?.value).toBe('70');
    expect(normAttr(map, 'center_condition')).toBe('closed_center');
    const raw = parseYukenDSG('DSG-01-3C2-D24-N1-70')!;
    expect(raw.find((a) => a.key === 'number_of_positions')?.requiresCatalogCheck).toBe(true);
    expect(map.get('spool_behavior_note')?.value).toContain('katalogdan doğrulanmalıdır');
  });

  it('DSG-03-3C2-D24-N1-70 extracts CETOP 05 / NG10', () => {
    const map = attrMap('DSG-03-3C2-D24-N1-70');
    expect(map.get('series')?.value).toBe('DSG-03');
    expect(map.get('cetop_ng')?.value).toBe('CETOP 05 / NG10');
  });

  it('DSG-01-3C4-D24-N1-70 extracts spoolType 4', () => {
    const map = attrMap('DSG-01-3C4-D24-N1-70');
    expect(map.get('spool_type')?.value).toBe('4');
    expect(map.get('spool_function_code')?.value).toBe('3C4');
    expect(normAttr(map, 'center_condition')).toBe('tandem_center');
  });

  it('DSG-01-3C60-D24-N1-70 extracts spoolType 60', () => {
    const map = attrMap('DSG-01-3C60-D24-N1-70');
    expect(map.get('spool_type')?.value).toBe('60');
    expect(map.get('spool_function_code')?.value).toBe('3C60');
    expect(normAttr(map, 'center_condition')).toBe('open_center');
  });

  it('DSG-01-3C2-D24-N1-50 legacy design number still parses', () => {
    const parsed = parseYukenDSGProductCode('DSG-01-3C2-D24-N1-50');
    expect(parsed?.designNumber).toBe('50');
    expect(parseYukenDSG('DSG-01-3C2-D24-N1-50')).not.toBeNull();
  });

  it.each([
    ['DSG-01-3C2-D12-N1-70', 'D12', '12V DC'],
    ['DSG-01-3C2-D24-N1-70', 'D24', '24V DC'],
    ['DSG-01-3C2-D48-N1-70', 'D48', '48V DC'],
  ] as const)('voltage mapping %s => %s', (code, _token, label) => {
    const map = attrMap(code);
    expect(map.get('voltage')?.value).toBe(label);
  });

  it('N vs N1 connector distinction', () => {
    const n = attrMap('DSG-01-3C2-D24-N-70');
    const n1 = attrMap('DSG-01-3C2-D24-N1-70');
    expect(n.get('connector_token')?.value).toBe('N');
    expect(n.get('connector')?.value).toBe('Takılı konnektör');
    expect(n1.get('connector_token')?.value).toBe('N1');
    expect(n1.get('connector')?.value).toContain('Göstergeli');
  });

  it('isYukenDSGCode detects DSG model codes', () => {
    expect(isYukenDSGCode('DSG-01-3C2-D24-N1-70')).toBe(true);
    expect(isYukenDSGCode('4WE6E-7X/HG24N9K4')).toBe(false);
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
});
