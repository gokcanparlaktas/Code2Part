import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';
import {
  getAllCatalogExampleCodes,
  getLegacyEquivalentGroups,
  getLegacyProductSeries,
} from '@/domain/catalog/adapters/catalogV2Adapter';
import { buildCompatibilityResultsFromDiscoveries } from '@/domain/resolver/buildCompatibilityResultsFromDiscoveries';
import { findEquivalents } from '@/domain/resolver/findEquivalents';
import {
  findEquivalentCandidates,
  summarizeEquivalentCandidateDiscovery,
} from '@/domain/resolver/findEquivalentCandidates';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { HYDRAULIC_VALVE_CATEGORY, PNEUMATIC_CYLINDER_CATEGORY } from '@/types/category';

const catalog = {
  series: getLegacyProductSeries(),
  equivalenceGroups: getLegacyEquivalentGroups(),
  exampleCodes: getAllCatalogExampleCodes(),
};

function identify(code: string) {
  return identifyProduct(code, normalizeCode(code));
}

function candidateSeries(discoveries: ReturnType<typeof findEquivalentCandidates>): string[] {
  return discoveries.map((d) => d.candidate.series);
}

function candidateCodes(discoveries: ReturnType<typeof findEquivalentCandidates>): string[] {
  return discoveries
    .map((d) => d.candidate.suggestedCode)
    .filter((code): code is string => Boolean(code));
}

describe('findEquivalentCandidates', () => {
  describe('hydraulic NG6 discovery', () => {
    const sourceCode = 'DG4V-3-2A-M-U-H7-60';

    it('includes NG6 catalog candidates such as Rexroth 4WE6', () => {
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      expect(source.outcome).toBe('full');
      expect(candidateSeries(discoveries)).toEqual(
        expect.arrayContaining(['4WE6', 'DSG-01', 'DHI', 'D1VW']),
      );
      expect(candidateCodes(discoveries).some((code) => code.startsWith('4WE6'))).toBe(true);
      expect(discoveries.length).toBeGreaterThan(4);
    });

    it('does not include NG10 series as same_mounting_standard candidates', () => {
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      const ng10Series = discoveries.filter((d) =>
        ['4WE10', 'DSG-03', 'DG4V-5', 'DHU', 'D3W'].includes(d.candidate.series),
      );
      const profileNg10 = ng10Series.filter(
        (d) => d.reason !== 'equivalence_group',
      );
      expect(profileNg10).toHaveLength(0);
      expect(ng10Series).toHaveLength(0);
    });
  });

  describe('hydraulic NG10 rejection for NG6 source', () => {
    it('excludes DG4V-5 and 4WE10 from discovery pool', () => {
      const sourceCode = 'DG4V-3-2A-M-U-H7-60';
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      expect(candidateSeries(discoveries)).not.toContain('DG4V-5');
      expect(candidateSeries(discoveries)).not.toContain('4WE10');
    });
  });

  describe('pneumatic cylinder discovery', () => {
    const sourceCode = 'DSBC-50-100-PPVA-N3';

    it('includes same bore/stroke ISO 15552 candidates from catalog', () => {
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      expect(source.outcome).toBe('full');
      expect(source.bore.value).toBe(50);
      expect(source.stroke.value).toBe(100);

      const cp96 = discoveries.find((d) => d.candidate.series === 'CP96');
      expect(cp96).toBeDefined();
      expect(cp96?.candidate.suggestedCode).toBe('CP96-50-100');
      expect(['equivalence_group', 'same_standard_family', 'same_dimensions']).toContain(
        cp96?.reason,
      );
    });
  });

  describe('category isolation', () => {
    it('hydraulic source never includes pneumatic candidates', () => {
      const sourceCode = 'DG4V-3-2A-M-U-H7-60';
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      expect(
        discoveries.every(
          (d) => d.candidate.targetIdentification?.resolverCategoryKey === HYDRAULIC_VALVE_CATEGORY,
        ),
      ).toBe(true);
      expect(candidateSeries(discoveries)).not.toContain('DSBC');
      expect(candidateSeries(discoveries)).not.toContain('CP96');
    });

    it('pneumatic source never includes hydraulic candidates', () => {
      const sourceCode = 'DSBC-50-100-PPVA-N3';
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      expect(
        discoveries.every(
          (d) =>
            d.candidate.targetIdentification?.resolverCategoryKey === PNEUMATIC_CYLINDER_CATEGORY,
        ),
      ).toBe(true);
      expect(candidateSeries(discoveries)).not.toContain('4WE6');
      expect(candidateSeries(discoveries)).not.toContain('DG4V-3');
    });
  });

  describe('equivalence group backward compatibility', () => {
    it('returns all series from legacy findEquivalents', () => {
      const sourceCode = 'DSBC-50-100-PPVA-N3';
      const source = identify(sourceCode);
      const legacy = findEquivalents(source);
      const discovered = findEquivalentCandidates(source, sourceCode, catalog);

      for (const candidate of legacy) {
        expect(
          discovered.some((d) => d.candidate.seriesId === candidate.seriesId),
        ).toBe(true);
      }
    });
  });

  describe('dedupe', () => {
    it('merges equivalence group and profile hits for the same product code', () => {
      const sourceCode = 'DG4V-3-2A-M-U-H7-60';
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);

      const rexrothEg24 = discoveries.filter(
        (d) => d.candidate.suggestedCode === '4WE6E-6X/EG24N9K4',
      );
      expect(rexrothEg24).toHaveLength(1);
      expect(rexrothEg24[0]?.reason).toBe('equivalence_group');
    });
  });

  describe('comparison sorting integration', () => {
    it('sorts compared candidates by match percentage descending', () => {
      const sourceCode = '4WE6E-7X/HG24N9K4';
      const source = identify(sourceCode);
      const discoveries = findEquivalentCandidates(source, sourceCode, catalog);
      const results = buildCompatibilityResultsFromDiscoveries(source, discoveries);

      expect(results.length).toBeGreaterThan(1);
      const percentages = results.map((r) => calculateMatchPercentage(r).percentage);
      for (let i = 1; i < percentages.length; i += 1) {
        expect(percentages[i - 1]).toBeGreaterThanOrEqual(percentages[i]);
      }
    });
  });

  describe('discovery diagnostics snapshots', () => {
    it.each([
      'DG4V-3-2A-M-U-H7-60',
      '4WE6E-7X/HG24N9K4',
      'DSBC-50-100-PPVA-N3',
    ])('reports candidate counts for %s', (sourceCode) => {
      const summary = summarizeEquivalentCandidateDiscovery(sourceCode, catalog);
      expect(summary.totalCandidates).toBeGreaterThan(0);
      expect(summary.byReason.equivalence_group).toBeGreaterThan(0);
    });
  });
});
