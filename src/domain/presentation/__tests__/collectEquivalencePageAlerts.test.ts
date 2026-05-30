import { collectEquivalencePageLegacyScoreFootnote } from '@/domain/presentation/collectEquivalencePageAlerts';
import type { CompatibilityResult } from '@/types/compatibility';

function minimalResult(metadata?: CompatibilityResult['metadata']): CompatibilityResult {
  return {
    candidate: {
      seriesId: 'test',
      brand: 'A',
      series: 'S',
      productType: 'valve',
      productCategory: 'hydraulic_valve',
      standardFamily: 'x',
      suggestedCode: 'CODE-1',
      targetIdentification: null,
    },
    summary: {
      matchLevelTr: 'Test',
      summaryTr: 'Test',
      riskLevel: 'medium',
    },
    compatible: [],
    different: [],
    checkItems: [],
    warnings: [],
    metadata,
    serverMatchPercentage: 65,
  };
}

describe('collectEquivalencePageLegacyScoreFootnote', () => {
  it('returns footnote when high compatibility level has non-high match score', () => {
    const note = collectEquivalencePageLegacyScoreFootnote([
      minimalResult({
        compatibilityLevel: 'high',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      }),
    ]);

    expect(note).toContain('Yüzde skoru');
  });

  it('returns null when no candidate needs a footnote', () => {
    const note = collectEquivalencePageLegacyScoreFootnote([
      minimalResult({
        compatibilityLevel: 'medium',
        confidenceLevel: 'high',
        dataCompleteness: 'high',
      }),
    ]);

    expect(note).toBeNull();
  });
});
