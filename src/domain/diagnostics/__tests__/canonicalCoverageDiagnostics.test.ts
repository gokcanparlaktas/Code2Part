import {
  HYDRAULIC_VALVE_CATEGORY,
  PNEUMATIC_CYLINDER_CATEGORY,
} from '@/types/category';

import {
  buildCanonicalCoverageDiagnostics,
  isCanonicallyResolvedField,
} from '../canonicalCoverageDiagnostics';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';

function hasMissingEntry(
  report: ReturnType<typeof buildCanonicalCoverageDiagnostics>,
  match: {
    category: string;
    attributeKey: string;
    rawToken: string;
    manufacturer?: string;
    series?: string;
  },
): boolean {
  return report.missingMappings.some(
    (entry) =>
      entry.category === match.category &&
      entry.attributeKey === match.attributeKey &&
      entry.rawToken === match.rawToken &&
      (match.manufacturer == null || entry.manufacturer === match.manufacturer) &&
      (match.series == null || entry.series === match.series),
  );
}

describe('buildCanonicalCoverageDiagnostics', () => {
  const report = buildCanonicalCoverageDiagnostics();

  it('returns totalCheckedCodes > 0', () => {
    expect(report.totalCheckedCodes).toBeGreaterThan(0);
  });

  it('returns resolvedAttributes > 0', () => {
    expect(report.resolvedAttributes).toBeGreaterThan(0);
  });

  it('missingMappings is an array', () => {
    expect(Array.isArray(report.missingMappings)).toBe(true);
  });

  it('known canonical mappings are not reported as missing', () => {
    const knownResolved = [
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'G24',
      }),
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'D24',
      }),
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: '24DC',
      }),
      resolveCanonicalAttribute({
        category: HYDRAULIC_VALVE_CATEGORY,
        manufacturer: 'Vickers',
        series: 'DG4V-3',
        attributeKey: 'coil_rating',
        rawToken: 'H',
      }),
      resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPVA',
      }),
      resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPV',
      }),
      resolveCanonicalAttribute({
        category: PNEUMATIC_CYLINDER_CATEGORY,
        manufacturer: 'Festo',
        series: 'DSBC',
        attributeKey: 'variant_code',
        rawToken: 'N3',
      }),
    ];

    for (const resolved of knownResolved) {
      expect(isCanonicallyResolvedField(resolved)).toBe(true);
    }

    expect(hasMissingEntry(report, { category: HYDRAULIC_VALVE_CATEGORY, attributeKey: 'coil_rating', rawToken: 'G24' })).toBe(false);
    expect(hasMissingEntry(report, { category: HYDRAULIC_VALVE_CATEGORY, attributeKey: 'coil_rating', rawToken: 'D24' })).toBe(false);
    expect(hasMissingEntry(report, { category: HYDRAULIC_VALVE_CATEGORY, attributeKey: 'coil_rating', rawToken: '24DC' })).toBe(false);
    expect(
      hasMissingEntry(report, {
        category: HYDRAULIC_VALVE_CATEGORY,
        attributeKey: 'coil_rating',
        rawToken: 'H',
        manufacturer: 'Vickers',
      }),
    ).toBe(false);
    expect(
      hasMissingEntry(report, {
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPVA',
      }),
    ).toBe(false);
    expect(
      hasMissingEntry(report, {
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'cushioning_type',
        rawToken: 'PPV',
      }),
    ).toBe(false);
    expect(
      hasMissingEntry(report, {
        category: PNEUMATIC_CYLINDER_CATEGORY,
        attributeKey: 'variant_code',
        rawToken: 'N3',
        manufacturer: 'Festo',
        series: 'DSBC',
      }),
    ).toBe(false);
  });

  it('parser fields without canonical mapping appear in missingMappings', () => {
    expect(
      report.missingMappings.some(
        (entry) =>
          entry.category === HYDRAULIC_VALVE_CATEGORY &&
          (entry.attributeKey === 'function_code' || entry.attributeKey === 'spool_symbol'),
      ),
    ).toBe(true);
  });

  it('coveragePercent is between 0 and 100', () => {
    expect(report.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(report.coveragePercent).toBeLessThanOrEqual(100);
    for (const row of report.byCategory) {
      expect(row.coveragePercent).toBeGreaterThanOrEqual(0);
      expect(row.coveragePercent).toBeLessThanOrEqual(100);
    }
  });

  it('counts catalog-check fields separately from resolved coverage', () => {
    const vickersH = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      manufacturer: 'Vickers',
      series: 'DG4V-3',
      attributeKey: 'coil_rating',
      rawToken: 'H',
    });
    expect(isCanonicallyResolvedField(vickersH)).toBe(true);
    expect(vickersH.requiresCatalogCheck).toBe(true);
    expect(report.requiresCatalogCheckCount).toBeGreaterThan(0);
  });
});
