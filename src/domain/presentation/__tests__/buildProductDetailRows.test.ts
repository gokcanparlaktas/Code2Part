import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('buildProductDetailRows', () => {
  it('hydraulic_valve rows do not include Çap or Strok', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const labels = rows.map((r) => r.label);

    expect(labels).not.toContain('Çap');
    expect(labels).not.toContain('Strok');
  });

  it('hydraulic_valve rows include Montaj standardı when known', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const row = rows.find((r) => r.label === 'Montaj standardı');
    expect(row?.value).toContain('NG6');
    expect(row?.value).toContain('CETOP 03');
  });

  it('pneumatic_cylinder rows include Çap and Strok', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const rows = buildProductDetailRows(id);
    const labels = rows.map((r) => r.label);
    expect(labels).toContain('Çap');
    expect(labels).toContain('Strok');
  });
});

