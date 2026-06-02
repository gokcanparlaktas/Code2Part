import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

function compare4WE6FToYuken(targetCode: string) {
  const source = identifyProduct('4WE6F-62/EG24N9K4', normalizeCode('4WE6F-62/EG24N9K4'));
  const series = getProductSeriesById('yuken_dsg01')!;
  return compareProducts(source, {
    seriesId: series.id,
    brand: series.brand,
    series: series.series,
    productType: series.productType,
    productCategory: series.productCategory,
    standardFamily: series.standardFamily,
    suggestedCode: targetCode,
    targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
  });
}

describe('4WE6F equivalent check items', () => {
  it('does not flag known fields as kontrol gerekli for DSG-01-3C2-D24-N1-70', () => {
    const result = compare4WE6FToYuken('DSG-01-3C2-D24-N1-70');
    const fields = result.checkItems.map((c) => c.field.toLowerCase());

    expect(result.compatible.some((c) => c.label === 'Montaj standardı')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Merkezleme')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Manuel kumanda')).toBe(true);
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(true);

    expect(fields.some((f) => f.includes('merkez tipi'))).toBe(false);
    expect(fields.some((f) => f.includes('konnektör'))).toBe(false);
    expect(fields.some((f) => f.includes('manuel'))).toBe(false);
    expect(fields.some((f) => f.includes('montaj arayüz'))).toBe(false);
    expect(fields.some((f) => f.includes('merkezleme'))).toBe(false);
    expect(fields.some((f) => f.includes('keçe') || f.includes('conta'))).toBe(false);
  });
});
