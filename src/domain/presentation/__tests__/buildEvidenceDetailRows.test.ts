import { buildEvidenceDetailRows } from '@/domain/presentation/buildEvidenceDetailRows';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('buildEvidenceDetailRows', () => {
  it('hydraulic_valve rows do not include Çap or Strok', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const labels = buildEvidenceDetailRows(id).map((r) => r.label);

    expect(labels).not.toContain('Çap');
    expect(labels).not.toContain('Strok');
    expect(labels).toContain('CETOP / NG ölçüsü');
  });

  it('pneumatic_cylinder rows still include Çap and Strok', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const labels = buildEvidenceDetailRows(id).map((r) => r.label);

    expect(labels).toContain('Çap');
    expect(labels).toContain('Strok');
  });
});
