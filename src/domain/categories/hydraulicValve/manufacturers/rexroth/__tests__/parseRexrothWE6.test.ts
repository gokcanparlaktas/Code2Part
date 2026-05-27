import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import { resolveHydraulicFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import {
  parseRexrothWE6,
  parseRexrothWE6ProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function attrMap(inputCode: string, seriesId = 'rexroth_4we6') {
  const id = identifyProduct(inputCode, normalizeCode(inputCode));
  const attrs = getTechnicalAttributes({ ...id, seriesId: id.seriesId ?? seriesId });
  return new Map(attrs.map((a) => [a.key, a]));
}

function normAttr(map: Map<string, { normalizedValue?: unknown; value: unknown }>, key: string) {
  return map.get(key)?.normalizedValue ?? map.get(key)?.value;
}

describe('parseRexrothWE6 (RE 23164)', () => {
  it('4WE6E-7X/HG24N9K4 extracts catalog-backed attributes and spool semantics', () => {
    const results = parseRexrothWE6('4WE6E-7X/HG24N9K4');
    expect(results).not.toBeNull();
    const map = new Map(results!.map((a) => [a.key, a]));

    expect(map.get('series')?.value).toBe('4WE6');
    expect(map.get('cetop_ng')?.value).toBe('CETOP 03 / NG6');
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_token')?.value).toBe('E');
    expect(normAttr(map, 'number_of_positions')).toBe(3);
    expect(normAttr(map, 'centering')).toBe('spring_centered');
    expect(map.get('centering')?.value).toBe('Yay merkezlemeli');
    expect(normAttr(map, 'center_condition')).toBe('closed_center');
    expect(map.get('component_series')?.value).toBe('7X');
    expect(map.get('component_series')?.confidence).toBe('high');
    expect(map.get('solenoid_type')?.value).toBe('H');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('voltage')?.confidence).toBe('high');
    expect(map.get('coil_voltage_code')?.value).toBe('G24');
    expect(map.get('manual_override')?.value).toBe('Gizli/korumalı manuel kumanda');
    expect(map.get('connector_token')?.value).toBe('K4');
    expect(map.get('connector')?.value).toBe('DIN EN 175301-803');
    expect(map.get('max_pressure_abp')?.value).toBe('315 bar');
    expect(map.get('max_pressure_port_t')?.value).toBe('160 bar');
    expect(map.get('max_flow')?.value).toBe(60);
    expect(map.get('max_flow')?.unit).toBe('l/min');
    expect(map.get('porting_pattern')?.value).toBe('DIN 24340 form A');
    expect(map.get('number_of_positions')?.requiresCatalogCheck).toBe(true);
    expect(map.get('spool_behavior_note')?.requiresCatalogCheck).toBe(true);
  });

  it('4WE6C-7X/HG24N9K4 extracts closed_center', () => {
    const map = new Map(parseRexrothWE6('4WE6C-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(normAttr(map, 'center_condition')).toBe('closed_center');
    expect(normAttr(map, 'number_of_positions')).toBe(3);
  });

  it('4WE6H-7X/HG24N9K4 extracts tandem_center with catalog check', () => {
    const map = new Map(parseRexrothWE6('4WE6H-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(normAttr(map, 'center_condition')).toBe('tandem_center');
    expect(map.get('center_condition')?.value).toContain('Tandem');
    expect(map.get('center_condition')?.requiresCatalogCheck).toBe(true);
  });

  it('4WE6J-7X/HG24N9K4 extracts spoolSymbol J', () => {
    const map = new Map(parseRexrothWE6('4WE6J-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('J');
    expect(map.get('function_token')?.value).toBe('J');
    expect(normAttr(map, 'center_condition')).toBe('partially_open');
  });

  it('4WE6EA-7X/HG24N9K4 parses base E and switching position a', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6EA-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('EA');
    expect(parsed?.switchingPositionVariant).toBe('a');

    const map = new Map(parseRexrothWE6('4WE6EA-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_token')?.value).toBe('EA');
    expect(map.get('switching_position_variant')?.value).toBe('a');
    expect(map.get('spool_behavior_note')?.value).toContain('a pozisyonlu');
  });

  it('4WE6EB-7X/HG24N9K4 parses base E and switching position b', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6EB-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('EB');
    expect(parsed?.switchingPositionVariant).toBe('b');
  });

  it('4WE6D-7X/OFHG24N9K4 detects OF detent on D', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6D-7X/OFHG24N9K4');
    expect(parsed?.spoolSymbol).toBe('D');
    expect(parsed?.detentOption).toBe(true);

    const map = new Map(parseRexrothWE6('4WE6D-7X/OFHG24N9K4')!.map((a) => [a.key, a]));
    expect(normAttr(map, 'centering')).toBe('detented');
    expect(map.get('centering')?.value).toBe('Kilitlemeli');
  });

  it('4WE6DOF-7X/HG24N9K4 compact DOF header detects detent', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6DOF-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('D');
    expect(parsed?.detentOption).toBe(true);
  });

  it('OF with non-D symbol adds catalog warning', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6E-7X/OFHG24N9K4');
    expect(parsed?.invalidOfWithNonD).toBe(true);
    expect(parsed?.parseWarnings.join(' ')).toContain('OF seçeneği');

    const map = new Map(parseRexrothWE6('4WE6E-7X/OFHG24N9K4')!.map((a) => [a.key, a]));
    expect(map.get('spool_behavior_note')?.value).toContain('OF seçeneği');
  });

  it('4WE6E-7X/HG12N9C4Z extracts 12V DC and AMP connector', () => {
    const map = new Map(parseRexrothWE6('4WE6E-7X/HG12N9C4Z')!.map((a) => [a.key, a]));
    expect(map.get('voltage')?.value).toBe('12V DC');
    expect(map.get('connector_token')?.value).toBe('C4Z');
    expect(map.get('connector')?.value).toBe('AMP Junior-Timer');
  });

  it('4WE6E7X/HG24N9K4 compact form parses as RE 23164 7X', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6E7X/HG24N9K4');
    expect(parsed?.format).toBe('re23164_7x');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('E');
    expect(parsed?.componentSeries).toBe('7X');
  });

  it('4WE6D-7X/HG24N9K4 extracts spool D without detent', () => {
    const map = new Map(parseRexrothWE6('4WE6D-7X/HG24N9K4')!.map((a) => [a.key, a]));
    expect(map.get('spool_symbol')?.value).toBe('D');
    expect(normAttr(map, 'centering')).toBe('spring_centered');
  });

  it('4WE6E-6X/EG24N9K4 legacy format still parses with lower confidence on component series', () => {
    const raw = new Map(parseRexrothWE6('4WE6E-6X/EG24N9K4')!.map((a) => [a.key, a]));
    expect(raw.get('component_series')?.requiresCatalogCheck).toBe(true);

    const map = attrMap('4WE6E-6X/EG24N9K4');
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('component_series')?.value).toBe('6X');
    expect(map.get('component_series')?.confidence).toBe('medium');
    expect(map.get('connector_token')?.value).toBe('K4');
  });

  it('7X catalog format takes precedence when both patterns could apply', () => {
    const catalog = parseRexrothWE6ProductCode('4WE6E-7X/HG24N9K4');
    const legacy = parseRexrothWE6ProductCode('4WE6E-6X/EG24N9K4');
    expect(catalog?.format).toBe('re23164_7x');
    expect(legacy?.format).toBe('legacy_6x');
  });

  it('E and J resolve to different center behavior tags', () => {
    const e = resolveHydraulicFunctionBehavior({
      manufacturer: 'Rexroth',
      series: '4WE6',
      token: 'E',
    });
    const j = resolveHydraulicFunctionBehavior({
      manufacturer: 'Rexroth',
      series: '4WE6',
      token: 'J',
    });
    expect(e?.centerCondition).toBe('closed_center');
    expect(j?.centerCondition).toBe('partially_open');
    expect(e?.centerCondition).not.toBe(j?.centerCondition);
  });

  it('EA ordering token resolves to E base semantics', () => {
    const ea = resolveHydraulicFunctionBehavior({
      manufacturer: 'Rexroth',
      series: '4WE6',
      token: 'EA',
    });
    expect(ea?.rawToken).toBe('EA');
    expect(ea?.positions).toBe(3);
    expect(ea?.centerCondition).toBe('closed_center');
  });
});

describe('Rexroth WE6 spool behavior comparison', () => {
  it('Rexroth C vs Rexroth D => different center (closed vs partially_open)', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'C' },
      target: { manufacturer: 'Rexroth', series: '4WE6', token: 'D' },
    });
    expect(result.comparison.status).toBe('different');
    expect(result.statusMessageTr).toContain('Merkez konumu');
  });

  it('cross-brand Rexroth E vs Yuken 3C2 stays cautious check', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'E' },
      target: { manufacturer: 'Yuken', series: 'DSG-01', token: '3C2' },
    });
    expect(result.comparison.status).toBe('unknownOrCheck');
    expect(result.comparison.status).not.toBe('compatible');
  });

  it('Rexroth EA vs Rexroth EA => compatible exact ordering token', () => {
    const result = compareValveFunctionBehavior({
      label: 'Sürgü / fonksiyon kodu',
      source: { manufacturer: 'Rexroth', series: '4WE6', token: 'EA' },
      target: { manufacturer: 'Rexroth', series: '4WE6', token: 'EA' },
    });
    expect(result.comparison.status).toBe('compatible');
    expect(result.statusMessageTr).toContain('EA');
  });
});
