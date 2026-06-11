import {
  clearVickersCoilByUnifiedCache,
  mapUnifiedCoilToVickers,
} from '@/domain/codeCreator/hydraulicCoilVoltageCatalogOptions';
import { resolveTargetCoilToken } from '@/domain/categories/hydraulicValve/equivalentCodeGeneration/resolveTargetHydraulicAttributeToken';
import { resolveCanonicalAttribute } from '@/domain/canonical/resolveCanonicalAttribute';
import { HYDRAULIC_VALVE_CATEGORY } from '@/types/category';

describe('resolveTargetHydraulicAttributeToken', () => {
  beforeEach(() => {
    clearVickersCoilByUnifiedCache();
  });

  it('maps Vickers H7 to DC_24V in canonical registry', () => {
    const resolved = resolveCanonicalAttribute({
      category: HYDRAULIC_VALVE_CATEGORY,
      attributeKey: 'coil_rating',
      rawToken: 'H7',
      manufacturer: 'Vickers',
      series: 'DG4V-3',
    });

    expect(resolved.canonicalKey).toBe('DC_24V');
    expect(resolved.resolved).toBe(true);
  });

  it('maps unified dc_24v to parseable Vickers H7 ordering token', () => {
    expect(mapUnifiedCoilToVickers('dc_24v')).toBe('H7');
  });

  it('resolves Rexroth EG24 to Vickers H7 via canonical voltage class', () => {
    expect(resolveTargetCoilToken('EG24', 'rexroth', 'vickers')).toBe('H7');
  });

  it('resolves Yuken D24 to Rexroth EG24 via canonical voltage class', () => {
    expect(resolveTargetCoilToken('D24', 'yuken', 'rexroth')).toBe('EG24');
  });
});
