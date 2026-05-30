import { generateBestHydraulicValveEquivalentCode } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/hydraulicValveEquivalentCodeGenerator';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import {
  applyPartialSourceEquivalenceAdjustments,
  PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR,
} from '@/domain/resolver/partialSourceEquivalents';
import { resolveProductSearch } from '@/domain/resolver/resolveProductSearch';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';
import { calculateMatchPercentage } from '@/domain/scoring/calculateMatchPercentage';

describe('partial source equivalents', () => {
  it('synthesizes Yuken code from partial Rexroth prefix with spool and design series', () => {
    const source = identifyProduct('4WE6E-7X/', normalizeCode('4WE6E-7X/'));
    const target = getProductSeriesById('yuken_dsg01');

    expect(source.outcome).toBe('series_only');
    expect(generateBestHydraulicValveEquivalentCode(source, target!)?.generatedCode).toBe(
      'DSG-01-3C2-D24-N1-70'
    );
  });

  it('returns partial alternatives for Rexroth J with coil segment', () => {
    const source = identifyProduct('4WE6J62/EG24N9K4', normalizeCode('4WE6J62/EG24N9K4'));
    const target = getProductSeriesById('yuken_dsg01');
    const resolved = resolveProductSearch('4WE6J62/EG24N9K4');
    const yukenResults = resolved.compatibilityResults.filter(
      (result) => result.candidate.seriesId === 'yuken_dsg01'
    );

    expect(yukenResults.length).toBeGreaterThan(1);
    expect(
      yukenResults
        .filter((result) => result.candidate.generation?.generationStatus !== 'exact_known')
        .every(
          (result) => result.candidate.generation?.generationStatus === 'generated_partial'
        )
    ).toBe(true);
    expect(generateBestHydraulicValveEquivalentCode(source, target!)?.generationStatus).toBe(
      'generated_partial'
    );
  });

  it('returns equivalents for series_only hydraulic prefix with warning and capped score', () => {
    const resolved = resolveProductSearch('4WE6E-7X/');

    expect(resolved.identification.outcome).toBe('series_only');
    expect(resolved.hasEquivalents).toBe(true);
    expect(resolved.equivalenceWarnings).toContain(PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR);
    expect(resolved.compatibilityResults.length).toBeGreaterThan(0);

    const top = resolved.compatibilityResults[0];
    expect(top.warnings).toContain(PARTIAL_SOURCE_EQUIVALENTS_WARNING_TR);
    expect(calculateMatchPercentage(top).percentage).toBeLessThanOrEqual(95);
    expect(top.candidate.suggestedCode).toBeTruthy();
  });

  it('caps match percentage for partial source comparisons', () => {
    const source = identifyProduct('4WE6E-7X/', normalizeCode('4WE6E-7X/'));
    const resolved = resolveProductSearch('4WE6E-7X/');
    const adjusted = applyPartialSourceEquivalenceAdjustments(
      source,
      resolved.compatibilityResults
    );

    expect(adjusted[0]?.serverMatchPercentage).toBeLessThanOrEqual(95);
  });
});
