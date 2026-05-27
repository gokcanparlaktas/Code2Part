import {
  buildPneumaticCushioningAttribute,
  buildPneumaticStandardFamilyAttribute,
  buildPneumaticStandardFamilyDisplayValue,
} from '@/domain/canonical/pneumatic/pneumaticCanonicalAttributes';
import { formatCanonicalDetailLines } from '@/domain/presentation/formatCanonicalDetailValue';
import { buildPneumaticCylinderCompatibilityProfile } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderCompatibilityProfile';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';

describe('pneumaticCanonicalAttributes', () => {
  it('merges series ISO 15552 with N3 variant kept as internal evidence only', () => {
    const attr = buildPneumaticStandardFamilyAttribute({
      seriesStandardLabel: 'ISO 15552',
      variantCodes: [{ token: 'N3', evidence: 'code', confidence: 'high' }],
      manufacturer: 'Festo',
      series: 'DSBC',
      evidence: 'series_table',
      confidence: 'medium',
    });

    expect(attr.canonicalValue).toBe('ISO_15552');
    expect(attr.displayValue).toBe('ISO 15552');
    expect(attr.rawTokenLabel).toBe('Kod kanıtı: N3');
    expect(attr.displayValue).not.toContain('Kod kanıtı:');

    const lines = formatCanonicalDetailLines(attr.displayValue ?? '');
    expect(lines.primary).toBe('ISO 15552');
    expect(lines.evidenceLines).toHaveLength(0);
  });

  it('DSBC profile uses canonical standard family for CP96 comparison', () => {
    const dsbc = buildPneumaticCylinderCompatibilityProfile({
      identification: identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3')),
    });
    const cp96 = buildPneumaticCylinderCompatibilityProfile({
      identification: identifyProduct('CP96-50-100', normalizeCode('CP96-50-100')),
    });

    const comparison = compareCompatibilityProfilesDetailed(dsbc, cp96);
    const standard = comparison.comparisons.find((c) => c.label === 'Standart ailesi');
    expect(standard?.status).toBe('compatible');
    expect(standard?.sourceDisplay).toContain('ISO 15552');
  });

  it('maps PPVA cushioning through canonical registry', () => {
    const attr = buildPneumaticCushioningAttribute({
      rawToken: 'PPVA',
      manufacturer: 'Festo',
      series: 'DSBC',
      evidence: 'code',
      confidence: 'high',
    });
    expect(attr.canonicalValue).toBe('ADJUSTABLE_PNEUMATIC_CUSHIONING');
    expect(attr.displayValue).toContain('Ayarlanabilir pnömatik sönümleme');
    expect(attr.rawTokenLabel).toBe('Kod kanıtı: PPVA');
  });

  it('buildPneumaticStandardFamilyDisplayValue matches profile attribute display', () => {
    const id = identifyProduct('DSBC-50-100-PPVA-N3', normalizeCode('DSBC-50-100-PPVA-N3'));
    const display = buildPneumaticStandardFamilyDisplayValue({
      seriesStandardLabel: id.standardFamily.value,
      variantCodes: [{ token: 'N3', evidence: 'code' }],
      manufacturer: id.brand.value ?? undefined,
      series: id.series.value ?? undefined,
    });
    expect(display).toBe('ISO 15552');
    expect(display).not.toContain('Kod kanıtı:');
  });
});
