import { deriveHydraulicCompatibilityMetadata } from '@/domain/canonical/hydraulicValve/deriveHydraulicCompatibilityMetadata';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { AttributeComparison } from '@/types/compatibility';

const REXROTH_CODE = '4WE6E-6X/EG24N9K4';
const YUKEN_CODE = 'DSG-01-3C2-D24-N1-70';

function compareRexrothToYuken() {
  const source = identifyProduct(REXROTH_CODE, normalizeCode(REXROTH_CODE));
  const targetSeries = getProductSeriesById('yuken_dsg01')!;
  return compareProducts(source, {
    seriesId: targetSeries.id,
    brand: targetSeries.brand,
    series: targetSeries.series,
    productType: targetSeries.productType,
    productCategory: targetSeries.productCategory,
    standardFamily: targetSeries.standardFamily,
    suggestedCode: YUKEN_CODE,
    targetIdentification: identifyProduct(YUKEN_CODE, normalizeCode(YUKEN_CODE)),
  });
}

describe('deriveHydraulicCompatibilityMetadata', () => {
  it('unknown vs unknown on critical field does not raise compatibilityLevel', () => {
    const comparisons: AttributeComparison[] = [
      {
        label: FIELD_LABELS.mountingStandard,
        sourceDisplay: '?',
        targetDisplay: '?',
        status: 'unknownOrCheck',
      },
    ];
    const metadata = deriveHydraulicCompatibilityMetadata({
      comparisons,
      scoredComparisons: comparisons.map((c) => ({ ...c, importance: 'critical' })),
    });
    expect(metadata.compatibilityLevel).toBe('low');
    expect(metadata.confidenceLevel).toBe('low');
    expect(metadata.dataCompleteness).toBe('low');
  });

  it('known critical mismatch → not_compatible', () => {
    const comparisons: AttributeComparison[] = [
      {
        label: FIELD_LABELS.coilVoltage,
        sourceDisplay: '24V DC',
        targetDisplay: '12V DC',
        status: 'different',
      },
      {
        label: FIELD_LABELS.mountingStandard,
        sourceDisplay: 'NG6',
        targetDisplay: 'NG6',
        status: 'compatible',
      },
    ];
    const metadata = deriveHydraulicCompatibilityMetadata({
      comparisons,
      scoredComparisons: comparisons.map((c) => ({ ...c, importance: 'critical' })),
    });
    expect(metadata.compatibilityLevel).toBe('not_compatible');
    expect(metadata.confidenceLevel).toBe('high');
  });

  it('catalog-backed Rexroth/Yuken pair: high compatibility and high source confidence', () => {
    const result = compareRexrothToYuken();

    expect(result.metadata).toEqual({
      compatibilityLevel: 'high',
      confidenceLevel: 'high',
      dataCompleteness: 'high',
    });
    expect(
      result.warnings.some((w) =>
        w.includes('Sipariş öncesi katalog, uygulama basıncı/debisi')
      )
    ).toBe(true);
  });

  it('review warnings alone do not lower confidenceLevel', () => {
    const comparisons: AttributeComparison[] = [
      {
        label: FIELD_LABELS.mountingStandard,
        sourceDisplay: 'NG6',
        targetDisplay: 'NG6',
        status: 'compatible',
      },
      {
        label: FIELD_LABELS.coilVoltage,
        sourceDisplay: '24V',
        targetDisplay: '24V',
        status: 'compatible',
      },
      {
        label: FIELD_LABELS.spoolFunctionCode,
        sourceDisplay: 'Kapalı merkez',
        targetDisplay: 'Kapalı merkez',
        status: 'compatible',
      },
      {
        label: FIELD_LABELS.connectorType,
        sourceDisplay: 'DIN',
        targetDisplay: 'Plug-in',
        status: 'unknownOrCheck',
      },
    ];
    const metadata = deriveHydraulicCompatibilityMetadata({
      comparisons,
      scoredComparisons: comparisons.map((c) => ({
        ...c,
        importance:
          c.label === FIELD_LABELS.connectorType ? 'important' : 'critical',
      })),
      warnings: [
        'Sürgü merkez davranışı eşleşmesi, inceleme gerektiren katalog aday verisindeki port durumlarına dayanır',
      ],
      requiresCatalogCheck: true,
    });
    expect(metadata.compatibilityLevel).toBe('high');
    expect(metadata.confidenceLevel).toBe('high');
    expect(metadata.dataCompleteness).toBe('high');
  });

  it('portState-resolved center is not listed as unknown Merkez tipi check item', () => {
    const result = compareRexrothToYuken();

    expect(
      result.checkItems.some(
        (item) =>
          item.field === FIELD_LABELS.centerCondition &&
          item.reasonTr.includes('yeterli kesin bilgi yok')
      )
    ).toBe(false);

    const spool = result.compatible.find((c) => c.label === FIELD_LABELS.spoolFunctionCode);
    expect(spool?.sourceDisplay).toBe('P,T,A,B Kapalı (Kapalı merkez)');
    expect(spool?.sourceDisplay).not.toContain('Yay merkezlemeli');
  });

  it('does not duplicate resolved manual override in check items', () => {
    const result = compareRexrothToYuken();
    expect(
      result.compatible.some((c) => c.label === FIELD_LABELS.manualOverride)
    ).toBe(true);
    const manualItems = result.checkItems.filter((item) =>
      item.field.toLowerCase().includes('manuel')
    );
    expect(manualItems.length).toBe(0);
  });
});

describe('compareProducts metadata (Phase E)', () => {
  it('Rexroth 4WE6E vs Yuken DSG-01: high compatibility and high source confidence', () => {
    const result = compareRexrothToYuken();

    expect(result.different).toHaveLength(0);
    expect(result.compatible.some((c) => c.label === FIELD_LABELS.mountingStandard)).toBe(true);
    expect(result.compatible.some((c) => c.label === FIELD_LABELS.coilVoltage)).toBe(true);
    expect(result.compatible.some((c) => c.label === FIELD_LABELS.spoolFunctionCode)).toBe(true);

    expect(result.metadata).toEqual({
      compatibilityLevel: 'high',
      confidenceLevel: 'high',
      dataCompleteness: 'high',
    });
    expect(result.summary.riskLevel).toBe('low');
  });

  it('known voltage mismatch stays different and lowers compatibilityLevel', () => {
    const source = identifyProduct(REXROTH_CODE, normalizeCode(REXROTH_CODE));
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D12-N1-70';
    const result = compareProducts(source, {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    });

    expect(result.different.some((c) => c.label === FIELD_LABELS.coilVoltage)).toBe(true);
    expect(result.metadata?.compatibilityLevel).toBe('not_compatible');
  });

  it('metadata is optional on result shape', () => {
    const result = compareRexrothToYuken();
    expect(result.metadata).toBeDefined();
    expect(['high', 'medium', 'low', 'not_compatible']).toContain(
      result.metadata?.compatibilityLevel
    );
  });
});
