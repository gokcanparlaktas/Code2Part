import {
  getCanonicalCushioningDisplay,
  getCanonicalStandardFamilyDisplay,
  normalizeCushioningToken,
  normalizeStandardFamilyToken,
} from '../canonicalTechnicalMeanings';
import {
  formatNormalizedAttributeForDisplay,
  normalizeCushioningAttribute,
  normalizeStandardFamilyAttribute,
} from '../normalizeTechnicalAttribute';
import { normalizeCompatibilityProfile } from '../normalizeCompatibilityProfile';
import { buildPneumaticCylinderCompatibilityProfile } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderCompatibilityProfile';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';
import { compareProducts } from '@/domain/resolver/compareProducts';
import { findEquivalents } from '@/domain/resolver/findEquivalents';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

describe('normalizeTechnicalAttribute', () => {
  it('maps Festo PPVA to ADJUSTABLE_PNEUMATIC_CUSHIONING', () => {
    const normalized = normalizeCushioningAttribute({ rawToken: 'PPVA', manufacturer: 'Festo' });
    expect(normalized.canonicalValue).toBe('ADJUSTABLE_PNEUMATIC_CUSHIONING');
    expect(normalized.displayValue).toBe('Ayarlanabilir pnömatik sönümleme');
  });

  it('maps PPS to SELF_ADJUSTING_PNEUMATIC_CUSHIONING', () => {
    const normalized = normalizeCushioningAttribute({ rawToken: 'PPS', manufacturer: 'Festo' });
    expect(normalized.canonicalValue).toBe('SELF_ADJUSTING_PNEUMATIC_CUSHIONING');
  });

  it('maps P to ELASTIC_CUSHIONING', () => {
    const normalized = normalizeCushioningAttribute({ rawToken: 'P', manufacturer: 'Festo' });
    expect(normalized.canonicalValue).toBe('ELASTIC_CUSHIONING');
  });

  it('maps N3 to ISO_15552', () => {
    expect(normalizeStandardFamilyToken('N3')).toBe('ISO_15552');
    const normalized = normalizeStandardFamilyAttribute({ rawValue: 'N3', manufacturer: 'Festo' });
    expect(normalized.canonicalValue).toBe('ISO_15552');
    expect(normalized.value).toBe(getCanonicalStandardFamilyDisplay('ISO_15552'));
  });

  it('maps ISO15552 variants to ISO_15552', () => {
    expect(normalizeStandardFamilyToken('ISO 15552')).toBe('ISO_15552');
    expect(normalizeStandardFamilyToken('ISO15552')).toBe('ISO_15552');
    expect(normalizeStandardFamilyToken('15552')).toBe('ISO_15552');
  });

  it('formats UI labels with engineering meaning and raw token', () => {
    const normalized = normalizeCushioningAttribute({ rawToken: 'PPVA', manufacturer: 'Festo' });
    expect(formatNormalizedAttributeForDisplay(normalized)).toContain(
      'Ayarlanabilir pnömatik sönümleme'
    );
    expect(formatNormalizedAttributeForDisplay(normalized)).toContain('Kod kanıtı: PPVA');
    expect(formatNormalizedAttributeForDisplay(normalized)).not.toMatch(/^PPVA/m);
  });
});

describe('normalizeCompatibilityProfile comparison', () => {
  function buildPair(sourceCode: string, targetCode: string) {
    const source = identifyProduct(sourceCode, normalizeCode(sourceCode));
    const target = identifyProduct(targetCode, normalizeCode(targetCode));
    const sourceProfile = buildPneumaticCylinderCompatibilityProfile({ identification: source });
    const targetProfile = buildPneumaticCylinderCompatibilityProfile({ identification: target });
    return compareCompatibilityProfilesDetailed(sourceProfile, targetProfile);
  }

  it('treats DSBC N3 and ISO 15552 as compatible standard family', () => {
    const comparison = buildPair('DSBC-50-100-PPVA-N3', 'CP96-50-100');
    const standard = comparison.comparisons.find((c) => c.label === 'Standart ailesi');
    expect(standard?.status).toBe('compatible');
    expect(comparison.checkItems.some((c) => c.field === 'Standart ailesi')).toBe(false);
  });

  it('treats PPVA and PPV as compatible cushioning', () => {
    const sourceProfile = normalizeCompatibilityProfile(
      buildPneumaticCylinderCompatibilityProfile({
        identification: identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3')),
      })
    );
    const targetProfile = normalizeCompatibilityProfile({
      productCategory: 'pneumatic_cylinder',
      brand: 'SMC',
      series: 'CP96',
      attributes: {
        ...buildPneumaticCylinderCompatibilityProfile({
          identification: identifyProduct('CP96-50-100', normalizeCode('CP96-50-100')),
        }).attributes,
        cushioning: normalizeCushioningAttribute({ rawToken: 'PPV', manufacturer: 'SMC' }),
      },
    });

    const comparison = compareCompatibilityProfilesDetailed(sourceProfile, targetProfile);
    const cushioning = comparison.comparisons.find((c) => c.label === 'Sönümleme tipi');
    expect(cushioning?.status).toBe('compatible');
  });

  it('marks different cushioning types as different', () => {
    const sourceProfile = normalizeCompatibilityProfile(
      buildPneumaticCylinderCompatibilityProfile({
        identification: identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3')),
      })
    );
    const targetProfile = normalizeCompatibilityProfile({
      productCategory: 'pneumatic_cylinder',
      brand: 'Festo',
      series: 'DSBC',
      attributes: {
        ...buildPneumaticCylinderCompatibilityProfile({
          identification: identifyProduct('DSBC-32-25-PPSA-N3', normalizeCode('DSBC-32-25-PPSA-N3')),
        }).attributes,
      },
    });

    const comparison = compareCompatibilityProfilesDetailed(sourceProfile, targetProfile);
    const cushioning = comparison.comparisons.find((c) => c.label === 'Sönümleme tipi');
    expect(cushioning?.status).toBe('different');
  });
});

describe('normalization integration', () => {
  it('uses engineering meaning in product detail rows', () => {
    const id = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const rows = buildProductDetailRows(id);
    const cushioning = rows.find((row) => row.label === 'Sönümleme tipi');
    expect(cushioning?.value).toContain('Ayarlanabilir pnömatik sönümleme');
    expect(cushioning?.value).toContain('Kod kanıtı: PPVA');
    expect(cushioning?.value).not.toContain('\nPPVA\n');
  });

  it('reduces score less when canonical standard family matches', () => {
    const source = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const cp96 = findEquivalents(source).find((e) => e.series === 'CP96');
    expect(cp96).toBeDefined();

    const result = compareProducts(source, cp96!);
    expect(result.compatible.some((c) => c.label === 'Standart ailesi')).toBe(true);
    expect(calculateMatchPercentage(result).percentage).toBeGreaterThan(50);
  });
});
