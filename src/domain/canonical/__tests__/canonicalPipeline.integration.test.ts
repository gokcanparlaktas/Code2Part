import { canonicalResolvedToProfileAttribute } from '@/domain/canonical/canonicalToCompatibilityAttribute';
import {
  isUnknownCanonical,
  resolveCanonicalAttribute,
} from '@/domain/canonical/resolveCanonicalAttribute';
import { buildPneumaticCylinderCompatibilityProfile } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderCompatibilityProfile';
import { buildHydraulicValveCompatibilityProfile } from '@/domain/categories/hydraulicValve/hydraulicValveCompatibilityProfile';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { normalizeCompatibilityProfile } from '@/domain/normalization/normalizeCompatibilityProfile';
import { normalizeCushioningAttribute } from '@/domain/normalization/normalizeTechnicalAttribute';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';
import { UNKNOWN_CANONICAL_KEY } from '@/types/canonicalAttribute';

describe('canonical pipeline integration', () => {
  it('G24 and D24 compare as compatible 24V DC (not raw token match)', () => {
    const g24 = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      attributeKey: 'coil_rating',
      rawToken: 'G24',
    });
    const d24 = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      attributeKey: 'coil_rating',
      rawToken: 'D24',
    });

    const sourceProfile = buildHydraulicValveCompatibilityProfile({
      identification: identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4')),
    });
    const targetProfile = buildHydraulicValveCompatibilityProfile({
      identification: identifyProduct('DSG-01-3C2-D24-N1-50', normalizeCode('DSG-01-3C2-D24-N1-50')),
    });

    const comparison = compareCompatibilityProfilesDetailed(sourceProfile, targetProfile);
    const voltage = comparison.comparisons.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.status).toBe('compatible');
    expect(voltage?.sourceDisplay).toBe('24V DC');
    expect(voltage?.targetDisplay).toBe('24V DC');
    expect(g24.canonicalValue).toBe(d24.canonicalValue);
  });

  it('unknown coil_rating tokens do not compare as compatible', () => {
    const sourceProfile = {
      productCategory: HYDRAULIC_VALVE_CATEGORY,
      attributes: {
        voltage: canonicalResolvedToProfileAttribute(
          resolveCanonicalAttribute({
            category: HYDRAULIC_VALVE_CATEGORY,
            attributeKey: 'coil_rating',
            rawToken: 'ZZZ',
          }),
          { label: 'Bobin voltajı', importance: 'critical', compareMode: 'same_or_check' },
        ),
      },
    };
    const targetProfile = {
      productCategory: HYDRAULIC_VALVE_CATEGORY,
      attributes: {
        voltage: canonicalResolvedToProfileAttribute(
          resolveCanonicalAttribute({
            category: HYDRAULIC_VALVE_CATEGORY,
            attributeKey: 'coil_rating',
            rawToken: 'YYY',
          }),
          { label: 'Bobin voltajı', importance: 'critical', compareMode: 'same_or_check' },
        ),
      },
    };

    const comparison = compareCompatibilityProfilesDetailed(
      sourceProfile as any,
      targetProfile as any,
    );
    const voltage = comparison.comparisons.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.status).toBe('unknownOrCheck');
    expect(voltage?.status).not.toBe('compatible');
  });

  it('PPVA and PPV cushioning compare as compatible via canonical value', () => {
    const source = buildPneumaticCylinderCompatibilityProfile({
      identification: identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3')),
    });
    const baseTarget = buildPneumaticCylinderCompatibilityProfile({
      identification: identifyProduct('CP96-50-100', normalizeCode('CP96-50-100')),
    });
    const target = normalizeCompatibilityProfile({
      ...baseTarget,
      attributes: {
        ...baseTarget.attributes,
        cushioning: normalizeCushioningAttribute({ rawToken: 'PPV', manufacturer: 'SMC', series: 'CP96' }),
      },
    });
    const comparison = compareCompatibilityProfilesDetailed(source, target);
    const cushioning = comparison.comparisons.find((c) => c.label === 'Sönümleme tipi');
    expect(cushioning?.status).toBe('compatible');
  });

  it('DSBC detail rows show ISO 15552 primary and N3 as Kod kanıtı only', () => {
    const id = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const rows = buildProductDetailRows(id);
    const standard = rows.find((r) => r.label === 'Standart ailesi');
    const cushioning = rows.find((r) => r.label === 'Sönümleme tipi');

    expect(standard?.value).toContain('ISO 15552');
    expect(standard?.value).toContain('Kod kanıtı: N3');
    expect(standard?.value).not.toMatch(/^N3$/m);

    expect(cushioning?.value).toContain('Ayarlanabilir pnömatik sönümleme');
    expect(cushioning?.value).toContain('Kod kanıtı: PPVA');
    const primaryLine = cushioning?.value.split('\n')[0];
    expect(primaryLine).not.toBe('PPVA');
  });

  it('Vickers H7 coil shows 24V DC with catalog check in compareProducts', () => {
    const source = identifyProduct('4WE6E-6X/EG24N9K4', normalizeCode('4WE6E-6X/EG24N9K4'));
    const series = getProductSeriesById('vickers_dg4v3')!;
    const result = compareProducts(source, {
      seriesId: series.id,
      brand: series.brand,
      series: series.series,
      productType: series.productType,
      productCategory: series.productCategory,
      standardFamily: series.standardFamily,
      suggestedCode: 'DG4V-3-2A-M-U-H7-60',
      targetIdentification: identifyProduct(
        'DG4V-3-2A-M-U-H7-60',
        normalizeCode('DG4V-3-2A-M-U-H7-60')
      ),
    });
    expect(result.compatible.some((c) => c.label === 'Bobin voltajı')).toBe(false);
    expect(result.checkItems.some((c) => c.field === 'Bobin voltajı')).toBe(true);
  });

  it('resolved fields use machine canonical keys not display strings', () => {
    const resolved = resolveCanonicalAttribute({
      category: PNEUMATIC_CYLINDER_CATEGORY,
      manufacturer: 'Festo',
      series: 'DSBC',
      attributeKey: 'cushioning_type',
      rawToken: 'PPVA',
    });
    expect(resolved.canonicalKey).toBe('ADJUSTABLE_PNEUMATIC_CUSHIONING');
    expect(resolved.canonicalKey).not.toBe('Ayarlanabilir pnömatik sönümleme');
    expect(isUnknownCanonical(resolved)).toBe(false);
    expect(
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: '???',
      }).canonicalKey
    ).toBe(UNKNOWN_CANONICAL_KEY);
  });
});
