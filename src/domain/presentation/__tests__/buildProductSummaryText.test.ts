import { buildProductSummaryText } from '@/domain/presentation/buildProductSummaryText';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('buildProductSummaryText', () => {
  it('hydraulic summary includes CETOP 03 / NG6 without ölçü kontrol gerekli', () => {
    const code = '4WE6E-6X/EG24N9K4';
    const id = identifyProduct(code, normalizeCode(code));
    const summary = buildProductSummaryText(id);

    expect(summary).toContain('CETOP 03 / NG6');
    expect(summary).not.toContain('ölçü kontrol gerekli');
    expect(summary).toMatch(/Rexroth 4WE6/);
  });

  it('pneumatic summary keeps standard and dimensions wording', () => {
    const code = 'DSBC-50-100-PPVA-N3';
    const id = identifyProduct(code, normalizeCode(code));
    const summary = buildProductSummaryText(id);

    expect(summary).toContain('Festo');
    expect(summary).toContain('DSBC');
    expect(summary).toContain('50 mm x 100 mm');
    expect(summary).not.toContain('ölçü kontrol gerekli');
  });

  it('pneumatic summary shows ölçü kontrol gerekli when bore/stroke missing', () => {
    const code = 'DSBC';
    const id = identifyProduct(code, normalizeCode(code));
    const summary = buildProductSummaryText(id);

    expect(summary).toContain('ölçü kontrol gerekli');
  });
});
