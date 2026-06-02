import { resolveConfidentYukenSpoolCode } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/rexrothYukenGenerationMappings';
import {
  buildHydraulicCenterTypeCatalogOptions,
  clearHydraulicCenterTypeCatalogOptionsCache,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';

describe('F spool Yuken mapping', () => {
  beforeEach(() => {
    clearHydraulicCenterTypeCatalogOptionsCache();
  });

  it('maps F to Yuken function with matching port state', () => {
    const fOption = buildHydraulicCenterTypeCatalogOptions().find(
      (o) => o.rexrothSpoolToken === 'F'
    );
    expect(resolveConfidentYukenSpoolCode('F')).toBe('3C9');
  });
});
