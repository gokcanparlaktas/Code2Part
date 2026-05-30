import {
  normalizeConnectorDisplay,
  normalizeCushioningDisplay,
  normalizeManualOverrideDisplay,
  normalizeStandardFamilyDisplay,
  normalizeVoltageDisplay,
} from '../canonicalAttributeDisplay';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';
import { buildHydraulicValveCompatibilityProfile } from '@/domain/categories/hydraulicValve/hydraulicValveCompatibilityProfile';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';

describe('canonicalAttributeDisplay', () => {
  it('maps G24 and D24 to same 24V DC canonical value', () => {
    const g24 = normalizeVoltageDisplay({ rawToken: 'G24' });
    const d24 = normalizeVoltageDisplay({ rawToken: 'D24' });
    expect(g24?.canonicalValue).toBe('24V DC');
    expect(d24?.canonicalValue).toBe('24V DC');
    expect(g24?.displayValue).toBe('24V DC');
    expect(g24?.rawTokenLabel).toBe('Kod: G24');
  });

  it('maps EG24 and D24 to same 24V DC', () => {
    const eg24 = normalizeVoltageDisplay({ rawToken: 'EG24' });
    const d24 = normalizeVoltageDisplay({ rawToken: 'D24' });
    expect(eg24?.canonicalValue).toBe(d24?.canonicalValue);
  });

  it('maps K4 to DIN valve connector display', () => {
    const k4 = normalizeConnectorDisplay({ rawToken: 'K4', sourceManufacturer: 'Rexroth' });
    expect(k4?.displayValue).toContain('DIN valf soketi');
    expect(k4?.displayValue).not.toBe('K4');
    expect(k4?.rawTokenLabel).toBeUndefined();
  });

  it('maps N9 to concealed manual override', () => {
    const n9 = normalizeManualOverrideDisplay({ rawToken: 'N9' });
    expect(n9?.displayValue).toBe('Var');
    expect(n9?.rawTokenLabel).toContain('Gizli');
  });

  it('maps N3 to ISO 15552', () => {
    const n3 = normalizeStandardFamilyDisplay({ rawValue: 'N3' });
    expect(n3?.displayValue).toBe('ISO 15552');
    expect(n3?.canonicalValue).toBe('ISO_15552');
  });

  it('maps PPVA to adjustable pneumatic cushioning', () => {
    const ppva = normalizeCushioningDisplay({ rawToken: 'PPVA' });
    expect(ppva?.displayValue).toBe('Ayarlanabilir pnömatik sönümleme');
  });

  it('maps PPVA and PPV to same cushioning canonical value', () => {
    const ppva = normalizeCushioningDisplay({ rawToken: 'PPVA' });
    const ppv = normalizeCushioningDisplay({ rawToken: 'PPV' });
    expect(ppva?.canonicalValue).toBe(ppv?.canonicalValue);
  });
});

describe('canonicalAttributeDisplay integration', () => {
  it('Rexroth vs Yuken voltage compares as compatible 24V DC, not G24/D24', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const targetSeries = getProductSeriesById('yuken_dsg01')!;
    const targetCode = 'DSG-01-3C2-D24-N1-50';
    const candidate = {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: targetCode,
      targetIdentification: identifyProduct(targetCode, normalizeCode(targetCode)),
    };

    const result = compareProducts(source, candidate);
    const voltage = result.compatible.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.status).toBe('compatible');
    expect(voltage?.sourceDisplay).toBe('24V DC');
    expect(voltage?.targetDisplay).toBe('24V DC');
    expect(voltage?.sourceDisplay).not.toContain('EG24');
    expect(voltage?.targetDisplay).not.toContain('D24');
    expect(result.different.some((c) => c.label === 'Bobin voltajı')).toBe(false);
    expect(result.different.some((c) => c.label === 'Bobin kodu')).toBe(false);
  });

  it('hydraulic profile comparison uses canonical voltage display', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const target = identifyProduct('DSG-01-3C2-D24-N1-50', normalizeCode('DSG-01-3C2-D24-N1-50'));
    const comparison = compareCompatibilityProfilesDetailed(
      buildHydraulicValveCompatibilityProfile({ identification: source }),
      buildHydraulicValveCompatibilityProfile({ identification: target })
    );
    const voltage = comparison.comparisons.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.status).toBe('compatible');
    expect(voltage?.sourceDisplay).toBe('24V DC');
  });

  it('product detail shows canonical connector meaning for Rexroth K4', () => {
    const id = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const rows = buildProductDetailRows(id);
    const connector = rows.find((r) => r.label === 'Konnektör tipi');
    expect(connector?.value).toMatch(/DIN valf soketi|Connector 3-pole/i);
    expect(connector?.value).not.toContain('Kod kanıtı:');
  });

  it('product detail shows behavior descriptions without raw token lines for 4WE6E-7X/HG24N9K4', () => {
    const id = identifyProduct('4WE6E-7X/HG24N9K4', normalizeCode('4WE6E-7X/HG24N9K4'));
    const rows = buildProductDetailRows(id);
    const allText = rows.map((r) => r.value).join('\n');
    expect(allText).not.toMatch(/Sürgü sembolü:?\s*E/i);
    expect(allText).not.toMatch(/^G$/m);
    expect(allText).not.toContain('Kod kanıtı:');
    expect(allText).toMatch(/24\s*V\s*DC/i);
  });
});
