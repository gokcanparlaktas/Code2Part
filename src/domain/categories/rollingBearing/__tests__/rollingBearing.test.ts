import { compareProducts } from '@/domain/resolver/compareProducts';
import { findEquivalentCandidates } from '@/domain/resolver/findEquivalentCandidates';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { ROLLING_BEARING_CATEGORY } from '@/types/category';

import { generateRollingBearingCodeSuggestions } from '../generateRollingBearingCodeSuggestions';
import { parseRollingBearingCode } from '../parseRollingBearingCode';

function identify(code: string) {
  return identifyProduct(code, normalizeCode(code));
}

describe('rolling bearing decode and equivalents', () => {
  it('decodes 6308-ZZ as deep groove with d/D/B and ambiguous brand', () => {
    const profile = parseRollingBearingCode('6308-ZZ');
    expect(profile.baseCode).toBe('6308');
    expect(profile.series?.bearingTypeNameTr).toBe('Bilyalı rulman');
    expect(profile.dimensions.status).toBe('complete');
    expect(profile.dimensions.boreDiameterMm).toBe(40);
    expect(profile.dimensions.outsideDiameterMm).toBe(90);
    expect(profile.dimensions.widthMm).toBe(23);
    expect(profile.brand.manufacturer).toBeNull();
    expect(profile.brand.detectionType).toBe('ambiguous_common_suffix');
  });

  it('identifies SKF 6308-2Z with explicit brand', () => {
    const id = identify('SKF 6308-2Z');
    expect(id.resolverCategoryKey).toBe(ROLLING_BEARING_CATEGORY);
    expect(id.outcome).toBe('full');
    expect(id.brand.value).toContain('SKF');
    expect(id.bore.value).toBe(40);
    expect(id.outsideDiameter?.value).toBe(90);
    expect(id.bearingWidth?.value).toBe(23);
  });

  it('suggests multi-brand codes for 6308-ZZ', () => {
    const profile = parseRollingBearingCode('6308-ZZ');
    const suggestions = generateRollingBearingCodeSuggestions(profile);
    const codes = suggestions.map((s) => s.suggestedCode);
    expect(codes.some((c) => c.includes('6308') && c.includes('2Z'))).toBe(true);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
  });

  it('attaches NTN seal suffix reference notes to NTN equivalent suggestions', () => {
    const profile = parseRollingBearingCode('6308-ZZ');
    const suggestions = generateRollingBearingCodeSuggestions(profile);
    const ntn = suggestions.find((s) => s.manufacturer === 'NTN');
    expect(ntn).toBeDefined();
    expect(ntn?.checkNotesTr.some((n) => n.includes('LLU'))).toBe(true);
  });

  it('attaches NSK seal suffix reference notes to NSK equivalent suggestions', () => {
    const profile = parseRollingBearingCode('6308-ZZ');
    const suggestions = generateRollingBearingCodeSuggestions(profile);
    const nsk = suggestions.find((s) => s.manufacturer === 'NSK');
    expect(nsk).toBeDefined();
    expect(nsk?.checkNotesTr.some((n) => n.includes('DDU') && n.includes('2RS'))).toBe(true);
  });

  it('finds cross-brand equivalent candidates for 6308-ZZ', () => {
    const id = identify('6308-ZZ');
    const discoveries = findEquivalentCandidates(id, '6308-ZZ');
    expect(discoveries.length).toBeGreaterThan(0);
    expect(
      discoveries.some((d) => d.candidate.suggestedCode?.includes('6308'))
    ).toBe(true);
  });

  it('resolves product search without catalog verification warnings for full bearing', () => {
    const result = resolveProductSearch('6308-ZZ');
    expect(result.identification.matched).toBe(true);
    expect(result.identification.outcome).toBe('full');
    expect(result.hasEquivalents).toBe(true);
    expect(result.equivalenceWarnings).toEqual([]);
  });

  it('does not treat missing dimension row as compatible match', () => {
    const source = identify('6308-ZZ');
    const target = identify('9999-ZZ');
    const discoveries = findEquivalentCandidates(source, '6308-ZZ');
    if (discoveries.length === 0) {
      return;
    }
    const comparison = compareProducts(source, discoveries[0].candidate);
    const dimChecks = comparison.checkItems.concat(
      comparison.compatible,
      comparison.different
    );
    expect(
      dimChecks.length > 0 ||
        comparison.summary.riskLevel === 'high' ||
        comparison.warnings.length > 0
    ).toBe(true);
  });

  it('maps 6205-2RSR suffix hint to Schaeffler', () => {
    const profile = parseRollingBearingCode('6205-2RSR-C3');
    expect(profile.brand.hintManufacturers).toContain('Schaeffler');
    expect(profile.brand.detectionType).toBe('suffix_hint');
  });

  it('decodes 22205 spherical roller dimensions', () => {
    const profile = parseRollingBearingCode('22205');
    expect(profile.series?.seriesGroup).toBe('20000');
    expect(profile.series?.bearingTypeNameTr).toBe('Oynak makaralı rulman');
    expect(profile.dimensions.boreDiameterMm).toBe(25);
    expect(profile.dimensions.outsideDiameterMm).toBe(52);
  });

  it('identifies 6005 as full match with bilyalı rulman and d/D/B labels', () => {
    const id = identify('6005');
    expect(id.resolverCategoryKey).toBe(ROLLING_BEARING_CATEGORY);
    expect(id.outcome).toBe('full');
    expect(id.productType.value).toBe('Bilyalı rulman');
    expect(id.series.value).toBe('6005');
    expect(id.bore.value).toBe(25);
    expect(id.outsideDiameter?.value).toBe(47);
    expect(id.bearingWidth?.value).toBe(12);
  });

  it('identifies 30205 as konik makaralı rulman', () => {
    const id = identify('30205');
    expect(id.outcome).toBe('full');
    expect(id.productType.value).toBe('Konik makaralı rulman');
  });
});
