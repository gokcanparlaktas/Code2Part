import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { compareValveFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/compareValveFunctionBehavior';
import { resolveHydraulicFunctionBehavior } from '@/domain/categories/hydraulicValve/functionMappings/hydraulicFunctionBehavior';
import {
  parseRexrothWE6,
  parseRexrothWE6ProductCode,
} from '@/domain/categories/hydraulicValve/manufacturers/rexroth/parseRexrothWE6';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function parserMap(inputCode: string) {
  const results = parseRexrothWE6(inputCode);
  expect(results).not.toBeNull();
  return new Map(results!.map((a) => [a.key, a]));
}

function attrMap(inputCode: string, seriesId = 'rexroth_4we6') {
  const id = identifyProduct(inputCode, normalizeCode(inputCode));
  const attrs = getTechnicalAttributes({ ...id, seriesId: id.seriesId ?? seriesId });
  return new Map(attrs.map((a) => [a.key, a]));
}

describe('parseRexrothWE6 (RE 23164)', () => {
  it('4WE6E-7X/HG24N9K4 extracts raw parser fields', () => {
    const map = parserMap('4WE6E-7X/HG24N9K4');

    expect(map.get('series')?.value).toBe('4WE6');
    expect(map.get('mounting_standard')?.value).toBe('WE6');
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_code')?.value).toBe('E');
    expect(map.get('number_of_positions')?.value).toBe(3);
    expect(map.get('design_series')?.value).toBe('7X');
    expect(map.get('design_series')?.confidence).toBe('high');
    expect(map.get('solenoid_type')?.value).toBe('H');
    expect(map.get('coil_rating')?.value).toBe('HG24');
    expect(map.get('coil_rating')?.confidence).toBe('medium');
    expect(map.get('manual_override')?.value).toBe('N9');
    expect(map.get('connector_type')?.value).toBe('K4');
    expect(map.get('number_of_positions')?.requiresCatalogCheck).toBe(true);
  });

  it('4WE6C-7X/HG24N9K4 extracts function code C', () => {
    const map = parserMap('4WE6C-7X/HG24N9K4');
    expect(map.get('function_code')?.value).toBe('C');
    expect(map.get('number_of_positions')?.value).toBe(3);
  });

  it('4WE6H-7X/HG24N9K4 extracts function code H', () => {
    const map = parserMap('4WE6H-7X/HG24N9K4');
    expect(map.get('function_code')?.value).toBe('H');
  });

  it('4WE6J-7X/HG24N9K4 extracts spoolSymbol J', () => {
    const map = parserMap('4WE6J-7X/HG24N9K4');
    expect(map.get('spool_symbol')?.value).toBe('J');
    expect(map.get('function_code')?.value).toBe('J');
  });

  it('4WE6EA-7X/HG24N9K4 parses base E and switching position a', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6EA-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('EA');
    expect(parsed?.switchingPositionVariant).toBe('a');

    const map = parserMap('4WE6EA-7X/HG24N9K4');
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_code')?.value).toBe('EA');
    expect(map.get('switching_position_variant')?.value).toBe('a');
  });

  it('4WE6EB-7X/HG24N9K4 parses base E and switching position b', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6EB-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('EB');
    expect(parsed?.switchingPositionVariant).toBe('b');
  });

  it('4WE6D-7X/OFHG24N9K4 detects OF detent on D in product code model', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6D-7X/OFHG24N9K4');
    expect(parsed?.spoolSymbol).toBe('D');
    expect(parsed?.detentOption).toBe(true);

    expect(parsed?.detentOption).toBe(true);
  });

  it('4WE6DOF-7X/HG24N9K4 compact DOF header detects detent', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6DOF-7X/HG24N9K4');
    expect(parsed?.spoolSymbol).toBe('D');
    expect(parsed?.detentOption).toBe(true);
  });

  it('OF with non-D symbol adds parse warning', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6E-7X/OFHG24N9K4');
    expect(parsed?.invalidOfWithNonD).toBe(true);
    expect(parsed?.parseWarnings.join(' ')).toContain('OF seçeneği');

    const map = parserMap('4WE6E-7X/OFHG24N9K4');
    expect(map.get('parse_warning')?.value).toContain('OF seçeneği');
  });

  it('4WE6E-7X/HG12N9C4Z extracts raw coil_rating G12 and connector C4Z', () => {
    const map = parserMap('4WE6E-7X/HG12N9C4Z');
    expect(map.get('coil_rating')?.value).toBe('G12');
    expect(map.get('connector_type')?.value).toBe('C4Z');
  });

  it('4WE6E7X/HG24N9K4 compact form parses as RE 23164 7X', () => {
    const parsed = parseRexrothWE6ProductCode('4WE6E7X/HG24N9K4');
    expect(parsed?.format).toBe('re23164_7x');
    expect(parsed?.spoolSymbol).toBe('E');
    expect(parsed?.functionToken).toBe('E');
    expect(parsed?.componentSeries).toBe('7X');
  });

  it('4WE6D-7X/HG24N9K4 extracts spool D without detent flag', () => {
    const map = parserMap('4WE6D-7X/HG24N9K4');
    expect(map.get('spool_symbol')?.value).toBe('D');
    const parsed = parseRexrothWE6ProductCode('4WE6D-7X/HG24N9K4');
    expect(parsed?.detentOption).toBe(false);
  });

  it('4WE6E-6X/EG24N9K4 legacy format still parses with catalog check on design series', () => {
    const raw = parserMap('4WE6E-6X/EG24N9K4');
    expect(raw.get('design_series')?.requiresCatalogCheck).toBe(true);

    const map = attrMap('4WE6E-6X/EG24N9K4');
    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('coil_rating')?.value).toBe('EG24');
    expect(map.get('design_series')?.value).toBe('6X');
    expect(map.get('connector_type')?.value).toBe('K4');
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
