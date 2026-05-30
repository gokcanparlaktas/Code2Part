import { comparePneumaticCylinders } from '@/domain/categories/pneumaticCylinder/pneumaticCylinderComparison';
import {
  extractHydraulicAttributes,
  extractPneumaticAttributes,
} from '@/domain/attributes/extractors';
import {
  getCodePatternsForSeries,
  getComparisonProfileRef,
} from '@/domain/catalog/catalogPatternSelectors';
import {
  lookupEquivalenceProfile,
  lookupEquivalenceSummaryFromCatalog,
} from '@/domain/catalog/comparisonProfileBridge';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import type { EquivalentCandidate } from '@/types/compatibility';
import type { ProductIdentification } from '@/types/product';

describe('catalog expansion prep', () => {
  describe('parsingRules-driven extraction', () => {
    it('extracts hydraulic connector from catalog codePatterns', () => {
      const code = 'DSG-01-3C2-D24-N1-50';
      const id = identifyProduct(code, normalizeCode(code));
      const patterns = getCodePatternsForSeries(id.seriesId!, 'connector');
      expect(patterns.length).toBeGreaterThan(0);

      const connector = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      }).find((a) => a.key === 'connector_type');

      expect(connector?.value).toBe('N1');
      expect(connector?.confidence).toBe('high');
    });

    it('extracts pneumatic bore/stroke from catalog parsingRules before fallback', () => {
      const code = 'DSBC-50-100-PPVA-N3';
      const id = identifyProduct(code, normalizeCode(code));
      const boreStrokePatterns = getCodePatternsForSeries(id.seriesId!, 'bore_stroke');
      expect(boreStrokePatterns.length).toBeGreaterThan(0);

      const map = new Map(
        extractPneumaticAttributes({ inputCode: code, seriesId: id.seriesId }).map((a) => [
          a.key,
          a,
        ])
      );
      expect(map.get('bore')?.value).toBe(50);
      expect(map.get('stroke')?.value).toBe(100);
    });
  });

  describe('comparisonProfileRef bridge', () => {
    it('pneumatic series reference legacy equivalence profiles', () => {
      expect(getComparisonProfileRef('festo_dsbc')).toBe('legacy:equivalenceProfiles');
      expect(getComparisonProfileRef('smc_cp96')).toBe('legacy:equivalenceProfiles');
    });

    it('lookupEquivalenceProfile resolves festo_dsbc to smc_cp96', () => {
      const profile = lookupEquivalenceProfile('festo_dsbc', 'smc_cp96');
      expect(profile?.matchLevelTr).toBe('Mekanik muadil adayı');
      expect(profile?.summaryTr).toContain('ISO 15552');
    });

    it('comparePneumaticCylinders summary unchanged via catalog bridge', () => {
      const sourceCode = 'DSBC-50-100-PPVA-N3';
      const sourceId = identifyProduct(sourceCode, normalizeCode(sourceCode));
      const source = sourceId as ProductIdentification;

      const candidate: EquivalentCandidate = {
        brand: 'SMC',
        series: 'CP96',
        seriesId: 'smc_cp96',
        productCategory: source.productCategory,
        suggestedCode: 'CP96SDB50-100',
        targetIdentification: identifyProduct(
          'CP96SDB50-100',
          normalizeCode('CP96SDB50-100')
        ) as ProductIdentification,
      };

      const fromBridge = lookupEquivalenceSummaryFromCatalog(source, candidate);
      const comparison = comparePneumaticCylinders(source, candidate);

      expect(fromBridge?.matchLevelTr).toBe('Mekanik muadil adayı');
      expect(comparison.summary.matchLevelTr).toBe('Mekanik muadil adayı');
      expect(comparison.summary.summaryTr).toBe(fromBridge?.summaryTr);
      expect(comparison.summary.riskLevel).toBe('medium');
    });
  });

  describe('H7 and exact identification regression', () => {
    it('H7 in DG4V code splits to H=24V DC (catalog check)', () => {
      const code = 'DG4V-3-2A-M-U-H7-60';
      const id = identifyProduct(code, normalizeCode(code));
      const coilRating = extractHydraulicAttributes({
        inputCode: code,
        seriesId: id.seriesId,
      }).find((a) => a.key === 'coil_rating');

      expect(coilRating?.value).toBe('H');
      expect(coilRating?.evidence).toBe('code');
      expect(coilRating?.sourceToken).toBe('H');
    });

    it('exact hydraulic example identifies with full outcome', () => {
      const code = 'DG4V-3-2A-M-U-H7-60';
      const id = identifyProduct(code, normalizeCode(code));
      expect(id.outcome).toBe('full');
      expect(id.confidence).toBe('high');
    });
  });
});
