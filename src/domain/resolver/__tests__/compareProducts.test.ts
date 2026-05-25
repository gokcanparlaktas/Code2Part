import { compareProducts } from '../compareProducts';
import { findEquivalents } from '../findEquivalents';
import { identifyProduct } from '../identifyProduct';
import { normalizeCode } from '../normalizeCode';

describe('compareProducts', () => {
  it('compares DSBC-50-100-PPVA-N3 with SMC CP96 equivalent', () => {
    const input = 'DSBC-50-100-PPVA-N3';
    const normalized = normalizeCode(input);
    const source = identifyProduct(input, normalized);
    const equivalents = findEquivalents(source);
    const cp96 = equivalents.find((e) => e.series === 'CP96');

    expect(cp96).toBeDefined();

    const result = compareProducts(source, cp96!);
    const compatibleLabels = result.compatible.map((c) => c.label);
    const checkFields = result.checkItems.map((c) => c.field);

    expect(compatibleLabels).toContain('Ürün kategorisi');
    expect(compatibleLabels).toContain('Çap (bore)');
    expect(compatibleLabels).toContain('Strok');

    expect(checkFields).toContain('Mil ucu / diş');
    expect(checkFields).toContain('Port ölçüsü');
    expect(checkFields).toContain('Sensör uyumu');
    expect(checkFields).toContain('Sönümleme seçeneği');
    expect(checkFields).toContain('Montaj aksesuarları');
    expect(checkFields).toContain('Marka');
  });
});
