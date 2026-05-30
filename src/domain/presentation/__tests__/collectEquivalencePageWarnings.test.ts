import { collectEquivalencePageWarnings } from '@/domain/presentation/collectEquivalencePageWarnings';
import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';
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
  it('dedupes repeated warnings across candidates', () => {
    const shared = [
      'Sürgü merkez davranışı eşleşmesi, inceleme gerektiren katalog aday verisindeki port durumlarına dayanır',
      'Hidrolik valflerde sembol, sürgü tipi ve bobin voltajı mutlaka kontrol edilmelidir.',
    ];
    const page = collectEquivalencePageWarnings([
      minimalResult(shared),
      minimalResult(shared),
    ]);
    expect(page).toContain(GENERAL_ORDER_CATALOG_WARNING_TR);
    expect(page.length).toBeLessThanOrEqual(3);
  });
});
