import { canonicalResolvedToProfileAttribute } from '@/domain/canonical/canonicalToCompatibilityAttribute';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';
import { compareCompatibilityProfilesDetailed } from '@/domain/compatibilityProfiles/compareCompatibilityProfiles';
import { compareHydraulicValveCanonicalProfiles } from '@/domain/canonical/hydraulicValve/compareHydraulicValveCanonicalProfiles';
import {
  buildCandidateFallbackCanonicalProfile,
  buildHydraulicValveCanonicalProfile,
} from '@/domain/canonical/hydraulicValve/buildHydraulicValveCanonicalProfile';
import { buildProductDetailRows } from '@/domain/presentation/buildProductDetailRows';
import { getTechnicalAttributes } from '@/domain/attributes/getTechnicalAttributes';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';
import { UNKNOWN_CANONICAL_KEY } from '@/types/canonicalAttribute';

function identify(input: string) {
  return identifyProduct(input, normalizeCode(input));
}

describe('compareCompatibilityProfiles catalog-check classification', () => {
  it('two unknown canonical attributes with catalog display go to unknownOrCheck', () => {
    const unknownAttr = canonicalResolvedToProfileAttribute(
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'center_condition',
        rawToken: '2A',
      }),
      { label: 'Merkez tipi', importance: 'critical', compareMode: 'same_or_check' },
    );
    unknownAttr.displayValue = 'Katalog sembolünden doğrulanmalı';

    const sourceProfile = {
      productCategory: HYDRAULIC_VALVE_CATEGORY,
      attributes: { center: unknownAttr },
    };
    const targetProfile = {
      productCategory: HYDRAULIC_VALVE_CATEGORY,
      attributes: {
        center: {
          ...unknownAttr,
          rawToken: '3C2',
          value: '3C2',
        },
      },
    };

    const result = compareCompatibilityProfilesDetailed(sourceProfile as any, targetProfile as any);
    const center = result.comparisons.find((c) => c.label === 'Merkez tipi');
    expect(center?.status).toBe('unknownOrCheck');
    expect(result.compatible.some((line) => line.includes('Merkez tipi'))).toBe(false);
    expect(result.unknownOrCheck.some((line) => line.includes('Merkez tipi'))).toBe(true);
  });

  it('catalog check display message never appears under compatible', () => {
    const attr = {
      label: 'Merkezleme',
      value: 'Katalogdan doğrulanmalı',
      displayValue: 'Katalogdan doğrulanmalı',
      canonicalKey: UNKNOWN_CANONICAL_KEY,
      canonicalValue: null,
      importance: 'critical' as const,
      compareMode: 'same_or_check' as const,
      evidence: 'unknown' as const,
      confidence: 'unknown' as const,
      requiresCatalogCheck: true,
    };

    const result = compareCompatibilityProfilesDetailed(
      { productCategory: HYDRAULIC_VALVE_CATEGORY, attributes: { centering: attr } } as any,
      { productCategory: HYDRAULIC_VALVE_CATEGORY, attributes: { centering: attr } } as any,
    );

    expect(result.compatible.some((line) => line.includes('Katalogdan doğrulanmalı'))).toBe(
      false,
    );
    expect(result.unknownOrCheck.length).toBeGreaterThan(0);
  });

  it('resolved DC_24V without catalog check is not flagged for verification in profile compare', () => {
    const resolved = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      attributeKey: 'coil_rating',
      rawToken: 'G24',
    });
    const attr = canonicalResolvedToProfileAttribute(resolved, {
      label: 'Bobin voltajı',
      importance: 'critical',
      compareMode: 'same_or_check',
    });
    expect(attr.requiresCatalogCheck).toBe(false);
    expect(attr.displayValue).toBe('24V DC');

    const result = compareCompatibilityProfilesDetailed(
      { productCategory: HYDRAULIC_VALVE_CATEGORY, attributes: { voltage: attr } } as any,
      { productCategory: HYDRAULIC_VALVE_CATEGORY, attributes: { voltage: attr } } as any,
    );
    const voltage = result.comparisons.find((c) => c.label === 'Bobin voltajı');
    expect(voltage?.status).toBe('compatible');
  });
});

describe('DG4V product detail and comparison', () => {
  const code = 'DG4V-3-2A-M-U-H7-60';

  it('detail rows show translated values without Kod kanıtı or raw design code row', () => {
    const rows = buildProductDetailRows(identify(code));
    const allText = rows.map((r) => `${r.label}: ${r.value}`).join('\n');

    expect(allText).toContain('Sürgü / yay düzeni: Yay ofsetli, uçtan uca');
    expect(allText).toContain('Bobin voltajı');
    expect(allText).toContain('24V DC');
    expect(allText).toContain('Konnektör tipi');
    expect(allText).toContain('DIN valf soketi');
    expect(allText).toContain('Tank hattı basınç sınıfı');
    expect(allText).toContain('207 bar');
    expect(allText).toContain('Tasarım serisi');
    expect(allText).toContain('Basic design');

    expect(allText).not.toContain('Kod kanıtı:');
    expect(rows.some((r) => r.label.toLowerCase().includes('tasarım serisi kodu'))).toBe(false);
    expect(allText).not.toMatch(/Tasarım serisi kodu:\s*60/);
  });

  it('known hydraulic rows do not show Kontrol gerekli when catalog check is false', () => {
    const rows = buildProductDetailRows(identify(code));
    const mounting = rows.find((r) => r.label === 'Montaj standardı');
    const voltage = rows.find((r) => r.label === 'Bobin voltajı');
    const connector = rows.find((r) => r.label === 'Konnektör tipi');

    expect(mounting?.requiresCheck).toBe(false);
    expect(voltage?.requiresCheck).toBe(false);
    expect(connector?.requiresCheck).toBe(false);
  });

  it('unknown center type for both products is unknownOrCheck not compatible', () => {
    const left = buildHydraulicValveCanonicalProfile({
      identification: identify(code),
      attributes: getTechnicalAttributes(identify(code)),
    });
    const right = buildHydraulicValveCanonicalProfile({
      identification: identify(code),
      attributes: getTechnicalAttributes(identify(code)),
    });
    const result = compareHydraulicValveCanonicalProfiles(left, right);
    const center = result.comparisons.find((c) => c.label === 'Merkez tipi');
    expect(center?.status).toBe('unknownOrCheck');
    expect(result.compatible.some((line) => line.includes('Merkez tipi'))).toBe(false);
  });

  it('does not duplicate Merkezleme row when Vickers spring arrangement is decoded', () => {
    const rows = buildProductDetailRows(identify(code));
    expect(rows.some((r) => r.label === 'Merkezleme')).toBe(false);
    expect(rows.some((r) => r.label === 'Sürgü / yay düzeni')).toBe(true);
  });
});

describe('canonical fallback profile center check', () => {
  it('unknown center vs known product stays in unknownOrCheck', () => {
    const known = buildHydraulicValveCanonicalProfile({
      identification: identify('4WE6E-6X/EG24N9K4'),
      attributes: getTechnicalAttributes(identify('4WE6E-6X/EG24N9K4')),
    });
    const unknown = buildCandidateFallbackCanonicalProfile({
      brand: 'Vickers',
      series: 'DG4V',
      standardFamily: 'CETOP 03 / NG6',
    });
    const result = compareHydraulicValveCanonicalProfiles(known, unknown);
    const center = result.comparisons.find((c) => c.label === 'Merkez tipi');
    expect(center?.status).toBe('unknownOrCheck');
    expect(result.compatible.some((line) => line.includes('Merkez tipi'))).toBe(false);
  });
});
