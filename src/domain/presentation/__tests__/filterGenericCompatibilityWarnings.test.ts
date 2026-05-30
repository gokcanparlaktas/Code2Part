import {
  filterGenericCompatibilityWarningsForUi,
  GENERIC_COMPATIBILITY_WARNING_TEXTS,
  isGenericCompatibilityWarning,
} from '@/domain/presentation/filterGenericCompatibilityWarnings';
import { GENERAL_ORDER_CATALOG_WARNING_TR } from '@/domain/presentation/formatUserFacingCatalogDisplay';

describe('filterGenericCompatibilityWarningsForUi', () => {
  it('identifies all generic warning texts', () => {
    for (const warning of GENERIC_COMPATIBILITY_WARNING_TEXTS) {
      expect(isGenericCompatibilityWarning(warning)).toBe(true);
    }
  });

  it('removes generic warnings but keeps specific ones', () => {
    const filtered = filterGenericCompatibilityWarningsForUi([
      GENERIC_COMPATIBILITY_WARNING_TEXTS[0],
      'Konnektör tipi farklı olabilir; katalogdan doğrulanmalıdır.',
      GENERAL_ORDER_CATALOG_WARNING_TR,
      'Conta malzemesi farklı olabilir.',
    ]);

    expect(filtered).toEqual([
      'Konnektör tipi farklı olabilir; katalogdan doğrulanmalıdır.',
      'Conta malzemesi farklı olabilir.',
    ]);
  });
});
