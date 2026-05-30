import { collectEquivalencePageWarnings } from '@/domain/presentation/collectEquivalencePageWarnings';
import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';
import { GENERIC_COMPATIBILITY_WARNING_TEXTS } from '@/domain/presentation/filterGenericCompatibilityWarnings';
import type { CompatibilityResult } from '@/types/compatibility';

function minimalResult(warnings: string[]): CompatibilityResult {
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
    warnings,
  };
}

describe('collectEquivalencePageWarnings', () => {
  it('dedupes repeated warnings across candidates and suppresses generic disclaimer warnings', () => {
    const shared = [
      'Bobin voltajı uygulama koşullarına göre farklılık gösterebilir.',
      GENERIC_COMPATIBILITY_WARNING_TEXTS[0],
    ];
    const page = collectEquivalencePageWarnings([
      minimalResult(shared),
      minimalResult(shared),
    ]);
    expect(page).not.toContain(GENERAL_ORDER_CATALOG_WARNING_TR);
    expect(page).not.toContain(GENERIC_COMPATIBILITY_WARNING_TEXTS[0]);
    expect(page).toEqual(['Bobin voltajı uygulama koşullarına göre farklılık gösterebilir.']);
  });
});
