import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';

function attrMap(attributes: ReturnType<typeof getTechnicalAttributes>) {
  return new Map(attributes.map((a) => [a.key, a]));
}

describe('getTechnicalAttributes', () => {
  it('DSBC-50-100-PPVA-N3 extracts bore/stroke and cushioning token', () => {
    const id = identifyProduct('DSBC-50-100-PPVA-N3', 'DSBC-50-100-PPVA-N3');
    const attributes = getTechnicalAttributes(id);
    const map = attrMap(attributes);

    expect(map.get('bore')?.value).toBe(50);
    expect(map.get('bore')?.unit).toBe('mm');
    expect(map.get('bore')?.evidence).toBe('code');

    expect(map.get('stroke')?.value).toBe(100);
    expect(map.get('stroke')?.unit).toBe('mm');
    expect(map.get('stroke')?.evidence).toBe('code');

    expect(map.get('cushioning_token')?.value).toBe('PPVA');
    expect(map.get('cushioning_token')?.evidence).toBe('code');
  });

  it('CP96SDB50-100 extracts bore 50 and stroke 100', () => {
    const id = identifyProduct('CP96SDB50-100', 'CP96SDB50-100');
    const map = attrMap(getTechnicalAttributes(id));
    expect(map.get('bore')?.value).toBe(50);
    expect(map.get('stroke')?.value).toBe(100);
  });

  it('P1D-S050MS-0100 extracts bore 50 and stroke 100', () => {
    const id = identifyProduct('P1D-S050MS-0100', 'P1D-S050MS-0100');
    const map = attrMap(getTechnicalAttributes(id));
    expect(map.get('bore')?.value).toBe(50);
    expect(map.get('stroke')?.value).toBe(100);
  });

  it('4WE6E-6X/EG24N9K4 extracts CETOP/NG, voltage, spool token, connector token', () => {
    const id = identifyProduct('4WE6E-6X/EG24N9K4', '4WE6E-6X/EG24N9K4');
    const map = attrMap(getTechnicalAttributes(id));

    expect(map.get('cetop_ng')?.value).toBe('CETOP 03 / NG6');
    expect(map.get('cetop_ng')?.evidence).toBe('standard');

    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('voltage')?.evidence).toBe('code');
    expect(map.get('voltage')?.confidence).toBe('medium');

    expect(map.get('spool_symbol')?.value).toBe('E');
    expect(map.get('function_token')?.value).toBe('E');

    expect(map.get('connector_token')?.value).toBe('K4');
  });

  it('DSG-01-3C2-D24-N1-50 extracts CETOP/NG, voltage, function token, connector token', () => {
    const id = identifyProduct('DSG-01-3C2-D24-N1-50', 'DSG-01-3C2-D24-N1-50');
    const map = attrMap(getTechnicalAttributes(id));

    expect(map.get('cetop_ng')?.value).toBe('CETOP 03 / NG6');
    expect(map.get('voltage')?.value).toBe('24V DC');
    expect(map.get('function_token')?.value).toBe('3C2');
    expect(map.get('connector_token')?.value).toBe('N1');
  });

  it('4WE10E-3X/CG24N9K4 extracts CETOP 05 / NG10', () => {
    const id = identifyProduct('4WE10E-3X/CG24N9K4', '4WE10E-3X/CG24N9K4');
    const map = attrMap(getTechnicalAttributes(id));
    expect(map.get('cetop_ng')?.value).toBe('CETOP 05 / NG10');
  });

  it('unsupported category returns safe unknown attribute', () => {
    const id = identifyProduct('UNKNOWN', 'UNKNOWN');
    const attributes = getTechnicalAttributes(id);
    expect(attributes.some((a) => a.key === 'unsupported_category')).toBe(true);
    expect(attributes.find((a) => a.key === 'unsupported_category')?.evidence).toBe(
      'unknown'
    );
  });
});

