import { buildHydraulicValveBehaviorProfile } from '@/domain/categories/hydraulicValve/behavior/buildHydraulicValveBehaviorProfile';
import { compareHydraulicValveBehaviorProfiles } from '@/domain/categories/hydraulicValve/behavior/compareHydraulicValveBehaviorProfiles';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { identifyProduct, getProductSeriesById } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

function buildProfile(input: string) {
  const id = identify(input);
  const attrs = getTechnicalAttributes(id);
  return buildHydraulicValveBehaviorProfile({ identification: id, attributes: attrs });
}

describe('buildHydraulicValveBehaviorProfile', () => {
  it('Rexroth 4WE6E-7X/HG24N9K4 builds NG6 3-position spring-centered profile', () => {
    const profile = buildProfile('4WE6E-7X/HG24N9K4');
    expect(profile.cetopNg).toBe('CETOP 03 / NG6');
    expect(profile.positions).toBe(3);
    expect(profile.centering).toBe('spring_centered');
    expect(profile.voltage).toBe('24V DC');
    expect(profile.connectorCode).toBe('K4');
    expect(profile.manufacturerFunctionCode).toBe('E');
    expect(profile.requiresCatalogCheck).toBe(true);
  });

  it('Yuken DSG-01-3C2-D24-N1-70 builds NG6 profile with 24V DC', () => {
    const profile = buildProfile('DSG-01-3C2-D24-N1-70');
    expect(profile.series).toBe('DSG-01');
    expect(profile.cetopNg).toBe('CETOP 03 / NG6');
    expect(profile.positions).toBe(3);
    expect(profile.centering).toBe('spring_centered');
    expect(profile.voltage).toBe('24V DC');
    expect(profile.manufacturerFunctionCode).toBe('3C2');
  });

  it('Vickers DG4V-3-2A-M-U-H7-60 keeps H7 unresolved', () => {
    const profile = buildProfile('DG4V-3-2A-M-U-H7-60');
    expect(profile.cetopNg).toBe('CETOP 03 / NG6');
    expect(profile.voltage).toBeNull();
    expect(profile.voltageCode).toBe('H7');
    expect(profile.requiresCatalogCheck).toBe(true);
    expect(profile.manufacturerFunctionCode).toBe('2A');
  });
});

describe('compareHydraulicValveBehaviorProfiles', () => {
  it('same NG6 + positions + voltage improves compatibility', () => {
    const rexroth = buildProfile('4WE6E-7X/HG24N9K4');
    const yuken = buildProfile('DSG-01-3C2-D24-N1-70');
    const result = compareHydraulicValveBehaviorProfiles(rexroth, yuken);

    expect(result.comparisons.find((c) => c.label === 'CETOP / NG ölçüsü')?.status).toBe(
      'compatible'
    );
    expect(result.comparisons.find((c) => c.label === 'Konum sayısı')?.status).toBe('compatible');
    expect(result.comparisons.find((c) => c.label === 'Bobin voltajı')?.status).toBe('compatible');
    expect(result.crossBrandSimilarBehavior).toBe(true);
    expect(result.comparisons.find((c) => c.label === 'Sürgü / fonksiyon kodu')?.status).toBe(
      'unknownOrCheck'
    );
  });

  it('NG6 vs NG10 is different', () => {
    const ng6 = buildProfile('DG4V-3-2A-M-U-H7-60');
    const ng10 = buildProfile('DG4V-5-2A-M-U-H7-60');
    const result = compareHydraulicValveBehaviorProfiles(ng6, ng10);
    expect(result.comparisons.find((c) => c.label === 'CETOP / NG ölçüsü')?.status).toBe(
      'different'
    );
  });

  it('closed center vs tandem center is different', () => {
    const closed = buildProfile('DSG-01-3C2-D24-N1-70');
    const tandem = buildProfile('DSG-01-3C4-D24-N1-70');
    const result = compareHydraulicValveBehaviorProfiles(closed, tandem);
    expect(result.comparisons.find((c) => c.label === 'Merkez tipi')?.status).toBe('different');
  });

  it('Yuken 3C12 vs Rexroth E marks different center behavior', () => {
    const yuken = buildProfile('DSG-01-3C12-D24-N1-50');
    const rexroth = buildProfile('4WE6E-6X/EG24N9K4');
    expect(yuken.centerCondition).toBe('tandem_center');
    expect(rexroth.centerCondition).toBe('closed_center');
    const result = compareHydraulicValveBehaviorProfiles(yuken, rexroth);
    expect(result.comparisons.find((c) => c.label === 'Merkez tipi')?.status).toBe('different');
  });

  it('unknown H7 voltage stays unknown/check, not compatible voltage', () => {
    const vickers = buildProfile('DG4V-3-2A-M-U-H7-60');
    const rexroth = buildProfile('4WE6E-7X/HG24N9K4');
    const result = compareHydraulicValveBehaviorProfiles(vickers, rexroth);
    expect(result.comparisons.find((c) => c.label === 'Bobin voltajı')?.status).toBe(
      'unknownOrCheck'
    );
    expect(result.comparisons.find((c) => c.label === 'Bobin kodu')?.status).toBe(
      'unknownOrCheck'
    );
  });

  it('cross-brand same behavior requires catalog check and cautious spool message', () => {
    const rexroth = buildProfile('4WE6E-7X/HG24N9K4');
    const yuken = buildProfile('DSG-01-3C2-D24-N1-70');
    const result = compareHydraulicValveBehaviorProfiles(rexroth, yuken);
    expect(result.requiresCatalogCheck).toBe(true);
    expect(result.warnings.join(' ')).toContain('benzer olabilir');
    expect(result.spoolDynamicCheck?.reasonTr).toContain('benzer olabilir');
  });

  it('exact same DG4V spool code is compatible on function token', () => {
    const a = buildProfile('DG4V-3-2A-M-U-H7-60');
    const b = buildProfile('DG4V-3-2A-M-U-H7-60');
    const result = compareHydraulicValveBehaviorProfiles(a, b);
    expect(result.comparisons.find((c) => c.label === 'Sürgü / fonksiyon kodu')?.status).toBe(
      'compatible'
    );
  });

  it('different spring arrangement reduces compatibility vs same spool', () => {
    const a = buildProfile('DG4V-3-2A-M-U-H7-60');
    const b = buildProfile('DG4V-3-6B-M-U-D24-60');
    const same = compareHydraulicValveBehaviorProfiles(a, a);
    const diff = compareHydraulicValveBehaviorProfiles(a, b);
    const sameCompatible = same.comparisons.filter((c) => c.status === 'compatible').length;
    const diffCompatible = diff.comparisons.filter((c) => c.status === 'compatible').length;
    expect(diffCompatible).toBeLessThan(sameCompatible);
    expect(diff.comparisons.find((c) => c.label === 'Yay düzeni')?.status).toBe('different');
  });
});

describe('behavior profile integration scoring', () => {
  it('100% score is impossible when unknown/check items remain', () => {
    const source = identify('DG4V-3-2A-M-U-H7-60');
    const targetSeries = getProductSeriesById('rexroth_4we6')!;
    const result = compareProducts(source, {
      seriesId: targetSeries.id,
      brand: targetSeries.brand,
      series: targetSeries.series,
      productType: targetSeries.productType,
      productCategory: targetSeries.productCategory,
      standardFamily: targetSeries.standardFamily,
      suggestedCode: '4WE6E-7X/HG24N9K4',
      targetIdentification: identify('4WE6E-7X/HG24N9K4'),
    });

    expect(calculateMatchPercentage(result).percentage).toBeLessThan(100);
    expect(result.checkItems.length).toBeGreaterThan(0);
  });
});
