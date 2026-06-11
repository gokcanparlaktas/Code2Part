import {
  clearHydraulicCenterTypeCatalogOptionsCache,
  resolveVickersFunctionTokenForRexrothSpool,
} from '@/domain/categories/hydraulicValve/hydraulicCenterTypeCatalogOptions';
import { generateHydraulicValveEquivalentCandidates } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/hydraulicValveEquivalentCodeGenerator';
import { identifyProduct } from '@/domain/resolver/identifyProduct';
import { normalizeCode } from '@/domain/resolver/normalizeCode';
import { getProductSeriesById } from '@/domain/resolver/productSeriesCatalog';

describe('Rexroth G to Vickers equivalent generation', () => {
  beforeEach(() => {
    clearHydraulicCenterTypeCatalogOptionsCache();
  });

  it('resolves Vickers 4A from Rexroth G port state', () => {
    expect(resolveVickersFunctionTokenForRexrothSpool('G')).toBe('4A');
  });

  it('generates DG4V-3-4A for 4WE6G-62/EG24N9K4 instead of closed-center 2A', () => {
    const source = identifyProduct(
      '4WE6G-62/EG24N9K4',
      normalizeCode('4WE6G-62/EG24N9K4')
    );
    const vickers = getProductSeriesById('vickers_dg4v3')!;
    const candidates = generateHydraulicValveEquivalentCandidates(source, vickers);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.generatedCode).toMatch(/DG4V-3-4A-M-U-/);
    expect(candidates[0]?.generatedCode).not.toMatch(/DG4V-3-2A-/);
    expect(candidates[0]?.generationStatus).toBe('generated_full');
  });
});
