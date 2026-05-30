import {
  buildProductResolverContext,
  resolveTechnicalDataCandidate,
} from '@/domain/catalogData';
import { pressuresEquivalentBar, pressureToBar } from '@/domain/catalogData/technical/normalizeHydraulicTechnicalUnits';
import { buildHydraulicValveCanonicalProfile } from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import { FIELD_LABELS } from '@/domain/canonical/hydraulicValve/hydraulicValveCanonicalDictionary';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';

const REXROTH = '4WE6E-6X/EG24N9K4';
const YUKEN = 'DSG-01-3C2-D24-N1-70';

function buildProfile(code: string) {
  const identification = identifyProduct(code, normalizeCode(code));
  return buildHydraulicValveCanonicalProfile({
    identification,
    attributes: getTechnicalAttributes(identification),
  });
}

describe('resolveTechnicalDataCandidate', () => {
  it('Rexroth WE6 reads 350 bar max operating pressure from catalog-data', () => {
    const ctx = buildProductResolverContext(REXROTH)!;
    const technical = resolveTechnicalDataCandidate(ctx);
    expect(technical.found).toBe(true);
    expect(technical.maxOperatingPressureBar).toBe(350);
    expect(technical.maxOperatingPressureDisplay).toMatch(/350\s*bar/i);
    expect(technical.maxFlowLpm).toBe(80);
  });

  it('Yuken DSG-01 reads 35 MPa as 350 bar equivalent', () => {
    const ctx = buildProductResolverContext(YUKEN)!;
    const technical = resolveTechnicalDataCandidate(ctx);
    expect(technical.found).toBe(true);
    expect(technical.maxOperatingPressureBar).toBe(350);
    expect(technical.maxOperatingPressureDisplay).toMatch(/35\s*MPa/i);
    expect(technical.maxFlowLpm).toBe(100);
  });

  it('35 MPa equals 350 bar for candidate comparison', () => {
    const yukenBar = pressureToBar({ value: 35, unit: 'MPa' });
    expect(pressuresEquivalentBar(yukenBar, 350)).toBe(true);
  });
});

describe('technical catalog evidence in comparison (Rexroth vs Yuken)', () => {
  it('max pressure is compatible with catalog displays, not generic unknown', () => {
    const rexroth = buildProfile(REXROTH);
    const yuken = buildProfile(YUKEN);
    const result = compareHydraulicValveCanonicalProfiles(rexroth, yuken);

    const pressure = result.comparisons.find((c) => c.label === FIELD_LABELS.maxPressureBar);
    expect(pressure?.status).toBe('compatible');
    expect(pressure?.sourceDisplay).toMatch(/350\s*bar/i);
    expect(pressure?.targetDisplay).toMatch(/35\s*MPa|350\s*bar/i);
    expect(pressure?.reviewNoteTr).toBeUndefined();
  });

  it('flow 80 vs 100 is compatible with catalog values (directional), not generic debi check', () => {
    const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const series = getProductSeriesById('yuken_dsg01')!;
    const result = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: YUKEN,
      targetIdentification: identifyProduct(YUKEN, normalizeCode(YUKEN)),
    });

    const flow = result.compatible.find((c) => c.label === FIELD_LABELS.maxFlowLpm);
    expect(flow?.status).toBe('compatible');
    expect(flow?.sourceDisplay).toMatch(/80/);
    expect(flow?.targetDisplay).toMatch(/100/);
    expect(result.different.some((c) => c.label === FIELD_LABELS.maxFlowLpm)).toBe(false);
    expect(
      result.checkItems.some((item) => item.field === 'Debi değeri')
    ).toBe(false);
  });

  it('connector check uses evidence-based text, not generic only', () => {
    const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const series = getProductSeriesById('yuken_dsg01')!;
    const result = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: YUKEN,
      targetIdentification: identifyProduct(YUKEN, normalizeCode(YUKEN)),
    });

    const connectorCheck = result.checkItems.find((item) => item.field === 'Konnektör tipi');
    expect(connectorCheck).toBeDefined();
    expect(connectorCheck?.reasonTr).toMatch(/DIN|175301|Plug-in|Fişli|ışıklı/i);
    expect(connectorCheck?.reasonTr).toMatch(/Fiziksel soket/i);
    expect(connectorCheck?.reasonTr).not.toContain('yeterli kesin bilgi yok');
  });

  it('does not repeat generic mounting surface check when ISO 4401-03 class matches', () => {
    const source = identifyProduct(REXROTH, normalizeCode(REXROTH));
    const series = getProductSeriesById('yuken_dsg01')!;
    const result = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: YUKEN,
      targetIdentification: identifyProduct(YUKEN, normalizeCode(YUKEN)),
    });

    expect(
      result.checkItems.some((item) => item.field === 'Montaj arayüzü')
    ).toBe(false);
  });
});
