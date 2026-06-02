import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { normalizeCheckFieldKey } from '@/domain/presentation/dedupeCheckItems';

const REXROTH = '4WE6E-6X/EG24N9K4';
const YUKEN = 'DSG-01-3C2-D24-N1-70';

function comparePair() {
  const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
  const series = getProductSeriesById('yuken_dsg01')!;
  return compareProducts(source, {
    seriesId: series.id,
    brand: series.brand,
    series: series.series,
    productType: series.productType,
    productCategory: series.productCategory,
    standardFamily: series.standardFamily,
    suggestedCode: YUKEN,
    targetIdentification: identifyProduct(YUKEN, normalizeCode(YUKEN)),
  });
}

describe('equivalence comparison UI dedup', () => {
  it('does not duplicate Merkez tipi when portState comparison already covers center behavior', () => {
    const result = comparePair();

    const merkezRows = result.compatible.filter(
      (c) => c.label === FIELD_LABELS.spoolFunctionCode
    );
    expect(merkezRows).toHaveLength(1);
    expect(merkezRows[0]?.sourceDisplay).toBe('P,T,A,B Kapalı (Kapalı merkez)');
  });

  it('does not add generic Basınç değeri check when catalog pressure exists', () => {
    const result = comparePair();

    expect(
      result.compatible.some((c) => c.label === FIELD_LABELS.maxPressureBar)
    ).toBe(true);
    expect(
      result.checkItems.some(
        (item) =>
          normalizeCheckFieldKey(item.field) === 'basınç' &&
          item.field === 'Basınç değeri'
      )
    ).toBe(false);
    const pressure = result.compatible.find((c) => c.label === FIELD_LABELS.maxPressureBar);
    expect(pressure?.reviewNoteTr).toBeUndefined();
    expect(
      result.checkItems.some(
        (item) =>
          normalizeCheckFieldKey(item.field) === 'basınç' &&
          item.reasonTr.includes('yeterli kesin bilgi yok')
      )
    ).toBe(false);
  });

  it('80 vs 100 flow is compatible in UI, not a different row', () => {
    const result = comparePair();

    const flow = result.compatible.find((c) => c.label === FIELD_LABELS.maxFlowLpm);
    expect(flow).toBeDefined();
    expect(flow?.sourceDisplay).toMatch(/80/);
    expect(flow?.targetDisplay).toMatch(/100/);
    expect(result.different.some((c) => c.label === FIELD_LABELS.maxFlowLpm)).toBe(false);
    expect(
      result.checkItems.some(
        (item) =>
          normalizeCheckFieldKey(item.field) === 'debi' && item.field === 'Debi değeri'
      )
    ).toBe(false);
  });

  it('shows resolved manual override in Uyumlu only, not in Kontrol gerekli', () => {
    const result = comparePair();
    const manualCompatible = result.compatible.find(
      (c) => c.label === FIELD_LABELS.manualOverride
    );
    expect(manualCompatible?.status).toBe('compatible');
    expect(manualCompatible?.sourceDisplay).toBe('Var');
    expect(manualCompatible?.targetDisplay).toBe('Var');
    const manualItems = result.checkItems.filter((item) =>
      item.field.toLowerCase().includes('manuel')
    );
    expect(manualItems.length).toBe(0);
  });
});
